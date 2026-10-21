import assert from 'node:assert/strict';
import {
  createRateLimiter,
  getClientIp,
  aiRateLimiter,
  databaseRateLimiter,
} from '../server/middleware/rateLimit.ts';

function createMockReqRes({ ip = '203.0.113.195', headers = {}, method = 'GET', path = '/api/test' } = {}) {
  const req = {
    ip,
    headers: { ...headers },
    method,
    path,
    socket: { remoteAddress: ip },
  };

  const responseHeaders = {};
  let statusCode = 200;
  let jsonPayload = null;

  const res = {
    setHeader(key, value) {
      responseHeaders[key.toLowerCase()] = String(value);
    },
    getHeader(key) {
      return responseHeaders[key.toLowerCase()];
    },
    status(code) {
      statusCode = code;
      return this;
    },
    json(payload) {
      jsonPayload = payload;
      return this;
    },
    get statusCode() {
      return statusCode;
    },
    get headers() {
      return responseHeaders;
    },
    get payload() {
      return jsonPayload;
    },
  };

  return { req, res };
}

async function runMiddleware(middleware, req, res) {
  return new Promise((resolve) => {
    let nextCalled = false;
    middleware(req, res, () => {
      nextCalled = true;
      resolve({ nextCalled: true });
    });
    // If not next called synchronously (e.g. 429 response)
    if (!nextCalled && res.statusCode === 429) {
      resolve({ nextCalled: false });
    }
  });
}

console.log('🧪 Starting Rate Limit Middleware Tests...\n');

// 1. Test IP extraction
{
  const { req } = createMockReqRes({
    headers: { 'x-forwarded-for': '198.51.100.42, 10.0.0.1' },
  });
  const extracted = getClientIp(req);
  assert.equal(extracted, '198.51.100.42', 'Should extract first forwarded IP');
  console.log('✓ Test 1 Passed: Client IP correctly extracted from X-Forwarded-For header');
}

// 2. Test IPv6-mapped IPv4 cleanup
{
  const { req } = createMockReqRes({ ip: '::ffff:192.0.2.1' });
  const extracted = getClientIp(req);
  assert.equal(extracted, '192.0.2.1', 'Should strip ::ffff: prefix');
  console.log('✓ Test 2 Passed: IPv6-mapped IPv4 addresses normalized');
}

// 3. Test basic rate limiting and standard headers
{
  const limiter = createRateLimiter({
    windowMs: 5000,
    max: 3,
    message: 'Too many test requests',
  });

  const ip = '10.10.10.1';

  // Request 1: Allowed
  const r1 = createMockReqRes({ ip });
  const res1 = await runMiddleware(limiter, r1.req, r1.res);
  assert.equal(res1.nextCalled, true);
  assert.equal(r1.res.headers['ratelimit-limit'], '3');
  assert.equal(r1.res.headers['ratelimit-remaining'], '2');

  // Request 2: Allowed
  const r2 = createMockReqRes({ ip });
  const res2 = await runMiddleware(limiter, r2.req, r2.res);
  assert.equal(res2.nextCalled, true);
  assert.equal(r2.res.headers['ratelimit-remaining'], '1');

  // Request 3: Allowed (last allowed in window)
  const r3 = createMockReqRes({ ip });
  const res3 = await runMiddleware(limiter, r3.req, r3.res);
  assert.equal(res3.nextCalled, true);
  assert.equal(r3.res.headers['ratelimit-remaining'], '0');

  // Request 4: Blocked with 429!
  const r4 = createMockReqRes({ ip });
  const res4 = await runMiddleware(limiter, r4.req, r4.res);
  assert.equal(res4.nextCalled, false);
  assert.equal(r4.res.statusCode, 429);
  assert.equal(r4.res.payload.error, 'Too many test requests');
  assert.ok(r4.res.headers['retry-after'], 'Should include Retry-After header');
  assert.equal(r4.res.headers['ratelimit-limit'], '3');

  console.log('✓ Test 3 Passed: Sliding window rate limits threshold and returns 429 with standard headers');
}

