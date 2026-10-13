import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const htmlPath = path.join(root, 'experiments/experiments.html');
const jsPath = path.join(root, 'experiments/experiments.js');
const cssPath = path.join(root, 'experiments/experiments.css');
const html = fs.readFileSync(htmlPath, 'utf8');
const js = fs.readFileSync(jsPath, 'utf8');
const css = fs.readFileSync(cssPath, 'utf8');

assert.match(html, /href=["']experiments\.css["']/i, 'Experiments stylesheet must be linked.');
assert.match(html, /id=["']modal["'][^>]*\bhidden\b/i, 'Modal must start hidden in HTML.');
assert.match(html, /role=["']dialog["']/i, 'Modal should use dialog semantics.');
assert.match(html, /aria-modal=["']true["']/i, 'Modal should announce modality.');
assert.match(css, /\[hidden\].*display\s*:\s*none\s*!important/i, 'Hidden elements must remain hidden when modal styles declare display.');
assert.match(js, /event\.key === 'Escape'/, 'Dialog must close with Escape.');
assert.match(js, /event\.key === 'Enter' \|\| event\.key === ' '/, 'Experiment cards must be keyboard operable.');
assert.match(js, /role="status" aria-live="polite"/, 'Video fallback should announce changes to assistive technology.');
assert.match(js, /renderVideoFallback/, 'A graceful fallback is required for media load errors.');
assert.match(js, /chemoraExperimentProgress/, 'Experiment completion progress key should be preserved.');

const dataStart = js.indexOf('const EXPERIMENTS=') + 'const EXPERIMENTS='.length;
const dataEnd = js.indexOf('\n\nconst grid', dataStart);
assert.ok(dataStart >= 'const EXPERIMENTS='.length && dataEnd > dataStart, 'Experiment data block must exist.');
const experiments = JSON.parse(js.slice(dataStart, dataEnd).trim().replace(/;$/, ''));
assert.equal(experiments.length, 20, 'All 20 experiments should remain available.');
const ids = new Set();
for (const experiment of experiments) {
  assert.ok(experiment.id && experiment.title, 'Every experiment needs an ID and title.');
  assert.ok(!ids.has(experiment.id), `Duplicate experiment ID: ${experiment.id}`);
  ids.add(experiment.id);
  assert.ok(Array.isArray(experiment.steps) && experiment.steps.length > 0, `${experiment.id} needs steps.`);
  assert.ok(Array.isArray(experiment.observations) && experiment.observations.length > 0, `${experiment.id} needs observations.`);
  const video = path.join(root, 'videos', `${experiment.id}.mp4`);
  assert.ok(fs.existsSync(video), `Missing experiment video/explainer: videos/${experiment.id}.mp4`);
  assert.ok(fs.statSync(video).size > 10_000, `Media file appears invalid or empty: videos/${experiment.id}.mp4`);
}
assert.ok(experiments.some(x => x.id === 'catalyst-manganese'));
assert.ok(experiments.some(x => x.id === 'electrolysis-copper'));
console.log(`Experiments regression test passed: stylesheet, modal semantics, keyboard support, fallback, progress storage, ${experiments.length} experiments and all media assets.`);
