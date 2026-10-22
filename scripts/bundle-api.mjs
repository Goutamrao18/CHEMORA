import esbuild from 'esbuild';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

async function bundleApi() {
  const entryPoint = path.join(rootDir, 'server', 'api-app.ts');
  const outIndex = path.join(rootDir, 'api', 'index.js');
  const outCatchAll = path.join(rootDir, 'api', '[...path].js');

  console.log('⚡ Bundling serverless API entry point for Vercel/Node runtime...');

  await esbuild.build({
    entryPoints: [entryPoint],
    bundle: true,
    platform: 'node',
    target: 'node20',
    format: 'esm',
    packages: 'external',
    outfile: outIndex,
    banner: {
      js: '// Auto-generated bundle from server/api-app.ts for Vercel/Node serverless environments\n',
    },
    logLevel: 'info',
  });

  // Also create catch-all endpoint api/[...path].js for Vercel dynamic routing
  fs.copyFileSync(outIndex, outCatchAll);
  console.log(`✅ Successfully generated ${outIndex} and ${outCatchAll}`);
}

bundleApi().catch((err) => {
  console.error('Fatal API bundling error:', err);
  process.exit(1);
});
