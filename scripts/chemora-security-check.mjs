#!/usr/bin/env node
/**
 * CHEMORA safe security self-check
 * --------------------------------
 * Low-volume, mostly read-only checks for YOUR OWN deployment (e.g. the Vercel site).
 * It does NOT flood, brute force, or modify data.
 *
 * Usage (Node 18+):
 *   BASE_URL=https://chemora.runs-on.dev node chemora-security-check.mjs --i-own-this-site
 *
 * Optional (Supabase checks use only the PUBLIC anon key, same as any browser visitor):
 *   SUPABASE_URL=https://xxxx.supabase.co SUPABASE_ANON_KEY=eyJ... \
 *   BASE_URL=https://chemora.runs-on.dev node chemora-security-check.mjs --i-own-this-site
 *
 * Optional flags (each one sends a few extra requests and may briefly trip YOUR OWN rate limiter):
 *   --rate-limit-test     12 failed logins to confirm HTTP 429 appears
 *   --try-default-admin   1 login attempt with legacy credentials via TEST_DEFAULT_ADMIN_PASSWORD (must fail)
 */

const args = process.argv.slice(2);
const has = (f) => args.includes(f);
const BASE = (process.env.BASE_URL || '').trim().replace(/\/+$/, '');
const SUPA_URL = (process.env.SUPABASE_URL || '').trim().replace(/\/+$/, '');
const SUPA_KEY = (process.env.SUPABASE_ANON_KEY || '').trim();

function usage(msg) {
  if (msg) console.error(`\n${msg}\n`);
  console.error('Usage: BASE_URL=https://your-site node chemora-security-check.mjs --i-own-this-site');
  process.exit(2);
}

if (!BASE) usage('BASE_URL is required (your Vercel domain).');
if (!has('--i-own-this-site')) usage('Add --i-own-this-site to confirm you are authorised to test this deployment.');

let host;
try {
  host = new URL(BASE).hostname;
} catch {
  usage('BASE_URL is not a valid URL.');
}
if (/\.run\.app$|aistudio|ai\.studio/i.test(host) && !has('--allow-any-host')) {
  usage(`Refusing to test ${host}: this looks like a Google AI Studio / Cloud Run preview, not your Vercel site.`);
}

const results = [];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function record(level, name, detail = '') {
  results.push({ level, name, detail });
  const icon = level === 'PASS' ? '✅' : level === 'WARN' ? '⚠️ ' : level === 'FAIL' ? '❌' : 'ℹ️ ';
  console.log(`${icon} [${level}] ${name}${detail ? ' — ' + detail : ''}`);
}

async function http(path, opts = {}) {
  const url = path.startsWith('http') ? path : BASE + path;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 12000);
  try {
    const res = await fetch(url, { redirect: 'manual', ...opts, signal: ctrl.signal });
    let text = '';
    try {
      text = await res.text();
    } catch {
      /* ignore body read errors */
    }
    return { ok: true, status: res.status, headers: res.headers, text };
  } catch (err) {
    return { ok: false, status: 0, headers: new Headers(), text: '', error: String(err && err.message ? err.message : err) };
  } finally {
    clearTimeout(timer);
    await sleep(150);
  }
}

const jsonPost = (path, body, extraHeaders = {}) =>
  http(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...extraHeaders },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });

function looksLikeStackTrace(text) {
  return /\bat\s+[\w$.<>]+\s+\(.*:\d+:\d+\)|node_modules|ECONNREFUSED|SequelizeError|TypeError:|ReferenceError:/i.test(text);
}

/* ------------------------------------------------------------------ */
async function testHeaders() {
  const r = await http('/');
  if (!r.ok) return record('FAIL', 'Site reachable', r.error);
  record('PASS', 'Site reachable', `HTTP ${r.status}`);

  const need = [
    ['content-security-policy', 'Content-Security-Policy'],
    ['strict-transport-security', 'Strict-Transport-Security'],
    ['x-content-type-options', 'X-Content-Type-Options'],
    ['referrer-policy', 'Referrer-Policy'],
    ['x-frame-options', 'X-Frame-Options'],
  ];
  for (const [key, label] of need) {
    const v = r.headers.get(key);
    if (v) record('PASS', `Header ${label}`, v.length > 70 ? v.slice(0, 70) + '…' : v);
    else record('FAIL', `Header ${label} missing`);
  }
  const csp = r.headers.get('content-security-policy') || '';
  if (csp) {
    if (/script-src[^;]*'unsafe-eval'/i.test(csp)) record('WARN', "CSP allows 'unsafe-eval' in script-src");
    if (/script-src[^;]*'unsafe-inline'/i.test(csp)) record('WARN', "CSP allows 'unsafe-inline' in script-src (weakens XSS protection)");
    if (/script-src[^;]*\*(?![.\w-])/i.test(csp)) record('WARN', 'CSP script-src contains a wildcard');
  }
  const server = r.headers.get('x-powered-by');
  if (server) record('WARN', 'X-Powered-By header exposes tech stack', server);
}

