import assert from 'node:assert';
import fs from 'node:fs';

console.log('Running Post-Fix Verification: Supabase Progress & Deletion Security...');

// 1. Check server/supabase.ts code content
const supabaseTs = fs.readFileSync('server/supabase.ts', 'utf-8');

// Verify backendSaveProgress exists
assert.ok(supabaseTs.includes('export async function backendSaveProgress('), 'backendSaveProgress is exported');
assert.ok(supabaseTs.includes('export const backendSyncProgress = backendSaveProgress'), 'backendSyncProgress is aliased');

// Verify no .eq('id', userId) on profiles
const profileEqIdMatches = supabaseTs.match(/\.from\(['"]profiles['"]\)[^;]+?\.eq\(['"]id['"],\s*userId\)/g);
assert.strictEqual(profileEqIdMatches, null, 'Must NOT contain .eq("id", userId) on profiles queries');

// Verify only .eq('user_id', userId) is used on profiles in progress and delete
assert.ok(/\.from\(['"]profiles['"]\)[\s\S]*?\.update\(progPayload\)[\s\S]*?\.eq\(['"]user_id['"],\s*userId\)/.test(supabaseTs), 'Profiles update uses user_id');
assert.ok(/\.from\(['"]profiles['"]\)[\s\S]*?\.delete\(\)[\s\S]*?\.eq\(['"]user_id['"],\s*userId\)/.test(supabaseTs), 'Profiles delete uses user_id');

// Verify 503 check on missing admin client in production
assert.ok(supabaseTs.includes('if (isProduction && !client)'), 'Production mode checks for missing admin client');
assert.ok(supabaseTs.includes('error.status = 503'), 'Sets error status to 503');

// 2. Check server/routes/account.ts
const accountTs = fs.readFileSync('server/routes/account.ts', 'utf-8');
assert.ok(accountTs.includes('backendSaveProgress'), 'account.ts imports backendSaveProgress');
assert.ok(accountTs.includes('user.id'), 'sync route uses verified session user.id');
assert.ok(!accountTs.includes('req.body.userId'), 'sync route does not trust req.body.userId');

// 3. Check .env.example
const envExample = fs.readFileSync('.env.example', 'utf-8');
assert.ok(envExample.includes('SUPABASE_SERVICE_ROLE_KEY'), '.env.example includes SUPABASE_SERVICE_ROLE_KEY');

console.log('✓ All 5 verification checks passed successfully.');
