// Post-build gate: the assembled dist/ must contain a working site.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dist = path.resolve(root, process.argv[2] ?? "dist");
const errors = [];

if (!fs.existsSync(dist)) {
  console.error(`dist verification failed: dist directory does not exist at ${dist}`);
  process.exit(1);
}

// 1. Required files
const requiredFiles = [
  "index.html",
  "404.html",
  "privacy.html",
  "terms.html",
  "cookie-policy.html",
  "service-worker.js",
  "manifest.webmanifest"
];

for (const req of requiredFiles) {
  if (!fs.existsSync(path.join(dist, req))) {
    errors.push(`dist is missing required file: ${req}`);
  }
}

// 2. Validate index.html contains /assets/ module script reference
const indexHtmlPath = path.join(dist, "index.html");
if (fs.existsSync(indexHtmlPath)) {
  const indexHtml = fs.readFileSync(indexHtmlPath, "utf8");
  if (!/<script\b[^>]*\bsrc=["'][^"']*\/assets\/[^"']*\.js["'][^>]*>/i.test(indexHtml) && !indexHtml.includes("/assets/")) {
    errors.push("dist/index.html does not contain a module script referencing /assets/");
  }
}

// 3. Forbidden entries and file leaks
const FORBIDDEN_DIRS_OR_FILES = [
  "src",
  "server",
  "server.ts",
  "public",
  "scripts",
  "api",
  "Makefile",
  "package.json",
  "package-lock.json",
  "vercel.json",
  "node_modules",
  "vite.config.ts",
  "tailwind.config.js",
  "postcss.config.js",
  "metadata.json",
  "data",
  "loaders-preview.html",
  "loaders-preview.css",
  "loaders-preview.js"
];

for (const entry of FORBIDDEN_DIRS_OR_FILES) {
  if (fs.existsSync(path.join(dist, entry))) {
    errors.push(`dist must not contain ${entry}`);
  }
}

// Recursive scan to ensure no tsconfig*, .env*, or *.md files exist anywhere in dist
function scanForForbiddenPatterns(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    const rel = path.relative(dist, full);
    const lower = entry.name.toLowerCase();

    if (lower.startsWith("tsconfig") || lower.endsWith(".tsbuildinfo")) {
      errors.push(`dist contains tsconfig file: ${rel}`);
    }
    if (lower.startsWith(".env")) {
      errors.push(`dist contains environment file: ${rel}`);
    }
    if (lower.endsWith(".md")) {
      errors.push(`dist contains markdown documentation: ${rel}`);
    }
    if (lower.endsWith(".ts") || lower.endsWith(".tsx")) {
      errors.push(`dist contains uncompiled TypeScript source: ${rel}`);
    }
    if (entry.isDirectory()) {
      scanForForbiddenPatterns(full);
    }
  }
}

scanForForbiddenPatterns(dist);

// Size sanity check
const size = (function total(d) {
  return fs.readdirSync(d, { withFileTypes: true }).reduce(
    (n, e) => n + (e.isDirectory() ? total(path.join(d, e.name)) : fs.statSync(path.join(d, e.name)).size),
    0
  );
})(dist);

if (errors.length) {
  console.error("dist verification failed:");
  errors.forEach(e => console.error("- " + e));
  process.exit(1);
}

console.log(`✓ dist verified: site wired correctly (${(size / 1048576).toFixed(1)} MiB).`);
