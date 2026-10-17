import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');

if (fs.existsSync(dist)) {
  const dirsToCopy = ['videos', 'know', 'assets', 'challenge', 'data'];
  for (const d of dirsToCopy) {
    const src = path.join(root, d);
    const dest = path.join(dist, d);
    if (fs.existsSync(src)) {
      fs.cpSync(src, dest, { recursive: true, force: false });
    }
  }

  const filesToCopy = [
    'account.html',
    'privacy.html',
    'progress.html',
    'manifest.webmanifest',
    'service-worker.js',
    'robots.txt',
    'sitemap.xml',
    'modern-overhaul.css',
    'site-polish.css',
    'v2-enhancements.css',
    'glass.css',
    'style.css'
  ];

  for (const f of filesToCopy) {
    const src = path.join(root, f);
    const dest = path.join(dist, f);
    if (fs.existsSync(src) && !fs.existsSync(dest)) {
      fs.copyFileSync(src, dest);
    }
  }
  console.log('✓ Successfully synchronized static multimedia, challenge data, and web assets to dist/');
}
