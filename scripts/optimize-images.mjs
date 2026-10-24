import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const directory = path.resolve('know/image');

async function optimizeImages() {
  if (!fs.existsSync(directory)) {
    console.log(`Directory ${directory} does not exist.`);
    return;
  }

  const files = fs.readdirSync(directory);
  let totalOriginal = 0;
  let totalOptimized = 0;

  console.log(`Optimizing images in ${directory}...`);

  for (const file of files) {
    if (file.endsWith('.png') && !file.endsWith('.min.png')) {
      const filePath = path.join(directory, file);
      const originalStat = fs.statSync(filePath);
      const originalSize = originalStat.size;
      totalOriginal += originalSize;

      // Also ensure WebP is updated and high quality
      const webpPath = filePath.replace(/\.png$/, '.webp');
      const webpBuffer = await sharp(filePath)
        .resize({ width: 800, height: 800, fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 85, effort: 6 })
        .toBuffer();
      fs.writeFileSync(webpPath, webpBuffer);

      // Optimize PNG in-place (resize max 800x800 for web delivery, palette 256 or png compression)
      const pngBuffer = await sharp(filePath)
        .resize({ width: 800, height: 800, fit: 'inside', withoutEnlargement: true })
        .png({ compressionLevel: 9, palette: true, quality: 90 })
        .toBuffer();

      // Only write if smaller
      if (pngBuffer.length < originalSize) {
        fs.writeFileSync(filePath, pngBuffer);
        totalOptimized += pngBuffer.length;
        console.log(`✓ ${file}: ${(originalSize / 1024).toFixed(1)}KB -> ${(pngBuffer.length / 1024).toFixed(1)}KB (saved ${(((originalSize - pngBuffer.length) / originalSize) * 100).toFixed(1)}%)`);
      } else {
        totalOptimized += originalSize;
        console.log(`- ${file}: already optimal`);
      }
    }
  }

  const savedMb = ((totalOriginal - totalOptimized) / (1024 * 1024)).toFixed(2);
  const percent = (((totalOriginal - totalOptimized) / totalOriginal) * 100).toFixed(1);
  console.log(`\nImage Optimization Complete!`);
  console.log(`Original total: ${(totalOriginal / (1024 * 1024)).toFixed(2)} MB`);
  console.log(`Optimized total: ${(totalOptimized / (1024 * 1024)).toFixed(2)} MB`);
  console.log(`Total saved: ${savedMb} MB (${percent}%)`);
}

optimizeImages().catch((err) => {
  console.error('Image optimization failed:', err);
  process.exit(1);
});
