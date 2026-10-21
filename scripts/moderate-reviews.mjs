#!/usr/bin/env node
/**
 * scripts/moderate-reviews.mjs
 * Local administrator CLI for moderating CHEMORA reviews using service-role credentials.
 * Usage:
 *   node scripts/moderate-reviews.mjs list [pending|all|approved|rejected]
 *   node scripts/moderate-reviews.mjs approve <review_id>
 *   node scripts/moderate-reviews.mjs reject <review_id>
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
dotenv.config({ path: path.join(root, '.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be defined in your environment or .env file.');
  process.exit(1);
}

const adminClient = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

const action = process.argv[2];
const target = process.argv[3];

async function main() {
  switch (action) {
    case 'list': {
      const filter = target || 'pending';
      let query = adminClient
        .from('chemora_reviews')
        .select('id, user_id, author_name, rating, status, comment, created_at')
        .order('created_at', { ascending: false });

      if (filter !== 'all') {
        query = query.eq('status', filter);
      }

      const { data, error } = await query;
      if (error) {
        console.error('Failed to fetch reviews:', error.message);
        process.exit(1);
      }

      console.log(`\n📋 CHEMORA Reviews [filter: ${filter}] (${data?.length || 0} found):`);
      console.log('='.repeat(70));
      if (!data || data.length === 0) {
        console.log('No reviews matching filter.');
      } else {
        for (const r of data) {
          console.log(`ID:      ${r.id}`);
          console.log(`Author:  ${r.author_name} (User: ${r.user_id || 'anonymous'})`);
          console.log(`Rating:  ${'★'.repeat(r.rating || 0)} (${r.rating}/5) | Status: [${(r.status || 'pending').toUpperCase()}]`);
          console.log(`Date:    ${r.created_at}`);
          console.log(`Comment: ${r.comment}`);
          console.log('-'.repeat(70));
        }
      }
      break;
    }

    case 'approve': {
      if (!target) {
        console.error('Usage: node scripts/moderate-reviews.mjs approve <review_id>');
        process.exit(1);
      }

      const { data, error } = await adminClient
        .from('chemora_reviews')
        .update({ status: 'approved' })
        .eq('id', target)
        .select('id, author_name, status');

      if (error) {
        console.error('Failed to approve review:', error.message);
        process.exit(1);
      }

      if (!data || data.length === 0) {
        console.error(`Review with ID "${target}" not found.`);
        process.exit(1);
      }

      console.log(`✅ Approved review "${target}" by ${data[0].author_name}.`);
      break;
    }

    case 'reject': {
      if (!target) {
        console.error('Usage: node scripts/moderate-reviews.mjs reject <review_id>');
        process.exit(1);
      }

      const { data, error } = await adminClient
        .from('chemora_reviews')
        .update({ status: 'rejected' })
        .eq('id', target)
        .select('id, author_name, status');

      if (error) {
        console.error('Failed to reject review:', error.message);
        process.exit(1);
      }

      if (!data || data.length === 0) {
        console.error(`Review with ID "${target}" not found.`);
        process.exit(1);
      }

      console.log(`❌ Rejected review "${target}" by ${data[0].author_name}.`);
      break;
    }

    default: {
      console.log('CHEMORA Review Moderation CLI');
      console.log('Usage:');
      console.log('  node scripts/moderate-reviews.mjs list [pending|all|approved|rejected]');
      console.log('  node scripts/moderate-reviews.mjs approve <review_id>');
      console.log('  node scripts/moderate-reviews.mjs reject <review_id>');
      break;
    }
  }
}

main().catch((err) => {
  console.error('Unexpected error in moderation script:', err.message || err);
  process.exit(1);
});
