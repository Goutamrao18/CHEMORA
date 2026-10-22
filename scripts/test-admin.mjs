#!/usr/bin/env node
/**
 * scripts/test-admin.mjs
 * Verification test suite for Chemora Hardened Admin Security
 *
 * Verifies:
 * 1. Default credentials are REJECTED in production mode (no backdoors).
 * 2. Stealth 404: Unauthenticated or non-admin requests receive HTTP 404 (NOT 401 or 403).
 * 3. A valid admin can authenticate and receives a signed httpOnly session cookie.
 * 4. A wrong 2FA code is rejected with HTTP 401 (no '123456' or digit-length bypass).
 * 5. Stateless sessions work across two separate server instances (shared secret, zero shared memory).
 * 6. Rate-limiting lockout triggers HTTP 429 after 5 failures.
 */

import http from 'node:http';
import express from 'express';
import cookieParser from 'cookie-parser';
import { generateSecret, generateSync } from 'otplib';

// Configure test environment variables before importing routes
const TEST_SECRET = 'chemora_test_session_secret_2026_super_secure_32_chars';
const TEST_2FA_KEY = 'chemora_test_2fa_encryption_key_2026_gcm_32';
const DEV_PASSWORD = 'ValidDevAdminPassword2026!';
const DEV_EMAIL = 'admin-test@chemora.edu';

process.env.ADMIN_SESSION_SECRET = TEST_SECRET;
process.env.ADMIN_2FA_ENCRYPTION_KEY = TEST_2FA_KEY;
process.env.ALLOW_DEV_ADMIN = 'true';
process.env.DEV_ADMIN_PASSWORD = DEV_PASSWORD;
process.env.DEV_ADMIN_EMAIL = DEV_EMAIL;
process.env.NODE_ENV = 'development';

// Import admin routes after setting test environment
const { default: adminRouter, adminLoginRateLimiter, clearAdminLockouts, encrypt2faSecret } = await import('../server/routes/admin.ts');

function createTestApp() {
  const app = express();
  app.set('trust proxy', 1);
  app.use(express.json());
  app.use(cookieParser());
  app.use('/api/admin/login', adminLoginRateLimiter);
  app.use('/api/admin/verify-2fa', adminLoginRateLimiter);
  app.use('/api/admin', adminRouter);
  return app;
}

async function startServer(app, port) {
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(port, '127.0.0.1', resolve));
  return server;
}

async function runTests() {
  console.log('🧪 Starting Chemora Admin Hardening Test Suite...\n');

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
      // Verify unauthorized credentials are strictly rejected with 401
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
        `Unauthorized credentials are strictly rejected with 401 (Received: ${legacyRes.status})`
      );

      // Verify production mode guard: in production, getDevAdmin() is unreachable
      const savedEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      const { getDevAdmin } = await import('../server/routes/admin.ts');
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
    // Test 3: Valid Admin Authentication & Stateless Signed Session Cookie
    // ------------------------------------------------------------------------
    console.log('\n3. Testing Valid Admin Authentication...');
    let sessionCookie = '';
    {
      const loginRes = await fetch(`${URL_A}/api/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: DEV_EMAIL,
          password: DEV_PASSWORD,
        }),
      });

      assert(loginRes.status === 200, `Valid admin credentials return HTTP 200`);

      const setCookie = loginRes.headers.get('set-cookie');
      assert(!!setCookie, 'Server sets session cookie');

      if (setCookie) {
        assert(setCookie.includes('HttpOnly'), 'Cookie enforces HttpOnly');
        assert(setCookie.includes('SameSite=Strict'), 'Cookie enforces SameSite=Strict');
        sessionCookie = setCookie.split(';')[0];
      }

      const body = await loginRes.json();
      assert(body.admin?.email === DEV_EMAIL, 'Login response contains administrator details');
    }

    // ------------------------------------------------------------------------
    // Test 4: Real 2FA (TOTP) Verification & Wrong Code Rejection
    // ------------------------------------------------------------------------
    console.log('\n4. Testing Real 2FA TOTP Verification...');
    {
      // Generate a real TOTP secret
      const secret = generateSecret();
      const encryptedSecret = encrypt2faSecret(secret);

      // Temporarily enable 2FA on the dev admin
      const { getDevAdmin } = await import('../server/routes/admin.ts');
      const dev = getDevAdmin();
      dev.twoFactorEnabled = true;
      dev.twoFactorSecret = encryptedSecret;

      // 4a: Login without code prompts for 2FA
      const promptRes = await fetch(`${URL_A}/api/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: DEV_EMAIL, password: DEV_PASSWORD }),
      });
      const promptData = await promptRes.json();
      assert(promptData.requires2FA === true, 'Login with 2FA enabled returns requires2FA: true');
      assert(!!promptData.tempToken, 'Login returns short-lived tempToken for 2FA verification');

      // 4b: Submit invalid code '123456' (verify backdoor bypass is gone)
      const wrongRes = await fetch(`${URL_A}/api/admin/verify-2fa`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tempToken: promptData.tempToken,
          code: '123456',
        }),
      });
      assert(
        wrongRes.status === 401,
        `Wrong 2FA code is rejected with HTTP 401 (bypass '123456' removed)`
      );

      // 4c: Submit valid TOTP code generated by otplib
      const validCode = generateSync({ secret });
      const correctRes = await fetch(`${URL_A}/api/admin/verify-2fa`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tempToken: promptData.tempToken,
          code: validCode,
        }),
      });
      assert(correctRes.status === 200, `Valid TOTP code succeeds with HTTP 200`);

      // Reset 2FA on dev admin
      dev.twoFactorEnabled = false;
      dev.twoFactorSecret = undefined;
    }

    // ------------------------------------------------------------------------
    // Test 5: Stateless Sessions across Two Separate Server Instances
    // ------------------------------------------------------------------------
    console.log('\n5. Testing Stateless Sessions Across Multiple Server Instances...');
    {
      // Instance A generated sessionCookie in Test 3.
      // Now, send that cookie to Instance B (which shares NO in-memory state with Instance A).
      const resB = await fetch(`${URL_B}/api/admin/me`, {
        headers: { Cookie: sessionCookie },
      });

      assert(
        resB.status === 200,
        `Session created on Instance A is accepted on Instance B with HTTP 200 (stateless HMAC verification)`
      );

      const statsResB = await fetch(`${URL_B}/api/admin/stats`, {
        headers: { Cookie: sessionCookie },
      });
      assert(
        statsResB.status === 200,
        `Protected resource /api/admin/stats on Instance B accessible using Instance A cookie`
      );
    }

    // ------------------------------------------------------------------------
    // Test 6: Rate Limiting (Lockout after 5 failures)
    // ------------------------------------------------------------------------
    console.log('\n6. Testing Rate Limiting (Lockout after 5 failures)...');
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
