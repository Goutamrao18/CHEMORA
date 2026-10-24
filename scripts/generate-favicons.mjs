#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const publicDir = path.resolve(rootDir, 'public');

if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Source icon: prefer svg or existing 512 png
let sourcePath = path.resolve(rootDir, 'assets/chemora-mark.svg');
if (!fs.existsSync(sourcePath)) {
  sourcePath = path.resolve(rootDir, 'public/icon-512.png');
}

console.log(`Generating icon set from: ${sourcePath}`);

async function generate() {
  const baseImg = sharp(sourcePath);

  // 16x16 PNG
  await baseImg.clone().resize(16, 16).png().toFile(path.resolve(publicDir, 'favicon-16x16.png'));
  fs.copyFileSync(path.resolve(publicDir, 'favicon-16x16.png'), path.resolve(rootDir, 'favicon-16x16.png'));

  // 32x32 PNG
  await baseImg.clone().resize(32, 32).png().toFile(path.resolve(publicDir, 'favicon-32x32.png'));
  fs.copyFileSync(path.resolve(publicDir, 'favicon-32x32.png'), path.resolve(rootDir, 'favicon-32x32.png'));

  // favicon.ico (32x32 PNG header in ico format or clean 32x32)
  await baseImg.clone().resize(32, 32).png().toFile(path.resolve(publicDir, 'favicon.ico'));
  fs.copyFileSync(path.resolve(publicDir, 'favicon.ico'), path.resolve(rootDir, 'favicon.ico'));

  // apple-touch-icon 180x180
  await baseImg.clone().resize(180, 180).png().toFile(path.resolve(publicDir, 'apple-touch-icon.png'));
  fs.copyFileSync(path.resolve(publicDir, 'apple-touch-icon.png'), path.resolve(rootDir, 'apple-touch-icon.png'));

  // 192x192
  await baseImg.clone().resize(192, 192).png().toFile(path.resolve(publicDir, 'icon-192.png'));
  fs.copyFileSync(path.resolve(publicDir, 'icon-192.png'), path.resolve(rootDir, 'icon-192.png'));

  // 512x512
  await baseImg.clone().resize(512, 512).png().toFile(path.resolve(publicDir, 'icon-512.png'));
  fs.copyFileSync(path.resolve(publicDir, 'icon-512.png'), path.resolve(rootDir, 'icon-512.png'));

  // 512x512 Maskable (with 10% safe zone padding)
  const innerBuffer = await baseImg.clone().resize(410, 410).png().toBuffer();
  await sharp({
    create: {
      width: 512,
      height: 512,
      channels: 4,
      background: { r: 8, g: 13, b: 23, alpha: 1 } // #080d17
    }
  })
    .composite([{ input: innerBuffer, top: 51, left: 51 }])
    .png()
    .toFile(path.resolve(publicDir, 'icon-512-maskable.png'));
  fs.copyFileSync(path.resolve(publicDir, 'icon-512-maskable.png'), path.resolve(rootDir, 'icon-512-maskable.png'));

  console.log('✅ Complete favicon set created successfully!');
}

generate().catch(console.error);
