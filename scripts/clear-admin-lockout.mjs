#!/usr/bin/env node
/**
 * scripts/clear-admin-lockout.mjs
 * Utility script to clear CHEMORA administrator rate-limit lockouts
 *
 * Usage:
 *   node scripts/clear-admin-lockout.mjs --email=myadmin@domain.com
 *   node scripts/clear-admin-lockout.mjs --ip=127.0.0.1
 *   node scripts/clear-admin-lockout.mjs --all
 */

import dotenv from 'dotenv';
import { Redis } from '@upstash/redis';

dotenv.config();

const args = process.argv.slice(2);
let targetEmail = '';
let targetIp = '';
let clearAll = false;

for (const arg of args) {
  if (arg === '--all') {
    clearAll = true;
  } else if (arg.startsWith('--email=')) {
    targetEmail = arg.slice(8).trim().toLowerCase();
  } else if (arg.startsWith('--ip=')) {
    targetIp = arg.slice(5).trim();
  }
}

if (!clearAll && !targetEmail && !targetIp) {
  console.log(`
🛡️ CHEMORA Admin Lockout Clear Utility
----------------------------------------
Usage:
  node scripts/clear-admin-lockout.mjs --email=<email>
  node scripts/clear-admin-lockout.mjs --ip=<ip>
  node scripts/clear-admin-lockout.mjs --all

Examples:
  node scripts/clear-admin-lockout.mjs --email=myadmin@domain.com
  node scripts/clear-admin-lockout.mjs --ip=127.0.0.1
  node scripts/clear-admin-lockout.mjs --all
`);
  process.exit(0);
}

async function run() {
  console.log('🔄 Clearing admin rate limit lockout...');

  const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
  const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (redisUrl && redisToken) {
    try {
      const redis = new Redis({ url: redisUrl, token: redisToken });
      console.log('📡 Connected to Upstash Redis store.');

      if (clearAll) {
        const keys = await redis.keys('chemora:ratelimit:admin:*');
        if (keys && keys.length > 0) {
          for (const k of keys) {
            await redis.del(k);
          }
          console.log(`✅ Cleared ${keys.length} rate limit keys from Upstash Redis.`);
        } else {
          console.log('ℹ️ No active admin rate limit keys found in Redis.');
        }
      } else {
        if (targetEmail) {
          const emailKey = `chemora:ratelimit:admin:email:${targetEmail}`;
          await redis.del(emailKey);
          console.log(`✅ Cleared email lockout key: ${emailKey}`);
        }
        if (targetIp) {
          const ipKey = `chemora:ratelimit:admin:ip:${targetIp}`;
          await redis.del(ipKey);
          console.log(`✅ Cleared IP lockout key: ${ipKey}`);
        }
      }
    } catch (err) {
      console.error('❌ Failed to clear keys in Redis:', err.message);
    }
  } else {
    console.log('ℹ️ Upstash Redis is not configured in environment variables.');
    console.log('   In local development without Redis, restarting the dev server (or waiting 15 minutes)');
    console.log('   resets the in-memory failure counter immediately:');
    console.log('   npm run dev');
  }

  console.log('\n✨ Lockout reset complete.');
}

run().catch((err) => {
  console.error('Fatal error running lockout clear utility:', err);
  process.exit(1);
});
