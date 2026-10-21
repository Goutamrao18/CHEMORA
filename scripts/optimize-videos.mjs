import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const videosDir = path.resolve(__dirname, "..", "videos");

// Clean any leftover temp files
for (const f of fs.readdirSync(videosDir)) {
  if (f.endsWith("-opt.mp4")) {
    fs.rmSync(path.join(videosDir, f));
  }
}

const files = fs.readdirSync(videosDir).filter(f => f.endsWith(".mp4") && !f.includes("-opt"));
console.log(`Checking ${files.length} videos in ${videosDir}...`);

for (const file of files) {
  const baseName = path.basename(file, ".mp4");
  const inputPath = path.join(videosDir, file);
  const tempMp4 = path.join(videosDir, `${baseName}-opt.mp4`);
  const webmPath = path.join(videosDir, `${baseName}.webm`);
  const posterPath = path.join(videosDir, `${baseName}-poster.webp`);

  const statBefore = fs.statSync(inputPath);

  // 1. Poster
  if (!fs.existsSync(posterPath)) {
    try {
      execSync(
        `ffmpeg -y -ss 00:00:01 -i "${inputPath}" -vframes 1 -vf "scale='min(800,iw)':-2" -c:v libwebp -quality 75 "${posterPath}"`,
        { stdio: "ignore" }
      );
    } catch {
      execSync(
        `ffmpeg -y -ss 00:00:00.1 -i "${inputPath}" -vframes 1 -vf "scale='min(800,iw)':-2" -c:v libwebp -quality 70 "${posterPath}"`,
        { stdio: "ignore" }
      );
    }
    console.log(`Generated poster for ${baseName}`);
  }

  // 2. WebM
  if (!fs.existsSync(webmPath)) {
    execSync(
      `ffmpeg -y -i "${inputPath}" -vf "scale='min(960,iw)':-2" -c:v libvpx-vp9 -crf 38 -b:v 0 -deadline realtime -cpu-used 8 -row-mt 1 -an "${webmPath}"`,
      { stdio: "ignore" }
    );
    console.log(`Generated WebM for ${baseName}`);
  }

  // 3. MP4 Optimization if larger than 1.5MB
  if (statBefore.size > 1.5 * 1024 * 1024) {
    execSync(
      `ffmpeg -y -i "${inputPath}" -vf "scale='min(960,iw)':-2" -c:v libx264 -crf 29 -preset faster -movflags +faststart -an "${tempMp4}"`,
      { stdio: "ignore" }
    );
    const optSize = fs.statSync(tempMp4).size;
    fs.renameSync(tempMp4, inputPath);
    console.log(`Optimized MP4 ${file}: ${(statBefore.size/1024/1024).toFixed(2)}MB -> ${(optSize/1024/1024).toFixed(2)}MB`);
  } else {
    // If faststart wasn't applied or audio wasn't stripped, strip audio and faststart if not done
    console.log(`Skipping re-encode for ${file} (already ${(statBefore.size/1024/1024).toFixed(2)}MB)`);
  }
}

console.log("All videos optimized successfully.");