async function testAnonymousAdmin() {
  const paths = ['/api/admin/me', '/api/admin/users', '/api/admin/reviews', '/api/admin/audit', '/api/admin/dashboard', '/api/admin/settings'];
  for (const p of paths) {
    const r = await http(p);
    if (!r.ok) {
      record('WARN', `GET ${p}`, r.error);
    } else if (r.status === 200) {
      record('FAIL', `Anonymous GET ${p} returned 200`, 'admin data may be exposed');
    } else if ([401, 403, 404].includes(r.status)) {
      record('PASS', `Anonymous GET ${p} denied`, `HTTP ${r.status}`);
    } else {
      record('WARN', `Anonymous GET ${p}`, `unexpected HTTP ${r.status}`);
    }
    if (r.ok && looksLikeStackTrace(r.text)) record('FAIL', `Stack trace leaked by ${p}`);
  }
}

async function testAnonymousAccount() {
  for (const p of ['/api/account/me', '/api/account/progress']) {
    const r = await http(p);
    if (r.status === 401) record('PASS', `Anonymous GET ${p} requires login`, 'HTTP 401');
    else if (r.status === 200) record('FAIL', `Anonymous GET ${p} returned 200`, 'private data may be exposed');
    else record('WARN', `GET ${p}`, `HTTP ${r.status}`);
  }
}

async function testPublicDiagnostics() {
  for (const p of ['/api/account/status', '/api/account/database']) {
    const r = await http(p);
    if (r.status !== 200) {
      record('PASS', `${p} not public`, `HTTP ${r.status}`);
      continue;
    }
    const leaky = /(postgres|supabase|table|engine|schema|\.co\b|key|secret)/i.test(r.text);
    if (leaky) record('WARN', `${p} is public and reveals internals`, 'consider requiring admin auth or trimming the response');
    else record('PASS', `${p} is public but harmless`);
  }
}

async function testBadInput() {
  const bad = await jsonPost('/api/account/login', '{not-valid-json');
  if (bad.status >= 500) record('FAIL', 'Malformed JSON causes a 5xx error', `HTTP ${bad.status}`);
  else if (bad.status === 400) record('PASS', 'Malformed JSON rejected cleanly', 'HTTP 400');
  else record('WARN', 'Malformed JSON handling', `HTTP ${bad.status}`);
  if (looksLikeStackTrace(bad.text)) record('FAIL', 'Stack trace / internals leaked on malformed JSON');

  const big = await jsonPost('/api/account/login', { email: 'a@b.co', password: 'x'.repeat(150 * 1024) });
  if (big.status === 413) record('PASS', 'Oversized body rejected', 'HTTP 413');
  else if (big.status >= 500) record('FAIL', 'Oversized body causes a 5xx error', `HTTP ${big.status}`);
  else if ([400, 401, 422, 429].includes(big.status)) record('PASS', 'Oversized body not accepted', `HTTP ${big.status}`);
  else record('WARN', 'Oversized body handling', `HTTP ${big.status}`);

  const wrongType = await jsonPost('/api/account/login', { email: { $ne: null }, password: ['x'] });
  if (wrongType.status >= 500) record('FAIL', 'Wrong-type fields cause a 5xx error', `HTTP ${wrongType.status}`);
  else if (wrongType.status === 200) record('FAIL', 'Wrong-type login payload returned 200');
  else record('PASS', 'Wrong-type fields rejected', `HTTP ${wrongType.status}`);
}

async function testCors() {
  const evil = 'https://evil.example';
  const pre = await http('/api/account/me', {
    method: 'OPTIONS',
    headers: { Origin: evil, 'Access-Control-Request-Method': 'GET' },
  });
  const acao = pre.headers.get('access-control-allow-origin');
  if (!acao) record('PASS', 'No CORS allow-origin for foreign origin (preflight)');
  else if (acao === '*' || acao === evil) record('FAIL', 'CORS allows foreign origin', `Access-Control-Allow-Origin: ${acao}`);
  else record('PASS', 'CORS restricted', acao);

  const get = await http('/api/account/status', { headers: { Origin: evil } });
  const acao2 = get.headers.get('access-control-allow-origin');
  if (acao2 === evil) record('FAIL', 'API echoes arbitrary Origin in CORS header');
  if (get.headers.get('access-control-allow-credentials') === 'true' && acao2) {
    record('WARN', 'CORS allows credentials together with an allow-origin header');
  }
}