// 4. Test IP isolation: Another IP is NOT blocked
{
  const limiter = createRateLimiter({
    windowMs: 5000,
    max: 2,
    message: 'Blocked',
  });

  const abusiveIp = '1.1.1.1';
  const cleanIp = '2.2.2.2';

  // Abuse IP 1
  for (let i = 0; i < 2; i++) {
    const r = createMockReqRes({ ip: abusiveIp });
    await runMiddleware(limiter, r.req, r.res);
  }
  const abusiveBlock = createMockReqRes({ ip: abusiveIp });
  await runMiddleware(limiter, abusiveBlock.req, abusiveBlock.res);
  assert.equal(abusiveBlock.res.statusCode, 429, 'Abusive IP must be blocked');

  // Clean IP 2 should still be allowed
  const cleanReq = createMockReqRes({ ip: cleanIp });
  const cleanRes = await runMiddleware(limiter, cleanReq.req, cleanReq.res);
  assert.equal(cleanRes.nextCalled, true, 'Clean IP must proceed normally');
  assert.equal(cleanReq.res.statusCode, 200);

  console.log('✓ Test 4 Passed: Multiple client IPs are isolated; one IP abuse does not affect others');
}

// 5. Test OPTIONS method bypass
{
  const limiter = createRateLimiter({
    windowMs: 5000,
    max: 1,
  });

  const ip = '3.3.3.3';
  // Use up quota
  const r1 = createMockReqRes({ ip, method: 'POST' });
  await runMiddleware(limiter, r1.req, r1.res);

  // OPTIONS preflight should still pass through
  const rOptions = createMockReqRes({ ip, method: 'OPTIONS' });
  const resOptions = await runMiddleware(limiter, rOptions.req, rOptions.res);
  assert.equal(resOptions.nextCalled, true, 'CORS preflight OPTIONS requests must bypass rate limits');

  console.log('✓ Test 5 Passed: OPTIONS requests bypass rate limiters for CORS compatibility');
}

// 6. Test AI Rate Limiter configuration
{
  aiRateLimiter.reset();
  const ip = '4.4.4.4';

  // Fire 20 requests (allowed max for AI)
  for (let i = 0; i < 20; i++) {
    const r = createMockReqRes({ ip, path: '/api/assistant' });
    const res = await runMiddleware(aiRateLimiter, r.req, r.res);
    assert.equal(res.nextCalled, true, `AI request #${i + 1} should be permitted`);
  }

  // 21st request should be rejected to protect Gemini / OpenRouter quotas
  const r21 = createMockReqRes({ ip, path: '/api/assistant' });
  await runMiddleware(aiRateLimiter, r21.req, r21.res);
  assert.equal(r21.res.statusCode, 429, 'AI endpoint must block after 20 queries/min');
  assert.match(r21.res.payload.error, /Too many AI Assistant requests/i);

  console.log('✓ Test 6 Passed: AI assistant rate limiter strictly prevents model & token abuse');
}

// 7. Test Database Rate Limiter configuration
{
  databaseRateLimiter.reset();
  const ip = '5.5.5.5';

  // Fire 60 requests (allowed max for DB)
  for (let i = 0; i < 60; i++) {
    const r = createMockReqRes({ ip, path: '/api/account/sync' });
    const res = await runMiddleware(databaseRateLimiter, r.req, r.res);
    assert.equal(res.nextCalled, true, `DB request #${i + 1} should be permitted`);
  }

  // 61st request should be rejected to protect database
  const r61 = createMockReqRes({ ip, path: '/api/account/sync' });
  await runMiddleware(databaseRateLimiter, r61.req, r61.res);
  assert.equal(r61.res.statusCode, 429, 'Database endpoints must block after 60 ops/min');
  assert.match(r61.res.payload.error, /Too many database operations/i);

  console.log('✓ Test 7 Passed: Database rate limiter strictly prevents DB read/write abuse');
}

console.log('\n🎉 All 7 Rate Limiting Middleware test suites passed successfully!\n');
