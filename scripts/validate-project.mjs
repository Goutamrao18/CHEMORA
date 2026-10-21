import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const errors = [];
const files = [];

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if ([".git", "node_modules", ".vercel", "dist", "dist-site"].includes(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full); else files.push(full);
  }
}
walk(root);

const levels = files.filter(f => /[/\\]challenge[/\\]data[/\\]level-\d{3}\.json$/.test(f));
if (levels.length !== 100) errors.push(`Expected 100 challenge JSON files; found ${levels.length}.`);

let questions = 0;
const questionIds = new Set();
for (const file of levels) {
  try {
    const data = JSON.parse(fs.readFileSync(file, "utf8"));
    if (!Array.isArray(data) || data.length !== 10) errors.push(`${path.relative(root, file)} should contain exactly 10 questions.`);
    else {
      questions += data.length;
      for (const [i, q] of data.entries()) {
        if (!q || typeof q.question !== "string" || !Array.isArray(q.options) || q.options.length < 2 ||
            !Number.isInteger(q.answer) || q.answer < 0 || q.answer >= q.options.length ||
            typeof q.explanation !== "string" || !q.explanation.trim()) {
          errors.push(`${path.relative(root, file)} question ${i + 1} has an invalid schema.`);
        }
        if (q?.id && questionIds.has(q.id)) errors.push(`Duplicate question id: ${q.id}`);
        if (q?.id) questionIds.add(q.id);
      }
    }
  } catch { errors.push(`${path.relative(root, file)} is not valid JSON.`); }
}

for (const required of [
  "index.html",
  "progress.html",
  "progress.js",
  "manifest.webmanifest",
  "service-worker.js",
  "api/assistant.js",
  "vercel.json",
  "scripts/validate-project.mjs",
  "Makefile",
  "scripts/assemble-dist.mjs",
  "scripts/verify-dist.mjs"
]) {
  if (!fs.existsSync(path.join(root, required))) errors.push(`Missing required file: ${required}`);
}

const packageJson = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
if (!packageJson.scripts?.["validate:project"]) errors.push("package.json is missing validate:project script.");

// Check common local HTML references (href/src/poster) and CSS url() references.
const skip = value => !value || value.startsWith("#") || /^(?:https?:|mailto:|tel:|data:|javascript:|blob:)/i.test(value);
function checkRef(file, raw, label) {
  const value = raw.split("#")[0].split("?")[0];
  if (skip(value) || !value) return;
  const target = value.startsWith("/") ? path.join(root, value.slice(1)) : path.resolve(path.dirname(file), value);
  if (!fs.existsSync(target)) errors.push(`Broken local ${label} in ${path.relative(root, file)}: ${raw}`);
}

for (const file of files) {
  const ext = path.extname(file).toLowerCase();
  if (ext === ".html") {
    const html = fs.readFileSync(file, "utf8");
    for (const m of html.matchAll(/\b(?:href|src|poster)\s*=\s*["']([^"']+)["']/gi)) checkRef(file, m[1], "reference");
  } else if (ext === ".css") {
    const css = fs.readFileSync(file, "utf8");
    for (const m of css.matchAll(/url\(\s*["']?([^"')]+)["']?\s*\)/gi)) checkRef(file, m[1].trim(), "CSS URL");
  }
}

const vercel = JSON.parse(fs.readFileSync(path.join(root, "vercel.json"), "utf8"));
const policy = vercel.headers?.flatMap(x => x.headers || []).find(x => x.key === "Permissions-Policy")?.value || "";
if (!policy.includes("microphone=(self)")) errors.push("Permissions-Policy must allow same-origin microphone for the voice assistant.");

const sw = fs.readFileSync(path.join(root, "service-worker.js"), "utf8");
for (const url of sw.matchAll(/^\s*"([^"]+)"\s*,?\s*$/gm)) {
  const value = url[1];
  if (value.startsWith("/") && value !== "/" && !fs.existsSync(path.join(root, value.slice(1)))) {
    errors.push(`Service worker precache path does not exist: ${value}`);
  }
}

if (!vercel.buildCommand) errors.push("vercel.json is missing buildCommand.");
if (vercel.outputDirectory !== "dist") errors.push("vercel.json outputDirectory must be 'dist'.");
if (!fs.readFileSync(path.join(root, ".gitignore"), "utf8").includes("dist/")) errors.push(".gitignore must ignore dist/.");

if (errors.length) {
  console.error("CHEMORA validation failed:");
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`CHEMORA validation passed: ${levels.length} levels, ${questions} questions, ${questionIds.size} unique question IDs, required files and local references present.`);