async function testAdminCsrf() {
  const r = await jsonPost(
    '/api/admin/login',
    { email: 'security-check@example.invalid', password: 'Not-A-Real-Password-123' },
    { Origin: 'https://evil.example' },
  );
  if (r.status === 200) record('FAIL', 'Admin login accepted from foreign Origin');
  else if ([400, 401, 403, 404, 429].includes(r.status)) record('PASS', 'Admin login refuses foreign Origin / bad credentials', `HTTP ${r.status}`);
  else if (r.status >= 500) record('FAIL', 'Admin login returned a server error', `HTTP ${r.status}`);
  else record('WARN', 'Admin login response', `HTTP ${r.status}`);
  if (looksLikeStackTrace(r.text)) record('FAIL', 'Stack trace leaked by admin login');
  const setCookie = r.headers.get('set-cookie') || '';
  if (setCookie && r.status !== 200) record('WARN', 'Cookie set by a failed admin login', setCookie.split(';')[0].split('=')[0]);
}

function decodeJwtRole(token) {
  try {
    const payload = JSON.parse(Buffer.from(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8'));
    return payload.role || null;
  } catch {
    return null;
  }
}

async function testFrontendSecrets() {
  const home = await http('/');
  if (!home.ok) return record('WARN', 'Frontend secret scan skipped', home.error);

  const assetRe = /["'(=](\/?(?:assets|public)?\/?[\w./-]*?\/[\w.-]+\.(?:js|mjs))["')]/g;
  const queue = new Set();
  const addFrom = (text) => {
    let m;
    const re = /(?:src|href)=["']([^"']+\.(?:js|mjs))["']|["'](\/assets\/[\w.-]+\.(?:js|mjs))["']|["'](\.\/[\w.-]+\.(?:js|mjs))["']/g;
    while ((m = re.exec(text))) {
      const p = m[1] || m[2] || m[3];
      if (p) queue.add(p);
    }
  };
  addFrom(home.text);
  void assetRe;

  const seen = new Set();
  const scanned = [];
  const patterns = [
    { re: /service_role/i, label: 'the text "service_role"', level: 'WARN' },
    { re: /SUPABASE_SERVICE_ROLE_KEY/, label: 'SUPABASE_SERVICE_ROLE_KEY', level: 'FAIL' },
    { re: /ADMIN_SESSION_SECRET|ADMIN_2FA_ENCRYPTION_KEY/, label: 'admin secret variable name with value risk', level: 'WARN' },
    { re: /-----BEGIN [A-Z ]*PRIVATE KEY-----/, label: 'a private key block', level: 'FAIL' },
    { re: /\bsk-[A-Za-z0-9_-]{20,}/, label: 'an sk- style API key', level: 'FAIL' },
    { re: /AIza[0-9A-Za-z_-]{35}/, label: 'a Google API key (must be restricted, never a Gemini server key)', level: 'WARN' },
  ];

  let guard = 0;
  while (queue.size && guard < 90) {
    guard++;
    const next = [...queue][0];
    queue.delete(next);
    const url = next.startsWith('http') ? next : new URL(next, BASE + '/').toString();
    if (seen.has(url) || !url.startsWith(BASE)) continue;
    seen.add(url);
    const r = await http(url);
    if (r.status !== 200) continue;
    scanned.push(url);
    addFrom(r.text);
    for (const p of patterns) {
      if (p.re.test(r.text)) {
        // test scripts mention the word in comments only; flag as given
        record(p.level, `Frontend file contains ${p.label}`, url.replace(BASE, ''));
      }
    }
    const jwts = r.text.match(/eyJ[A-Za-z0-9_-]{15,}\.[A-Za-z0-9_-]{15,}\.[A-Za-z0-9_-]{10,}/g) || [];
    for (const j of new Set(jwts)) {
      const role = decodeJwtRole(j);
      if (role === 'service_role') record('FAIL', 'A service_role JWT is embedded in the frontend!', url.replace(BASE, ''));
      else if (role === 'anon') record('INFO', 'Supabase anon key found in frontend (expected, public by design)', url.replace(BASE, ''));
    }
  }
  record('INFO', 'Frontend files scanned', `${scanned.length} JS files`);
  if (!results.some((x) => x.name.startsWith('Frontend file contains') && x.level === 'FAIL')) {
    record('PASS', 'No server secrets found in scanned frontend files');
  }
}

async function testSitemap() {
  const r = await http('/sitemap.xml');
  if (r.status !== 200) return record('INFO', 'No sitemap.xml to check', `HTTP ${r.status}`);
  if (/admin/i.test(r.text)) record('WARN', 'sitemap.xml mentions "admin"');
  else record('PASS', 'sitemap.xml does not list admin pages');
}

async function testSupabaseAnon() {
  if (!SUPA_URL || !SUPA_KEY) {
    return record('INFO', 'Supabase anon-key checks skipped', 'set SUPABASE_URL and SUPABASE_ANON_KEY to enable');
  }
  const headers = { apikey: SUPA_KEY, Authorization: `Bearer ${SUPA_KEY}` };
  const tables = [
    { name: 'admin_users', level: 'FAIL' },
    { name: 'admin_audit_log', level: 'FAIL' },
    { name: 'profiles', level: 'WARN' },
    { name: 'researcher_progress', level: 'FAIL' },
    { name: 'chemora_reviews', level: 'WARN' },
  ];
  for (const t of tables) {
    const r = await http(`${SUPA_URL}/rest/v1/${t.name}?select=*&limit=1`, { headers });
    if (r.status === 200) {
      let rows = [];
      try {
        rows = JSON.parse(r.text);
      } catch {
        /* ignore */
      }
      if (Array.isArray(rows) && rows.length === 0) {
        record('PASS', `Anon read of ${t.name} returns no rows`, 'RLS is hiding data (or the table is empty)');
      } else {
        const keys = rows[0] ? Object.keys(rows[0]).join(', ') : '';
        const hasEmail = /email/i.test(keys);
        record(t.level, `Anon key can READ rows from ${t.name}`, `columns: ${keys}${hasEmail ? ' (includes email!)' : ''}`);
      }
    } else if ([401, 403, 404].includes(r.status)) {
      record('PASS', `Anon read of ${t.name} denied`, `HTTP ${r.status}`);
    } else {
      record('WARN', `Anon read of ${t.name}`, `HTTP ${r.status}`);
    }
  }

  const list = await http(`${SUPA_URL}/storage/v1/object/list/avatars`, {
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify({ prefix: '', limit: 1 }),
  });
  let listed = [];
  try {
    listed = JSON.parse(list.text);
  } catch {
    /* ignore */
  }
  if (list.status === 200 && Array.isArray(listed) && listed.length > 0) {
    record('WARN', 'Anonymous users can LIST the avatars bucket', 'remove broad SELECT policy on storage.objects if you do not want listing');
  } else {
    record('PASS', 'Avatars bucket cannot be listed anonymously');
  }
}

async function testRateLimit() {
  if (!has('--rate-limit-test')) return record('INFO', 'Rate-limit test skipped', 'add --rate-limit-test to run it');
  let got429 = false;
  for (let i = 0; i < 12; i++) {
    const r = await jsonPost('/api/account/login', { email: 'security-check@example.invalid', password: 'Not-A-Real-Password-123' });
    if (r.status === 429) {
      got429 = true;
      break;
    }
  }
  if (got429) record('PASS', 'Login rate limit triggers (HTTP 429)');
  else record('FAIL', 'No HTTP 429 after 12 failed logins', 'rate limiting may not be active on Vercel (check Upstash env vars)');
}

async function testDefaultAdmin() {
  if (!has('--try-default-admin')) return record('INFO', 'Default-admin test skipped', 'add --try-default-admin to run it');
  const testPassword = (process.env.TEST_DEFAULT_ADMIN_PASSWORD || process.env.OLD_ADMIN_PASSWORD || '').trim();
  if (!testPassword) {
    return record('INFO', 'Default-admin test skipped', 'set TEST_DEFAULT_ADMIN_PASSWORD environment variable to run this check');
  }
  const testEmail = (process.env.TEST_DEFAULT_ADMIN_EMAIL || 'admin@chemora.edu').trim();
  const r = await jsonPost('/api/admin/login', { email: testEmail, password: testPassword });
  if (r.status === 200) record('FAIL', 'DEFAULT ADMIN CREDENTIALS STILL WORK — remove immediately');
  else record('PASS', 'Default admin credentials rejected', `HTTP ${r.status}`);
}

/* ------------------------------------------------------------------ */
console.log(`\nCHEMORA security self-check → ${BASE}\n`);
await testHeaders();
await testAnonymousAdmin();
await testAnonymousAccount();
await testPublicDiagnostics();
await testBadInput();
await testCors();
await testAdminCsrf();
await testFrontendSecrets();
await testSitemap();
await testSupabaseAnon();
await testRateLimit();
await testDefaultAdmin();

const count = (l) => results.filter((r) => r.level === l).length;
console.log(`\nSummary: ${count('PASS')} passed, ${count('WARN')} warnings, ${count('FAIL')} failed, ${count('INFO')} info\n`);
if (count('FAIL')) {
  console.log('Fix the ❌ items first, then re-run this script.');
  process.exit(1);
}
