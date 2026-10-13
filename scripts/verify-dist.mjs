// Post-build gate: the assembled dist/ must contain a working site AND a game whose asset URLs resolve under /play/.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dist = path.resolve(root, process.argv[2] ?? "dist");
const errors = [];
const need = p => { if (!fs.existsSync(path.join(dist, p))) errors.push(`dist is missing ${p}`); };
["index.html","404.html","progress.html","service-worker.js","manifest.webmanifest","challenge/challenge.html",
 "experiments/experiments.html","know/know.html","play/index.html"].forEach(need);
for (const leaked of ["api","game","scripts","Makefile","package.json","vercel.json","README.md","node_modules"]) {
  if (fs.existsSync(path.join(dist, leaked))) errors.push(`dist must not contain ${leaked}`);
}
const gameHtmlPath = path.join(dist, "play/index.html");
if (fs.existsSync(gameHtmlPath)) {
  const html = fs.readFileSync(gameHtmlPath, "utf8");
  if (/src=["']\/src\/main\.tsx/.test(html)) errors.push("play/index.html is the unbuilt dev entry, not a build output.");
  const refs = [...html.matchAll(/\b(?:src|href)=["']([^"']+)["']/g)].map(m => m[1]).filter(v => v.startsWith("/") && !v.startsWith("//"));
  if (!refs.some(r => r.startsWith("/play/assets/"))) errors.push("play/index.html has no /play/assets/ references - Vite base path is wrong.");
  for (const r of refs) {
    if (!r.startsWith("/play/")) { errors.push(`play/index.html references ${r} outside /play/ (base path bug).`); continue; }
    if (!fs.existsSync(path.join(dist, r.split("?")[0].slice(1)))) errors.push(`play/index.html references missing file ${r}`);
  }
}
const size = (function total(d){return fs.readdirSync(d,{withFileTypes:true}).reduce((n,e)=>n+(e.isDirectory()?total(path.join(d,e.name)):fs.statSync(path.join(d,e.name)).size),0)})(dist);
if (errors.length) { console.error("dist verification failed:"); errors.forEach(e => console.error("- " + e)); process.exit(1); }
console.log(`dist verified: site + /play/ game wired correctly (${(size/1048576).toFixed(1)} MiB).`);
