#!/usr/bin/env node
/**
 * Test Suite: AgentMail Admin OTP Email Dispatcher
 * Tests:
 * 1. Success path (AgentMail 200 OK with correct headers, endpoint, and payload)
 * 2. Custom AGENTMAIL_API_BASE support (EU region endpoint)
 * 3. Fail-closed on missing AGENTMAIL_API_KEY or AGENTMAIL_INBOX_ID (503 otp_unavailable)
 * 4. AgentMail 4xx error response handling (503 otp_send_failed)
 * 5. AgentMail 5xx error response handling (503 otp_send_failed)
 * 6. Request timeout (8s timeout handling)
 * 7. Security: Code and API key NEVER leak into server logs or responses
 * 8. End-to-end express route test: challenge is invalidated on send failure
 */

import express from 'express';
import cookieParser from 'cookie-parser';
import assert from 'node:assert/strict';
import {
  sendAdminOtpEmail,
  getAdminSessionSecret,
} from '../server/routes/admin.ts';

// Set minimum test session secret
process.env.ADMIN_SESSION_SECRET = 'chemora-test-session-signing-key-32-chars-long';
process.env.DEV_ADMIN_PASSWORD = 'TestDevPassword123!';
process.env.DEV_ADMIN_EMAIL = 'admin-test@chemora.edu';
process.env.NODE_ENV = 'development';
process.env.ALLOW_DEV_ADMIN = 'true';

const originalFetch = globalThis.fetch;
let capturedLogs = [];

function captureLogs() {
  capturedLogs = [];
  const log = console.log;
  const warn = console.warn;
  const error = console.error;

  console.log = (...args) => {
    capturedLogs.push(args.map(String).join(' '));
    log(...args);
  };
  console.warn = (...args) => {
    capturedLogs.push(args.map(String).join(' '));
    warn(...args);
  };
  console.error = (...args) => {
    capturedLogs.push(args.map(String).join(' '));
    error(...args);
  };

  return () => {
    console.log = log;
    console.warn = warn;
    console.error = error;
  };
}

let passedCount = 0;
function testAssert(condition, message) {
  assert(condition, message);
  passedCount++;
  console.log(`  ✅ [PASS] ${message}`);
}

