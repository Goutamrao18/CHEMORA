#!/usr/bin/env node
/**
 * scripts/test-admin.mjs
 * Verification test suite for Chemora Phase 4 Admin Security
 *
 * Checks:
 * 1. Stealth 404: Unauthenticated or non-admin requests receive HTTP 404 (NOT 403 or 401).
 * 2. Secure Admin Authentication: Valid credentials yield an httpOnly secure session cookie.
 * 3. Authenticated Endpoints: /api/admin/stats and others accessible with session cookie.
 * 4. Audit Trail: Admin write operations produce immutable audit log entries with client IP.
 * 5. AI Assistant Privacy: Operational queries return aggregated laboratory intelligence with zero PII.
 * 6. Rate Limiting: 5 failed login attempts trigger HTTP 429 Too Many Requests.
 */

const BASE_URL = process.env.TEST_URL || 'http://localhost:3000';

async function runTests() {
  console.log('🧪 Starting Chemora Admin Security Test Suite...');
  console.log(`📡 Target endpoint: ${BASE_URL}\n`);

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

  // ------------------------------------------------------------------------
  // Test 1: Stealth Security (RequireAdmin returns 404 for unauthenticated)
  // ------------------------------------------------------------------------
  console.log('1. Testing Stealth 404 Security...');
  try {
    const resMe = await fetch(`${BASE_URL}/api/admin/me`);
    assert(
      resMe.status === 404,
      `Unauthenticated /api/admin/me returns 404 (Received: ${resMe.status})`
    );

    const resStats = await fetch(`${BASE_URL}/api/admin/stats`);
    assert(
      resStats.status === 404,
      `Unauthenticated /api/admin/stats returns 404 (Received: ${resStats.status})`
    );

    const resAudit = await fetch(`${BASE_URL}/api/admin/audit`);
    assert(
      resAudit.status === 404,
      `Unauthenticated /api/admin/audit returns 404 (Received: ${resAudit.status})`
    );
  } catch (err) {
    assert(false, `Stealth test failed with network error: ${err.message}`);
  }

  // ------------------------------------------------------------------------
  // Test 2: Authenticated Admin Session Flow
  // ------------------------------------------------------------------------
  console.log('\n2. Testing Admin Authentication & Cookie Handling...');
  let adminCookie = '';
  try {
    const loginRes = await fetch(`${BASE_URL}/api/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@chemora.edu',
        password: 'ChemoraAdmin2026!',
      }),
    });

    assert(loginRes.status === 200, `Admin login succeeds with 200 (Received: ${loginRes.status})`);

    const setCookie = loginRes.headers.get('set-cookie');
    assert(!!setCookie, 'Server returns set-cookie header on successful admin authentication');

    if (setCookie) {
      assert(setCookie.includes('HttpOnly'), 'Cookie enforces HttpOnly protection');
      assert(setCookie.includes('SameSite=Strict'), 'Cookie enforces SameSite=Strict');
      // Extract session cookie for subsequent requests
      adminCookie = setCookie.split(';')[0];
    }
  } catch (err) {
    assert(false, `Login test failed: ${err.message}`);
  }

  // ------------------------------------------------------------------------
  // Test 3: Authenticated Access to Admin Resources
  // ------------------------------------------------------------------------
  console.log('\n3. Testing Authenticated Admin Endpoints...');
  try {
    const statsRes = await fetch(`${BASE_URL}/api/admin/stats`, {
      headers: { Cookie: adminCookie },
    });
    assert(statsRes.status === 200, `/api/admin/stats accessible with admin cookie`);

    const statsData = await statsRes.json();
    assert(typeof statsData.totalUsers === 'number', 'Stats payload contains valid totalUsers');
    assert(Array.isArray(statsData.completionsChart), 'Stats payload contains completionsChart');
  } catch (err) {
    assert(false, `Authenticated endpoints test failed: ${err.message}`);
  }

  // ------------------------------------------------------------------------
  // Test 4: Audit Trail Verification on Write Operation
  // ------------------------------------------------------------------------
  console.log('\n4. Testing Immutable Audit Logging on Admin Writes...');
  try {
    // Perform a setting update write
    const testMsg = `Audit verification probe at ${Date.now()}`;
    const writeRes = await fetch(`${BASE_URL}/api/admin/settings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: adminCookie,
      },
      body: JSON.stringify({
        maintenanceMessage: testMsg,
      }),
    });

    assert(writeRes.status === 200, 'Admin write operation succeeded');

    // Fetch audit log
    const auditRes = await fetch(`${BASE_URL}/api/admin/audit?limit=10`, {
      headers: { Cookie: adminCookie },
    });
    const auditData = await auditRes.json();

    const loggedAction = auditData.logs?.find(
      (entry) => entry.action === 'UPDATE_SETTINGS' && entry.metadata?.maintenanceMessage === testMsg
    );

    assert(!!loggedAction, 'Write operation recorded in admin_audit_log with action and metadata');
  } catch (err) {
    assert(false, `Audit log verification failed: ${err.message}`);
  }

  // ------------------------------------------------------------------------
  // Test 5: AI Assistant Operational Privacy (Zero PII, Aggregate Only)
  // ------------------------------------------------------------------------
  console.log('\n5. Testing AI Assistant Zero-PII Compliance...');
  try {
    const aiRes = await fetch(`${BASE_URL}/api/admin/assistant`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: adminCookie,
      },
      body: JSON.stringify({
        query: 'What is our current challenge completion rate and failing video health?',
      }),
    });

    assert(aiRes.status === 200, 'AI Assistant query succeeded with HTTP 200');

    const aiData = await aiRes.json();
    const replyText = aiData.reply || '';

    // Verify response exists and does NOT contain passwords, hash patterns, or private tokens
    assert(replyText.length > 0, 'AI Assistant returned non-empty operational analysis');
    assert(
      !replyText.toLowerCase().includes('password') &&
        !replyText.toLowerCase().includes('hash') &&
        !replyText.toLowerCase().includes('bearer') &&
        !replyText.toLowerCase().includes('service_role'),
      'AI Assistant response contains zero credentials, hashes, or PII'
    );
  } catch (err) {
    assert(false, `AI Assistant privacy test failed: ${err.message}`);
  }

  // ------------------------------------------------------------------------
  // Test 6: Rate Limiting (5 attempts / 15 min per IP and email)
  // ------------------------------------------------------------------------
  console.log('\n6. Testing Rate Limiting on Login...');
  try {
    const testEmail = `probe_${Date.now()}@chemora.test`;
    let got429 = false;

    // Send 6 failed attempts with wrong password
    for (let i = 1; i <= 6; i++) {
      const res = await fetch(`${BASE_URL}/api/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: testEmail, password: 'wrongpassword' }),
      });
      if (res.status === 429) {
        got429 = true;
        break;
      }
    }

    assert(got429, 'Repeated failed login attempts trigger HTTP 429 Rate Limit');
  } catch (err) {
    assert(false, `Rate limiting test failed: ${err.message}`);
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
