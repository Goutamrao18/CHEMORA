import { execSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

console.log('🚀 Running Production Build for CHEMORA...');

// 1. Build root app
console.log('🔨 Building root Vite SPA application...');
execSync('npm run build:site', { cwd: root, stdio: 'inherit' });

// 2. Assemble static site
console.log('📦 Assembling deployable dist/ bundle...');
execSync('node scripts/assemble-dist.mjs dist', { cwd: root, stdio: 'inherit' });

// 3. Verify integrity of dist
console.log('🔍 Verifying dist distribution...');
execSync('node scripts/verify-dist.mjs dist', { cwd: root, stdio: 'inherit' });

console.log('✅ Production build completed successfully!');
