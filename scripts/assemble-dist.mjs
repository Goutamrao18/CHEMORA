// Assemble the deployable tree: static site at dist/, built game at dist/play/.
import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dist = path.resolve(root, process.argv[2] ?? "dist");
const gameDist = path.resolve(root, process.argv[3] ?? "game/dist");

// Anything not meant to be public. api/ is deployed by Vercel from the repo root, not from dist/.
const EXCLUDE_TOP = new Set([
  ".git", ".github", ".vercel", ".gitignore", "node_modules", "dist", "game", "scripts", "api",
  "Makefile", "package.json", "package-lock.json", "pnpm-lock.yaml", "vercel.json",
]);
const isDoc = name => /\.md$/i.test(name);

if (!fs.existsSync(path.join(gameDist, "index.html"))) {
  console.log(`Game build not found at ${path.relative(root, gameDist)} - automatically building 3D lab...`);
  try {
    execSync("npm run build", { cwd: path.join(root, "game"), stdio: "inherit" });
  } catch (gameErr) {
    console.error(`Failed to build game: ${gameErr?.message}`);
    process.exit(1);
  }
}
if (dist === root || dist.startsWith(gameDist)) { console.error("Refusing unsafe dist path."); process.exit(1); }

// Check if root Vite app needs compilation
let hadAssets = fs.existsSync(path.join(dist, "assets"));
let hadCompiledIndex = fs.existsSync(path.join(dist, "index.html")) &&
  fs.readFileSync(path.join(dist, "index.html"), "utf8").includes("/assets/index-");

if (!hadAssets || !hadCompiledIndex) {
  try {
    console.log("Building root React/Vite application for production...");
    execSync("npm run build", { cwd: root, stdio: "inherit" });
    hadAssets = fs.existsSync(path.join(dist, "assets"));
    hadCompiledIndex = fs.existsSync(path.join(dist, "index.html")) &&
      fs.readFileSync(path.join(dist, "index.html"), "utf8").includes("/assets/index-");
  } catch (buildErr) {
    console.warn("Vite production build warning:", buildErr?.message);
  }
}

// Preserve compiled Vite output before clearing dist
const tempAssets = path.join(root, ".temp-dist-assets");
const tempIndex = path.join(root, ".temp-dist-index.html");

if (hadAssets) {
  fs.cpSync(path.join(dist, "assets"), tempAssets, { recursive: true });
}
if (hadCompiledIndex) {
  fs.copyFileSync(path.join(dist, "index.html"), tempIndex);
}

fs.rmSync(dist, { recursive: true, force: true });
fs.mkdirSync(dist, { recursive: true });

let siteFiles = 0;
for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
  if (EXCLUDE_TOP.has(entry.name) || isDoc(entry.name) || entry.name.startsWith(".env") || entry.name.startsWith(".temp")) continue;
  fs.cpSync(path.join(root, entry.name), path.join(dist, entry.name), { recursive: true });
  siteFiles++;
}

// Restore compiled assets and compiled SPA entry point
if (hadAssets && fs.existsSync(tempAssets)) {
  fs.cpSync(tempAssets, path.join(dist, "assets"), { recursive: true });
  fs.rmSync(tempAssets, { recursive: true, force: true });
}
if (hadCompiledIndex && fs.existsSync(tempIndex)) {
  fs.copyFileSync(tempIndex, path.join(dist, "index.html"));
  fs.rmSync(tempIndex, { force: true });
}

fs.cpSync(gameDist, path.join(dist, "play"), { recursive: true });
console.log(`Assembled ${path.relative(root, dist)}/: ${siteFiles} site entries + game at /play/`);
