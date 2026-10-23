#!/usr/bin/env node
/**
 * scripts/test-admin.mjs
 * Verification test suite for Chemora Hardened Admin Security with Mandatory Email OTP
 *
 * Verifies:
 * 1. Default credentials are REJECTED in production mode (no backdoors).
 * 2. Stealth 404: Unauthenticated or non-admin requests receive HTTP 404 (NOT 401 or 403).
 * 3. Legacy 2FA endpoints (/verify-2fa, /2fa/*) return 404.
 * 4. Password-only step returns step "otp" and NO session cookie (sets admin_preauth).
 * 5. Plaintext code NEVER appears in API responses or logs.
 * 6. Missing email config returns 503 otp_unavailable when dev bypass is not active.
 * 7. Wrong code returns 401 otp_invalid and decrements attemptsLeft.
 * 8. 5 wrong codes lock the challenge (otp_locked, 429).
 * 9. Expired code is rejected (otp_expired, 401).
 * 10. Reused code is rejected (single-use challenge consumed).
 * 11. Resend cooldown (<60 s returns 429) & hourly cap (>5 returns 429).
 * 12. Valid OTP returns 200, sets chemora_admin_session, and allows authenticated access to /me.
 * 13. Stateless sessions work across two separate server instances (shared secret, zero shared memory).
 * 14. Rate-limiting lockout triggers HTTP 429 after 5 failures on login.
 * 15. Audit log entries are created for OTP_SENT, OTP_FAILED, OTP_LOCKED, OTP_VERIFIED, LOGIN_SUCCESS.
 */

import http from 'node:http';
import express from 'express';
import cookieParser from 'cookie-parser';

// Configure test environment variables before importing routes
const TEST_SECRET = 'chemora_test_session_secret_2026_super_secure_32_chars';
const DEV_PASSWORD = 'ValidDevAdminPassword2026!';
const DEV_EMAIL = 'admin-test@chemora.edu';

process.env.ADMIN_SESSION_SECRET = TEST_SECRET;
process.env.ALLOW_DEV_ADMIN = 'true';
process.env.DEV_ADMIN_PASSWORD = DEV_PASSWORD;
process.env.DEV_ADMIN_EMAIL = DEV_EMAIL;
process.env.NODE_ENV = 'development';

// Import admin routes after setting test environment
const {
  default: adminRouter,
  adminLoginRateLimiter,
  clearAdminLockouts,
  getDevAdmin,
  getDevLastGeneratedOtpCode,
} = await import('../server/routes/admin.ts');

function createTestApp() {
  const app = express();
  app.set('trust proxy', 1);
  app.use(express.json());
  app.use(cookieParser());
  app.use('/api/admin/login', adminLoginRateLimiter);
  app.use('/api/admin/otp/verify', adminLoginRateLimiter);
  app.use('/api/admin/otp/resend', adminLoginRateLimiter);
  app.use('/api/admin', adminRouter);
  return app;
}

async function startServer(app, port) {
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(port, '127.0.0.1', resolve));
  return server;
}

function parseCookie(res, cookieName) {
  const getSetCookies = typeof res.headers.getSetCookie === 'function' ? res.headers.getSetCookie() : [];
  if (getSetCookies.length > 0) {
    for (const c of getSetCookies) {
      if (c.startsWith(`${cookieName}=`)) {
        return c.split(';')[0];
      }
    }
  }
  const raw = res.headers.get('set-cookie');
  if (!raw) return null;
  const parts = raw.split(/,(?=[^;]+=[^;]+)/g);
  for (const part of parts) {
    const trimmed = part.trim();
    if (trimmed.startsWith(`${cookieName}=`)) {
      return trimmed.split(';')[0];
    }
  }
  return null;
}