async function runTests() {
  console.log('🧪 Starting AgentMail Admin OTP Test Suite...\n');

  // --------------------------------------------------------------------------
  // Test 1: Successful OTP Email Dispatch via AgentMail
  // --------------------------------------------------------------------------
  console.log('1. Testing AgentMail OTP Success Path...');
  {
    process.env.AGENTMAIL_API_KEY = 'agentmail_test_key_xyz987';
    process.env.AGENTMAIL_INBOX_ID = 'chemora_lab@agentmail.to';
    delete process.env.AGENTMAIL_API_BASE;
    delete process.env.TEST_SIMULATE_NO_EMAIL;

    let interceptedRequest = null;

    globalThis.fetch = async (url, options) => {
      interceptedRequest = { url, ...options };
      return {
        ok: true,
        status: 200,
        json: async () => ({
          message_id: 'msg_test_1234567890',
          thread_id: 'thr_test_0987654321',
        }),
        text: async () => JSON.stringify({ message_id: 'msg_test_1234567890' }),
      };
    };

    const result = await sendAdminOtpEmail({
      toEmail: 'admin-verified@chemora.edu',
      code: '849201',
      ip: '198.51.100.42',
      requestTime: 'Fri, 24 Oct 2026 10:00:00 GMT',
    });

    testAssert(result.ok === true, 'sendAdminOtpEmail returns ok: true on 200 OK');
    testAssert(interceptedRequest !== null, 'Fetch was invoked by sendAdminOtpEmail');
    testAssert(
      interceptedRequest.url === 'https://api.agentmail.to/inboxes/chemora_lab%40agentmail.to/messages/send',
      'Dispatches to expected AgentMail URL with encoded inbox_id'
    );
    testAssert(interceptedRequest.method === 'POST', 'HTTP method is POST');
    testAssert(
      interceptedRequest.headers['Authorization'] === 'Bearer agentmail_test_key_xyz987',
      'Correct Authorization Bearer header sent'
    );
    testAssert(
      interceptedRequest.headers['Content-Type'] === 'application/json',
      'Content-Type is application/json'
    );

    const body = JSON.parse(interceptedRequest.body);
    testAssert(body.to === 'admin-verified@chemora.edu', 'Recipient is strictly the verified admin email');
    testAssert(body.subject === 'Your Chemora admin sign-in code', 'Subject matches specified template');
    testAssert(body.text.includes('849201'), 'Plaintext body includes the OTP code');
    testAssert(body.text.includes('valid for 10 minutes'), 'Plaintext body includes 10-minute validity notice');
    testAssert(body.text.includes('198.51.100.42'), 'Plaintext body includes approximate IP');
    testAssert(body.text.includes("If this wasn't you, change your password now"), 'Plaintext body includes security warning');
    testAssert(body.html.includes('849201'), 'HTML body includes the OTP code');
    testAssert(body.html.includes('Valid for 10 minutes'), 'HTML body includes validity indicator');
    testAssert(body.html.includes('198.51.100.42'), 'HTML body includes approximate IP');
    testAssert(Boolean(interceptedRequest.signal), 'Request incorporates timeout signal (8s)');
  }

  // --------------------------------------------------------------------------
  // Test 2: Custom AGENTMAIL_API_BASE (e.g. EU region)
  // --------------------------------------------------------------------------
  console.log('\n2. Testing Custom AGENTMAIL_API_BASE...');
  {
    process.env.AGENTMAIL_API_KEY = 'agentmail_test_key_xyz987';
    process.env.AGENTMAIL_INBOX_ID = 'chemora_lab@agentmail.eu';
    process.env.AGENTMAIL_API_BASE = 'https://api.agentmail.eu';

    let interceptedUrl = null;
    globalThis.fetch = async (url) => {
      interceptedUrl = url;
      return {
        ok: true,
        status: 200,
        text: async () => '{}',
      };
    };

    const result = await sendAdminOtpEmail({
      toEmail: 'admin-eu@chemora.edu',
      code: '112233',
      ip: '203.0.113.19',
      requestTime: 'Fri, 24 Oct 2026 10:05:00 GMT',
    });

    testAssert(result.ok === true, 'EU endpoint returns ok: true');
    testAssert(
      interceptedUrl === 'https://api.agentmail.eu/inboxes/chemora_lab%40agentmail.eu/messages/send',
      'Respects AGENTMAIL_API_BASE for EU regional deployment'
    );

    delete process.env.AGENTMAIL_API_BASE;
  }

  // --------------------------------------------------------------------------
  // Test 3: Missing Environment Variables Fails Closed (503 otp_unavailable)
  // --------------------------------------------------------------------------
  console.log('\n3. Testing Fail-Closed on Missing Environment Variables...');
  {
    delete process.env.AGENTMAIL_API_KEY;
    delete process.env.AGENTMAIL_INBOX_ID;
    process.env.TEST_SIMULATE_NO_EMAIL = 'true';

    const result = await sendAdminOtpEmail({
      toEmail: 'admin@chemora.edu',
      code: '998877',
      ip: '127.0.0.1',
      requestTime: new Date().toISOString(),
    });

    testAssert(result.ok === false, 'sendAdminOtpEmail fails when env vars are missing');
    testAssert(result.code === 'otp_unavailable', 'Returns error code: otp_unavailable');

    delete process.env.TEST_SIMULATE_NO_EMAIL;
  }

  // --------------------------------------------------------------------------
  // Test 4: AgentMail 4xx Error (e.g. 400 Bad Request / 403 Forbidden)
  // --------------------------------------------------------------------------
  console.log('\n4. Testing AgentMail 4xx Error Handling...');
  {
    process.env.AGENTMAIL_API_KEY = 'agentmail_bad_key';
    process.env.AGENTMAIL_INBOX_ID = 'chemora_lab@agentmail.to';

    globalThis.fetch = async () => ({
      ok: false,
      status: 403,
      text: async () => JSON.stringify({ message: 'Message rejected by policy', code: 'message_rejected' }),
    });

    const result = await sendAdminOtpEmail({
      toEmail: 'admin@chemora.edu',
      code: '334455',
      ip: '127.0.0.1',
      requestTime: new Date().toISOString(),
    });

    testAssert(result.ok === false, 'Fails on 4xx response');
    testAssert(result.code === 'otp_send_failed', 'Returns error code: otp_send_failed');
    testAssert(result.status === 403, 'Captures HTTP 403 status');
  }

  // --------------------------------------------------------------------------
  // Test 5: AgentMail 5xx Error (e.g. 500 / 503 Internal Error)
  // --------------------------------------------------------------------------
  console.log('\n5. Testing AgentMail 5xx Error Handling...');
  {
    process.env.AGENTMAIL_API_KEY = 'agentmail_key';
    process.env.AGENTMAIL_INBOX_ID = 'chemora_lab@agentmail.to';

    globalThis.fetch = async () => ({
      ok: false,
      status: 502,
      text: async () => JSON.stringify({ message: 'Bad Gateway connecting to mail agent' }),
    });

    const result = await sendAdminOtpEmail({
      toEmail: 'admin@chemora.edu',
      code: '556677',
      ip: '127.0.0.1',
      requestTime: new Date().toISOString(),
    });

    testAssert(result.ok === false, 'Fails on 5xx response');
    testAssert(result.code === 'otp_send_failed', 'Returns error code: otp_send_failed');
    testAssert(result.status === 502, 'Captures HTTP 502 status');
  }

  // --------------------------------------------------------------------------
  // Test 6: Request Timeout Handling (8 seconds)
  // --------------------------------------------------------------------------
  console.log('\n6. Testing Request Timeout Handling (8 seconds)...');
  {
    process.env.AGENTMAIL_API_KEY = 'agentmail_key';
    process.env.AGENTMAIL_INBOX_ID = 'chemora_lab@agentmail.to';

    globalThis.fetch = async () => {
      const error = new Error('The operation was aborted due to timeout');
      error.name = 'TimeoutError';
      throw error;
    };

    const result = await sendAdminOtpEmail({
      toEmail: 'admin@chemora.edu',
      code: '667788',
      ip: '127.0.0.1',
      requestTime: new Date().toISOString(),
    });

    testAssert(result.ok === false, 'Fails on timeout error');
    testAssert(result.code === 'otp_send_failed', 'Returns error code: otp_send_failed');
    testAssert(result.error?.includes('timed out'), 'Error message indicates timeout');
  }

  // --------------------------------------------------------------------------
  // Test 7: Secret OTP Code and API Key Non-Leakage Verification
  // --------------------------------------------------------------------------
  console.log('\n7. Testing Security: Code & Key NEVER leak in logs or errors...');
  {
    const secretCode = '928471';
    const secretApiKey = 'agent_super_secret_key_cannot_leak_49204';
    process.env.AGENTMAIL_API_KEY = secretApiKey;
    process.env.AGENTMAIL_INBOX_ID = 'chemora_lab@agentmail.to';

    const restoreLogs = captureLogs();

    // Trigger failure
    globalThis.fetch = async () => ({
      ok: false,
      status: 500,
      text: async () => JSON.stringify({ message: 'Internal MTA crash' }),
    });

    const result = await sendAdminOtpEmail({
      toEmail: 'admin@chemora.edu',
      code: secretCode,
      ip: '10.0.0.1',
      requestTime: new Date().toISOString(),
    });

    restoreLogs();

    testAssert(result.ok === false, 'Send failed as expected');

    // Verify secret code does not appear in result error
    testAssert(!result.error?.includes(secretCode), 'Error message does NOT contain secret code');

    // Verify neither secretCode nor secretApiKey appear in captured logs
    const allLogsCombined = capturedLogs.join('\n');
    testAssert(!allLogsCombined.includes(secretCode), 'Secret OTP code NEVER appears in server logs');
    testAssert(!allLogsCombined.includes(secretApiKey), 'Secret AgentMail API Key NEVER appears in server logs');
  }

  // --------------------------------------------------------------------------
  // Test 8: End-to-End Express API Route Verification
  // --------------------------------------------------------------------------
  console.log('\n8. Testing End-to-End Express /login & /otp/resend with Mocked AgentMail...');
  {
    const adminRouter = (await import('../server/routes/admin.ts')).default;
    const app = express();
    app.use(express.json());
    app.use(cookieParser());
    app.use('/api/admin', adminRouter);

    const server = app.listen(0);
    const port = server.address().port;
    const baseUrl = `http://127.0.0.1:${port}`;

    try {
      // 8a: When AgentMail fails with 500, /login returns 503 otp_send_failed
      process.env.AGENTMAIL_API_KEY = 'valid_test_key';
      process.env.AGENTMAIL_INBOX_ID = 'chemora_lab@agentmail.to';

      globalThis.fetch = async () => ({
        ok: false,
        status: 500,
        text: async () => JSON.stringify({ message: 'AgentMail server error' }),
      });

      const loginRes = await originalFetch(`${baseUrl}/api/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: process.env.DEV_ADMIN_EMAIL,
          password: process.env.DEV_ADMIN_PASSWORD,
        }),
      });

      testAssert(loginRes.status === 503, 'Login returns 503 when AgentMail send fails');
      const loginBody = await loginRes.json();
      testAssert(loginBody.code === 'otp_send_failed', 'Login error code is otp_send_failed');
      testAssert(
        loginBody.error === "We couldn't send the code. Please try again.",
        'Login error message matches "We couldn\'t send the code. Please try again."'
      );

      // Verify no admin_preauth cookie was set on failure
      const setCookie = loginRes.headers.get('set-cookie') || '';
      testAssert(!setCookie.includes('admin_preauth'), 'No admin_preauth cookie issued on send failure');

      // 8b: When AgentMail succeeds, /login returns 200 { step: "otp", ... }
      globalThis.fetch = async () => ({
        ok: true,
        status: 200,
        json: async () => ({ message_id: 'msg_success_1' }),
        text: async () => '{}',
      });

      const successLoginRes = await originalFetch(`${baseUrl}/api/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: process.env.DEV_ADMIN_EMAIL,
          password: process.env.DEV_ADMIN_PASSWORD,
        }),
      });

      testAssert(successLoginRes.status === 200, 'Login returns 200 on AgentMail success');
      const successBody = await successLoginRes.json();
      testAssert(successBody.step === 'otp', 'Login response step is otp');
      testAssert(typeof successBody.maskedEmail === 'string', 'Login returns maskedEmail');
      testAssert(successBody.expiresIn === 600, 'Login returns expiresIn: 600');
      testAssert(successBody.resendAfter === 60, 'Login returns resendAfter: 60');

      // 8c: Missing env returns 503 otp_unavailable
      delete process.env.AGENTMAIL_API_KEY;
      delete process.env.AGENTMAIL_INBOX_ID;
      process.env.TEST_SIMULATE_NO_EMAIL = 'true';

      const missingEnvRes = await originalFetch(`${baseUrl}/api/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: process.env.DEV_ADMIN_EMAIL,
          password: process.env.DEV_ADMIN_PASSWORD,
        }),
      });

      testAssert(missingEnvRes.status === 503, 'Missing env returns 503');
      const missingEnvBody = await missingEnvRes.json();
      testAssert(missingEnvBody.code === 'otp_unavailable', 'Error code is otp_unavailable');
      delete process.env.TEST_SIMULATE_NO_EMAIL;

    } finally {
      server.close();
      globalThis.fetch = originalFetch;
    }
  }

  console.log(`\n========================================================`);
  console.log(`Results: ${passedCount} tests passed (100%)`);
  console.log(`========================================================\n`);
}

runTests().catch((err) => {
  console.error('Test suite failure:', err);
  process.exit(1);
});
