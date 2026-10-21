// scripts/upload-videos.mjs
// Run via: npm run upload:videos
import { createClient } from '@supabase/supabase-js';
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

// Environment variables only (never hardcode secrets)
const supabaseUrl = (process.env.SUPABASE_URL || '').trim();
const serviceRoleKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in the environment.');
  console.error('Usage:');
  console.error('  SUPABASE_URL="https://xxx.supabase.co" SUPABASE_SERVICE_ROLE_KEY="ey..." npm run upload:videos');
  process.exit(1);
}

const sb = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const videosDir = path.join(root, 'videos-compressed');

if (!existsSync(videosDir)) {
  console.error(`Error: Directory "${videosDir}" does not exist.`);
  console.error('Please place your compressed video files (.mp4, .webm, .webp) in ./videos-compressed/ before running.');
  process.exit(1);
}

const files = readdirSync(videosDir).filter(
  (f) => f.endsWith('.mp4') || f.endsWith('.webm') || f.endsWith('.webp')
);

if (files.length === 0) {
  console.log(`No video or poster files found in ${videosDir}.`);
  process.exit(0);
}

console.log(`Found ${files.length} media assets in ./videos-compressed/ to upload to bucket "videos"...`);

let uploaded = 0;
let failed = 0;

for (const file of files) {
  const ext = path.extname(file).toLowerCase();
  const contentType =
    ext === '.webm'
      ? 'video/webm'
      : ext === '.webp'
      ? 'image/webp'
      : 'video/mp4';

  const filePath = path.join(videosDir, file);
  const fileBuffer = readFileSync(filePath);

  const { error } = await sb.storage.from('videos').upload(file, fileBuffer, {
    contentType,
    cacheControl: '3600',
    upsert: true,
  });

  if (error) {
    console.error(`✗ ${file}: ${error.message}`);
    failed++;
  } else {
    console.log(`✓ ${file} (${(fileBuffer.length / 1024).toFixed(1)} KB)`);
    uploaded++;
  }
}

console.log(`\nUpload complete: ${uploaded} uploaded, ${failed} failed.`);
console.log('Note: after replacing a video, hard refresh (Ctrl+F5 / Cmd+Shift+R) in the browser to see updates due to CDN caching.');