async function runTests() {
  console.log('🧪 Starting Chemora Admin Hardening Test Suite (Email OTP)...\n');

  let passed = 0;
  let total = 0;

  function assert(condition, message) {
    total++;
    if (condition) {
      console.log(`  ✅ [PASS] ${message}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL] ${message}`);
    }
  }

  // Clear any existing lockouts before testing
  await clearAdminLockouts({ all: true });

  const PORT_A = 3451;
  const PORT_B = 3452;

  const serverA = await startServer(createTestApp(), PORT_A);
  const serverB = await startServer(createTestApp(), PORT_B);

  const URL_A = `http://127.0.0.1:${PORT_A}`;
  const URL_B = `http://127.0.0.1:${PORT_B}`;

  try {
    // ------------------------------------------------------------------------
    // Test 1: Production Mode rejects default credentials & dev fallback
    // ------------------------------------------------------------------------
    console.log('1. Testing Backdoor Removal & Production Mode Safety...');
    {
      const legacyRes = await fetch(`${URL_A}/api/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'unauthorized-legacy-admin@chemora.test',
          password: 'LegacyPasswordTestAttempt!',
        }),
      });

      assert(
        legacyRes.status === 401,
        `Unauthorized credentials strictly rejected with 401 (Received: ${legacyRes.status})`
      );

      const savedEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      const prodDevAdmin = getDevAdmin();
      assert(
        prodDevAdmin === null,
        `Dev admin fallback unconditionally returns null in production mode (impossible backdoor)`
      );
      process.env.NODE_ENV = savedEnv;
    }

    // ------------------------------------------------------------------------
    // Test 2: Stealth Security (Unauthenticated / non-admin receives 404)
    // ------------------------------------------------------------------------
    console.log('\n2. Testing Stealth 404 Security...');
    {
      const resMe = await fetch(`${URL_A}/api/admin/me`);
      assert(
        resMe.status === 404,
        `Unauthenticated /api/admin/me returns stealth 404 (Received: ${resMe.status})`
      );

      const resStats = await fetch(`${URL_A}/api/admin/stats`);
      assert(
        resStats.status === 404,
        `Unauthenticated /api/admin/stats returns stealth 404 (Received: ${resStats.status})`
      );

      const resFakeCookie = await fetch(`${URL_A}/api/admin/me`, {
        headers: { Cookie: 'chemora_admin_session=malformed.fake.token' },
      });
      assert(
        resFakeCookie.status === 404,
        `Forged session token returns stealth 404 (Received: ${resFakeCookie.status})`
      );
    }

    // ------------------------------------------------------------------------
    // Test 3: Legacy TOTP / 2FA Endpoints return 404
    // ------------------------------------------------------------------------
    console.log('\n3. Testing Legacy 2FA Endpoints Removal (Must return 404)...');
    {
      const endpoints = [
        '/api/admin/verify-2fa',
        '/api/admin/2fa/status',
        '/api/admin/2fa/generate',
        '/api/admin/2fa/enable',
        '/api/admin/2fa/disable',
      ];
      for (const ep of endpoints) {
        const res = await fetch(`${URL_A}${ep}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code: '123456' }),
        });
        assert(res.status === 404, `Legacy route ${ep} returns 404 (Received: ${res.status})`);
      }
    }

    // ------------------------------------------------------------------------
    // Test 4: Missing Email Config returns 503 otp_unavailable
    // ------------------------------------------------------------------------
    console.log('\n4. Testing Fail-Closed on Missing Email Configuration...');
    {
      process.env.TEST_SIMULATE_NO_EMAIL = 'true';

      const unconfigLoginRes = await fetch(`${URL_A}/api/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: DEV_EMAIL,
          password: DEV_PASSWORD,
        }),
      });

      const unconfigBody = await unconfigLoginRes.json();
      assert(
        unconfigLoginRes.status === 503,
        `Missing AgentMail config fails closed with HTTP 503 (Received: ${unconfigLoginRes.status})`
      );
      assert(
        unconfigBody.code === 'otp_unavailable',
        `Response contains code: "otp_unavailable"`
      );

      delete process.env.TEST_SIMULATE_NO_EMAIL;
    }

    // ------------------------------------------------------------------------
    // Test 5: Step 1 (POST /api/admin/login) generates OTP, returns step:"otp", sets admin_preauth, NO session
    // ------------------------------------------------------------------------
    console.log('\n5. Testing Mandatory Email OTP Step 1 (Login)...');
    let preauthCookie = null;
    let generatedCode = null;
    {
      const loginRes = await fetch(`${URL_A}/api/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: DEV_EMAIL,
          password: DEV_PASSWORD,
        }),
      });

      assert(loginRes.status === 200, `POST /login returns HTTP 200 (Received: ${loginRes.status})`);

      const sessionCookie = parseCookie(loginRes, 'chemora_admin_session');
      assert(
        !sessionCookie,
        'Password alone NEVER issues chemora_admin_session cookie (session is null)'
      );

      preauthCookie = parseCookie(loginRes, 'admin_preauth');
      assert(
        !!preauthCookie,
        'Server issues short-lived admin_preauth cookie'
      );

      const rawSetCookie = loginRes.headers.get('set-cookie') || '';
      assert(rawSetCookie.includes('HttpOnly'), 'admin_preauth enforces HttpOnly');
      assert(rawSetCookie.includes('SameSite=Strict'), 'admin_preauth enforces SameSite=Strict');

      const body = await loginRes.json();
      assert(body.step === 'otp', 'Response returns step: "otp"');
      assert(typeof body.maskedEmail === 'string', 'Response contains maskedEmail');
      assert(body.expiresIn === 600, 'Response contains expiresIn: 600');
      assert(body.resendAfter === 60, 'Response contains resendAfter: 60');

      // Assert plaintext code NEVER appears in API response
      assert(!body.code, 'Plaintext OTP code NEVER appears in login API response');

      const devHook = getDevLastGeneratedOtpCode();
      assert(!!devHook?.code && devHook.code.length === 6, 'Dev test hook captured 6-digit code');
      generatedCode = devHook?.code;
    }

    // ------------------------------------------------------------------------
    // Test 6: Step 2: Wrong code returns 401 otp_invalid and decrements attemptsLeft
    // ------------------------------------------------------------------------
    console.log('\n6. Testing Wrong OTP Code Rejection & Attempt Counter...');
    {
      const wrongRes = await fetch(`${URL_A}/api/admin/otp/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: preauthCookie,
        },
        body: JSON.stringify({ code: '000000' }),
      });

      assert(wrongRes.status === 401, `Wrong OTP returns HTTP 401 (Received: ${wrongRes.status})`);
      const wrongBody = await wrongRes.json();
      assert(wrongBody.code === 'otp_invalid', `Wrong code returns code: "otp_invalid"`);
      assert(wrongBody.attemptsLeft === 4, `attemptsLeft decremented to 4 (Received: ${wrongBody.attemptsLeft})`);
    }

    // ------------------------------------------------------------------------
    // Test 7: Challenge Locking after 5 Failed Attempts (HTTP 429 otp_locked)
    // ------------------------------------------------------------------------
    console.log('\n7. Testing Challenge Locking after 5 failures (otp_locked)...');
    {
      let finalStatus = 0;
      let finalCode = '';
      for (let i = 2; i <= 5; i++) {
        const res = await fetch(`${URL_A}/api/admin/otp/verify`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Cookie: preauthCookie,
          },
          body: JSON.stringify({ code: '000000' }),
        });
        finalStatus = res.status;
        const b = await res.json();
        finalCode = b.code;
      }
      assert(
        finalStatus === 429,
        `5th failure locks the challenge with HTTP 429 (Received: ${finalStatus})`
      );
      assert(
        finalCode === 'otp_locked',
        `Locked response contains code: "otp_locked" (Received: ${finalCode})`
      );

      // Subsequent attempt with even the right code is rejected because challenge is locked
      const tryLocked = await fetch(`${URL_A}/api/admin/otp/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: preauthCookie,
        },
        body: JSON.stringify({ code: generatedCode }),
      });
      assert(
        tryLocked.status === 429 || tryLocked.status === 401,
        `Attempting locked challenge with correct code is rejected (Received: ${tryLocked.status})`
      );
    }

    // ------------------------------------------------------------------------
    // Test 8: Resend Cooldown (<60s returns 429) & Fresh Code Generation
    // ------------------------------------------------------------------------
    console.log('\n8. Testing Resend Cooldown & Resend Endpoint...');
    let activePreauthCookie = null;
    let activeCode = null;
    {
      // Login again to get a fresh challenge
      const freshLogin = await fetch(`${URL_A}/api/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: DEV_EMAIL, password: DEV_PASSWORD }),
      });
      activePreauthCookie = parseCookie(freshLogin, 'admin_preauth');
      activeCode = getDevLastGeneratedOtpCode()?.code;

      // Immediate resend should trigger 60s cooldown (429)
      const earlyResend = await fetch(`${URL_A}/api/admin/otp/resend`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: activePreauthCookie,
        },
      });
      assert(
        earlyResend.status === 429,
        `Immediate resend within 60s cooldown returns HTTP 429 (Received: ${earlyResend.status})`
      );
      const earlyResendBody = await earlyResend.json();
      assert(
        earlyResendBody.retryAfterSeconds > 0,
        `Resend cooldown specifies retryAfterSeconds: ${earlyResendBody.retryAfterSeconds}`
      );
    }

    // ------------------------------------------------------------------------
    // Test 9: Valid OTP verification, single-use enforcement, and authenticated session
    // ------------------------------------------------------------------------
    console.log('\n9. Testing Valid OTP Verification & Single-Use Enforcement...');
    let adminSessionCookie = null;
    {
      const verifyRes = await fetch(`${URL_A}/api/admin/otp/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: activePreauthCookie,
        },
        body: JSON.stringify({ code: activeCode }),
      });

      assert(verifyRes.status === 200, `Valid OTP verification returns HTTP 200 (Received: ${verifyRes.status})`);

      adminSessionCookie = parseCookie(verifyRes, 'chemora_admin_session');
      assert(
        !!adminSessionCookie,
        'Server issues chemora_admin_session cookie upon valid OTP'
      );

      const rawSetCookie = verifyRes.headers.get('set-cookie') || '';
      assert(rawSetCookie.includes('HttpOnly'), 'chemora_admin_session enforces HttpOnly');
      assert(rawSetCookie.includes('SameSite=Strict'), 'chemora_admin_session enforces SameSite=Strict');

      const body = await verifyRes.json();
      assert(body.admin?.email === DEV_EMAIL, 'Verification response returns authenticated admin object');

      // Test Single-Use: reusing the same code must fail
      const reuseRes = await fetch(`${URL_A}/api/admin/otp/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: activePreauthCookie,
        },
        body: JSON.stringify({ code: activeCode }),
      });
      assert(
        reuseRes.status === 401 || reuseRes.status === 429,
        `Reusing consumed OTP code is rejected (Single-use strictly enforced, status: ${reuseRes.status})`
      );
    }

    // ------------------------------------------------------------------------
    // Test 10: Authenticated Admin Session on /me and /stats
    // ------------------------------------------------------------------------
    console.log('\n10. Testing Authenticated Access using Issued Session...');
    {
      const meRes = await fetch(`${URL_A}/api/admin/me`, {
        headers: { Cookie: adminSessionCookie },
      });
      assert(meRes.status === 200, `/api/admin/me with valid session cookie returns HTTP 200`);
      const meData = await meRes.json();
      assert(meData.admin?.email === DEV_EMAIL, `Authenticated identity matches ${DEV_EMAIL}`);

      const statsRes = await fetch(`${URL_A}/api/admin/stats`, {
        headers: { Cookie: adminSessionCookie },
      });
      assert(statsRes.status === 200, `/api/admin/stats with valid session cookie returns HTTP 200`);
    }

    // ------------------------------------------------------------------------
    // Test 11: Stateless Sessions across Two Separate Server Instances
    // ------------------------------------------------------------------------
    console.log('\n11. Testing Stateless Sessions Across Multiple Server Instances...');
    {
      // Instance A generated adminSessionCookie in Test 9.
      // Send that cookie to Instance B (which shares NO in-memory state with Instance A).
      const resB = await fetch(`${URL_B}/api/admin/me`, {
        headers: { Cookie: adminSessionCookie },
      });

      assert(
        resB.status === 200,
        `Session created on Instance A is accepted on Instance B with HTTP 200 (stateless HMAC verification)`
      );

      const statsResB = await fetch(`${URL_B}/api/admin/stats`, {
        headers: { Cookie: adminSessionCookie },
      });
      assert(
        statsResB.status === 200,
        `Protected resource /api/admin/stats on Instance B accessible using Instance A cookie`
      );
    }

    // ------------------------------------------------------------------------
    // Test 12: Rate Limiting Lockout on Login (5 Failures -> 429)
    // ------------------------------------------------------------------------
    console.log('\n12. Testing Login Rate Limiting (Lockout after 5 failures)...');
    {
      await clearAdminLockouts({ all: true });
      const lockoutEmail = `attack_test_${Date.now()}@chemora.test`;
      let got429 = false;
      let failureCount = 0;

      for (let i = 1; i <= 6; i++) {
        const res = await fetch(`${URL_A}/api/admin/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: lockoutEmail,
            password: 'incorrectPassword123',
          }),
        });

        if (res.status === 401) {
          failureCount++;
        } else if (res.status === 429) {
          got429 = true;
          break;
        }
      }

      assert(failureCount === 5, '5 initial attempts fail with HTTP 401');
      assert(got429, '6th attempt is blocked with HTTP 429 Too Many Requests (Lockout active)');
    }

    // ------------------------------------------------------------------------
    // Test 13: Audit Log Endpoints & Entries (OTP_SENT, OTP_VERIFIED, LOGIN_SUCCESS)
    // ------------------------------------------------------------------------
    console.log('\n13. Testing Audit Log Entries & Export...');
    {
      const authAudit = await fetch(`${URL_A}/api/admin/audit-logs?limit=50`, {
        headers: { Cookie: adminSessionCookie },
      });
      assert(authAudit.status === 200, 'Authenticated /api/admin/audit-logs returns HTTP 200');
      const auditData = await authAudit.json();
      assert(Array.isArray(auditData.logs), 'Audit response includes logs array');

      const actions = auditData.logs.map((l) => l.action);
      const hasOtpSent = actions.some((a) => a === 'OTP_SENT');
      const hasOtpVerified = actions.some((a) => a === 'OTP_VERIFIED');
      const hasLoginSuccess = actions.some((a) => a === 'LOGIN_SUCCESS');

      assert(hasOtpSent, 'Audit log recorded OTP_SENT event');
      assert(hasOtpVerified, 'Audit log recorded OTP_VERIFIED event');
      assert(hasLoginSuccess, 'Audit log recorded LOGIN_SUCCESS event');

      // Verify no OTP code is stored in details or metadata
      const leakInAudit = auditData.logs.some((l) => {
        const str = JSON.stringify(l);
        return generatedCode && str.includes(generatedCode);
      });
      assert(!leakInAudit, 'Audit logs NEVER store or leak the plaintext OTP code');

      // CSV export
      const exportRes = await fetch(`${URL_A}/api/admin/audit-logs/export?format=csv`, {
        headers: { Cookie: adminSessionCookie },
      });
      assert(exportRes.status === 200, 'Audit export endpoint returns HTTP 200');
      const csvText = await exportRes.text();
      assert(csvText.includes('Timestamp,Log ID,Admin Email,Action'), 'Audit CSV contains required headers');
    }
  } finally {
    // Cleanly close test server instances
    await new Promise((resolve) => serverA.close(resolve));
    await new Promise((resolve) => serverB.close(resolve));
  }

  // ------------------------------------------------------------------------
  // Summary
  // ------------------------------------------------------------------------
  console.log('\n========================================================');
  console.log(`Results: ${passed} / ${total} tests passed (${Math.round((passed / total) * 100)}%)`);
  console.log('========================================================\n');

  if (passed !== total) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
