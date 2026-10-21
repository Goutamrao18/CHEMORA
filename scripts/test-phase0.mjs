import assert from 'node:assert/strict';
import { SyncProgressSchema } from '../server/routes/account.ts';
import { backendSyncProgress, backendResetPasswordRequest } from '../server/supabase.ts';

console.log('🧪 Starting Phase 0 Security & Critical Bug Tests...');

// -------------------------------------------------------------
// Test 1: SyncProgressSchema has no default(0) that wipes fields
// -------------------------------------------------------------
const partialParsed = SyncProgressSchema.parse({ streakDays: 7 });
assert.equal(partialParsed.streakDays, 7);
assert.equal(partialParsed.experimentsCompleted, undefined, 'experimentsCompleted must be undefined when not supplied');
assert.equal(partialParsed.challengesCompleted, undefined, 'challengesCompleted must be undefined when not supplied');
assert.equal(partialParsed.totalXp, undefined, 'totalXp must be undefined when not supplied');
console.log('✓ Test 1 Passed: SyncProgressSchema omits defaults, preventing accidental zero-wipes.');

// -------------------------------------------------------------
// Test 2: backendSyncProgress preserves existing progress on partial sync
// -------------------------------------------------------------
const userId = 'test-phase0-user-' + Date.now();

// Initial sync with full data
const initial = await backendSyncProgress(userId, {
  experimentsCompleted: 5,
  challengesCompleted: 10,
  streakDays: 3,
  totalXp: 1200,
  completedExperimentIds: ['exp-1', 'exp-2'],
});
assert.equal(initial.progress.experimentsCompleted, 5);
assert.equal(initial.progress.totalXp, 1200);

// Partial sync that only updates streak
const partialSync = await backendSyncProgress(userId, {
  streakDays: 4,
});
assert.equal(partialSync.progress.streakDays, 4);
assert.equal(partialSync.progress.experimentsCompleted, 5, 'experimentsCompleted must not be wiped');
assert.equal(partialSync.progress.challengesCompleted, 10, 'challengesCompleted must not be wiped');
assert.equal(partialSync.progress.totalXp, 1200, 'totalXp must not be wiped');
assert.deepEqual(partialSync.progress.completedExperimentIds, ['exp-1', 'exp-2'], 'experiment IDs must not be wiped');
console.log('✓ Test 2 Passed: backendSyncProgress merges partial data without wiping existing counters.');

// -------------------------------------------------------------
// Test 3: Counters never decrease and XP gain is capped
// -------------------------------------------------------------
const maliciousSync = await backendSyncProgress(userId, {
  experimentsCompleted: 1, // attempt to decrease
  totalXp: 9999999, // attempt to forge millions of XP in one sync
});
assert.equal(maliciousSync.progress.experimentsCompleted, 5, 'experimentsCompleted must never decrease');
// Max gain is 5000: 1200 + 5000 = 6200
assert.equal(maliciousSync.progress.totalXp, 6200, 'per-sync XP gain must be capped at 5000');
console.log('✓ Test 3 Passed: Counters are monotonically non-decreasing and client totalXp forgery is capped.');

// -------------------------------------------------------------
// Test 4: backendResetPasswordRequest never returns resetToken to caller
// -------------------------------------------------------------
const resetResult = await backendResetPasswordRequest('student@example.com');
assert.equal(resetResult.success, true);
assert.equal(resetResult.resetToken, undefined, 'resetToken must NEVER be returned in response');
assert.equal(typeof resetResult.message, 'string');
assert.match(resetResult.message, /If an account exists/i, 'Generic message must be returned');
console.log('✓ Test 4 Passed: Password reset never leaks resetToken in API response.');

console.log('🎉 All Phase 0 critical regression tests passed successfully!');
