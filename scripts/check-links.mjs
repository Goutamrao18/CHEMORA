#!/usr/bin/env node
/**
 * scripts/check-links.mjs
 * Comprehensive Link Checker for CHEMORA
 * Validates internal links, hash routes, static asset links, mailto/tel protocols,
 * and external URLs across static HTML pages and source components.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const VALID_HASH_ROUTES = new Set([
  '#home',
  '#know',
  '#challenge',
  '#experiments',
  '#progress',
  '#account',
  '#admin'
]);

const SEARCH_DIRS = ['src', 'public', '.'];
const EXTENSIONS = new Set(['.html', '.tsx', '.ts', '.jsx', '.js']);
const IGNORED_PATHS = [
  'node_modules',
  'dist',
  'dist-site',
  '.git',
  '.aistudio',
  'scripts/check-links.mjs'
];

function shouldScan(filePath) {
  const rel = path.relative(rootDir, filePath);
  if (IGNORED_PATHS.some((p) => rel.startsWith(p) || rel.includes(`/${p}/`))) return false;
  const ext = path.extname(filePath);
  return EXTENSIONS.has(ext);
}

function getAllFiles(dir) {
  const results = [];
  try {
    const list = fs.readdirSync(dir);
    for (const file of list) {
      const full = path.join(dir, file);
      const stat = fs.statSync(full);
      if (stat.isDirectory()) {
        const rel = path.relative(rootDir, full);
        if (!IGNORED_PATHS.some((p) => rel.startsWith(p) || rel.includes(`/${p}/`))) {
          results.push(...getAllFiles(full));
        }
      } else if (shouldScan(full)) {
        results.push(full);
      }
    }
  } catch {}
  return results;
}

function extractLinks(content, file) {
  const links = [];
  // Match href="..." and src="..."
  const attrRegex = /(?:href|src)=["']([^"']+)["']/g;
  let match;
  while ((match = attrRegex.exec(content)) !== null) {
    const val = match[1].trim();
    if (val && !val.startsWith('{') && !val.startsWith('data:') && !val.startsWith('blob:')) {
      links.push({ url: val, file });
    }
  }
  return links;
}

async function verifyExternalUrl(url) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(url, {
      method: 'HEAD',
      headers: { 'User-Agent': 'ChemoraLinkChecker/1.0 (+https://chemora.runs-on.dev)' },
      signal: controller.signal
    });
    clearTimeout(timeout);
    // 200, 301, 302, 307, 308, 403, 405 (some servers reject HEAD with 405) are considered alive
    if (res.status < 400 || res.status === 403 || res.status === 405) {
      return { ok: true, status: res.status };
    }
    // Fallback to GET if HEAD gave 404 or 400
    const getController = new AbortController();
    const getTimeout = setTimeout(() => getController.abort(), 4000);
    const getRes = await fetch(url, {
      method: 'GET',
      headers: { 'User-Agent': 'ChemoraLinkChecker/1.0 (+https://chemora.runs-on.dev)' },
      signal: getController.signal
    });
    clearTimeout(getTimeout);
    return { ok: getRes.status < 400 || getRes.status === 403, status: getRes.status };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

async function main() {
  console.log('🔍 [CHEMORA LINK AUDITOR] Scanning codebase for links...');
  const files = getAllFiles(rootDir);
  console.log(`📁 Found ${files.length} source and static files to inspect.`);

  const allLinks = [];
  for (const f of files) {
    const content = fs.readFileSync(f, 'utf-8');
    const links = extractLinks(content, f);
    allLinks.push(...links);
  }

  console.log(`🔗 Extracted ${allLinks.length} total link occurrences.`);

  let passed = 0;
  let failed = 0;
  const failures = [];
  const checkedExternals = new Map();

  for (const { url, file } of allLinks) {
    const relFile = path.relative(rootDir, file);

    // 1. Hash route
    if (url.startsWith('#')) {
      const cleanHash = url.split('?')[0].toLowerCase();
      if (cleanHash === '#' || cleanHash === '#/' || cleanHash === '') {
        // empty hash anchor
        failures.push({ file: relFile, url, reason: 'Empty hash anchor (href="#"). Use a button or valid hash route.' });
        failed++;
      } else if (VALID_HASH_ROUTES.has(cleanHash) || cleanHash.startsWith('#level-') || cleanHash.startsWith('#element-') || cleanHash.startsWith('#tab-')) {
        passed++;
      } else {
        failures.push({ file: relFile, url, reason: `Unrecognized hash route: ${url}` });
        failed++;
      }
      continue;
    }

    // 2. Mailto link
    if (url.startsWith('mailto:')) {
      const email = url.replace(/^mailto:/, '').split('?')[0];
      if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        passed++;
      } else {
        failures.push({ file: relFile, url, reason: `Invalid email address format in mailto: ${email}` });
        failed++;
      }
      continue;
    }

    // 3. Tel link
    if (url.startsWith('tel:')) {
      const phone = url.replace(/^tel:/, '');
      if (/^[\d+()\-\s]+$/.test(phone)) {
        passed++;
      } else {
        failures.push({ file: relFile, url, reason: `Invalid phone format in tel: ${phone}` });
        failed++;
      }
      continue;
    }

    // 4. External URL (http / https)
    if (url.startsWith('http://') || url.startsWith('https://')) {
      // Skip checking schemas, CDNs, local development, and self canonicals
      if (
        url.includes('schema.org') ||
        url.includes('w3.org') ||
        url.includes('localhost') ||
        url.includes('127.0.0.1') ||
        url.includes('fonts.googleapis.com') ||
        url.includes('fonts.gstatic.com') ||
        url.includes('chemora.runs-on.dev')
      ) {
        passed++;
        continue;
      }
      // Deduplicate checks
      if (!checkedExternals.has(url)) {
        // Rate limit: small pause
        await new Promise((r) => setTimeout(r, 150));
        const res = await verifyExternalUrl(url);
        checkedExternals.set(url, res);
      }
      const cached = checkedExternals.get(url);
      if (cached.ok) {
        passed++;
      } else {
        failures.push({ file: relFile, url, reason: `External URL returned error: ${cached.error || `HTTP ${cached.status}`}` });
        failed++;
      }
      continue;
    }

    // 5. Root-relative or relative internal asset/page
    if (url.startsWith('/') || !url.includes(':')) {
      // Strip query parameters and hash fragments
      const cleanPath = url.split('?')[0].split('#')[0];
      if (!cleanPath || cleanPath === '/') {
        passed++;
        continue;
      }

      // Check candidate paths on disk
      const candidate1 = path.join(rootDir, cleanPath);
      const candidate2 = path.join(rootDir, 'public', cleanPath);
      const candidate3 = path.resolve(path.dirname(file), cleanPath);

      if (fs.existsSync(candidate1) || fs.existsSync(candidate2) || fs.existsSync(candidate3)) {
        passed++;
      } else {
        failures.push({ file: relFile, url, reason: `Target file not found on disk: ${cleanPath}` });
        failed++;
      }
      continue;
    }

    passed++;
  }

  console.log('\n======================================================');
  console.log(`📊 [AUDIT SUMMARY]`);
  console.log(`   Total Links Evaluated: ${allLinks.length}`);
  console.log(`   Passed:                ${passed}`);
  console.log(`   Failed:                ${failed}`);
  console.log('======================================================\n');

  if (failures.length > 0) {
    console.error('❌ Detected link resolution issues:');
    for (const f of failures) {
      console.error(` - [${f.file}] ${f.url} -> ${f.reason}`);
    }
    process.exit(1);
  } else {
    console.log('✅ All links, hash routes, mailtos, and static assets verified successfully!');
    process.exit(0);
  }
}

main().catch((err) => {
  console.error('Fatal link checker error:', err);
  process.exit(1);
});
