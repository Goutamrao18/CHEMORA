// Assemble the deployable tree: static site at dist/.
// Uses strict allow-list to ensure zero source code or server files leak into dist/.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dist = path.resolve(root, process.argv[2] ?? "dist");
const distSite = path.resolve(root, "dist-site");

if (dist === root) {
  console.error("Refusing unsafe dist path.");
  process.exit(1);
}

// 1. Ensure dist-site/index.html exists from root Vite build
const siteIndex = path.join(distSite, "index.html");
if (!fs.existsSync(siteIndex)) {
  console.error("Error: dist-site/index.html is missing. Run Vite build first to compile the root React app into dist-site/.");
  process.exit(1);
}

// 2. Clear and recreate dist/
fs.rmSync(dist, { recursive: true, force: true });
fs.mkdirSync(dist, { recursive: true });

// 3. Copy compiled dist-site/* into dist/
fs.cpSync(distSite, dist, { recursive: true });

// 4. Copy allow-list of static asset directories
const STATIC_DIRS = [
  "videos",
  "know",
  "challenge",
  "experiments"
];

for (const dir of STATIC_DIRS) {
  const src = path.join(root, dir);
  const dest = path.join(dist, dir);
  if (fs.existsSync(src)) {
    fs.cpSync(src, dest, { recursive: true });
  }
}

// Special allow-list: copy assets/chemistry SVGs
const chemSrc = path.join(root, "assets", "chemistry");
const chemDest = path.join(dist, "assets", "chemistry");
if (fs.existsSync(chemSrc)) {
  fs.mkdirSync(chemDest, { recursive: true });
  fs.cpSync(chemSrc, chemDest, { recursive: true });
}

// Copy other root static assets (e.g. svg icons, png share cards) if non-colliding
const rootAssets = path.join(root, "assets");
if (fs.existsSync(rootAssets)) {
  for (const item of fs.readdirSync(rootAssets)) {
    if (item === "chemistry") continue;
    const s = path.join(rootAssets, item);
    const d = path.join(dist, "assets", item);
    if (!fs.existsSync(d) && fs.statSync(s).isFile()) {
      fs.copyFileSync(s, d);
    }
  }
}

// Allow-list of static public files (NEVER copy root source index.html!)
const STATIC_FILES = [
  "favicon.png",
  "icon-192.png",
  "icon-512.png",
  "manifest.webmanifest",
  "robots.txt",
  "sitemap.xml",
  "404.html",
  "offline.html",
  "privacy.html",
  "terms.html",
  "cookie-policy.html",
  "config.js",
  "loaders.css",
  "service-worker.js",
  "mobile-tokens.css",
  "mobile-dock.css",
  "mobile-dock.js"
];

for (const f of STATIC_FILES) {
  const src = path.join(root, f);
  const dest = path.join(dist, f);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
  }
}

// 5. Strict sanitation: Ensure NO forbidden entries ever leak into dist
const FORBIDDEN_ENTRIES = [
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
  "metadata.json",
  "vite.config.ts",
  "tailwind.config.js",
  "postcss.config.js",
  "data",
  "loaders-preview.html",
  "loaders-preview.css",
  "loaders-preview.js"
];

for (const entry of FORBIDDEN_ENTRIES) {
  const target = path.join(dist, entry);
  if (fs.existsSync(target)) {
    console.error(`Security alert: Forbidden entry leaked into dist: ${entry}. Removing.`);
    fs.rmSync(target, { recursive: true, force: true });
  }
}

function sanitizeForbiddenExtensions(dir) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      sanitizeForbiddenExtensions(full);
    } else {
      const lower = entry.name.toLowerCase();
      if (
        lower.endsWith(".ts") ||
        lower.endsWith(".tsx") ||
        lower.endsWith(".tsbuildinfo") ||
        lower.startsWith("tsconfig") ||
        lower.startsWith(".env") ||
        lower.endsWith(".md") ||
        lower.endsWith(".map")
      ) {
        fs.unlinkSync(full);
      }
    }
  }
}

sanitizeForbiddenExtensions(dist);

console.log(`✓ Assembled ${path.relative(root, dist)}/: site from dist-site/ + static assets.`);
