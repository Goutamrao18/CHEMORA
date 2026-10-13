// Assemble the deployable tree: static site at dist/, built game at dist/play/.
import fs from "node:fs";
import path from "node:path";
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
  console.error(`Game build not found at ${path.relative(root, gameDist)} - run 'make build-game' first.`);
  process.exit(1);
}
if (dist === root || dist.startsWith(gameDist)) { console.error("Refusing unsafe dist path."); process.exit(1); }

fs.rmSync(dist, { recursive: true, force: true });
fs.mkdirSync(dist, { recursive: true });

let siteFiles = 0;
for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
  if (EXCLUDE_TOP.has(entry.name) || isDoc(entry.name) || entry.name.startsWith(".env")) continue;
  fs.cpSync(path.join(root, entry.name), path.join(dist, entry.name), { recursive: true });
  siteFiles++;
}
fs.cpSync(gameDist, path.join(dist, "play"), { recursive: true });
console.log(`Assembled ${path.relative(root, dist)}/: ${siteFiles} site entries + game at /play/`);
