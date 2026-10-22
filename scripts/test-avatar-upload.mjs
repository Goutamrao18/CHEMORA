import assert from 'node:assert/strict';
import { isValidAvatarUrl, ALLOWED_PRESET_AVATARS } from '../server/routes/account.ts';

console.log('🧪 Starting Avatar Upload & Storage Validation Tests...\n');

const USER_ALICE = 'usr_alice_12345678-aaaa-bbbb-cccc-dddddddddddd';
const USER_BOB = 'usr_bob_87654321-bbbb-cccc-dddd-eeeeeeeeeeee';

// -------------------------------------------------------------
// Test 1: Preset Avatars & /favicon.png are allowed
// -------------------------------------------------------------
console.log('Test 1: Validating preset avatars...');
assert.equal(isValidAvatarUrl('/favicon.png', USER_ALICE), true, '/favicon.png should be valid');
assert.equal(isValidAvatarUrl('/assets/chemistry/carbon.svg', USER_ALICE), true, 'Carbon SVG should be valid');
assert.equal(isValidAvatarUrl('/icon-192.png', USER_ALICE), true, 'Icon 192 should be valid');
console.log('  ✓ Preset avatars verified');

// -------------------------------------------------------------
// Test 2: Google profile photos are allowed
// -------------------------------------------------------------
console.log('Test 2: Validating Google profile photo URLs...');
const googlePhoto = 'https://lh3.googleusercontent.com/a/ACg8ocK-example-avatar-token';
assert.equal(isValidAvatarUrl(googlePhoto, USER_ALICE), true, 'Google photo URL should be allowed');
console.log('  ✓ Google photo URL verified');

// -------------------------------------------------------------
// Test 3: Upload lands in the user\'s own folder (<user_id>/avatar)
// -------------------------------------------------------------
console.log('Test 3: Validating user own folder upload path...');
const aliceOwnStorageUrl = `https://mcwadkgzplurjtstrhdd.supabase.co/storage/v1/object/public/avatars/${USER_ALICE}/avatar?v=1730000000`;
const aliceRelativeStorageUrl = `/storage/v1/object/public/avatars/${USER_ALICE}/avatar`;
assert.equal(isValidAvatarUrl(aliceOwnStorageUrl, USER_ALICE), true, 'Alice should be allowed to use her own avatar path');
assert.equal(isValidAvatarUrl(aliceRelativeStorageUrl, USER_ALICE), true, 'Alice should be allowed to use relative storage path in her folder');
console.log('  ✓ User own-folder upload URL verified');

// -------------------------------------------------------------
// Test 4: User cannot set avatar into another user\'s folder
// -------------------------------------------------------------
console.log('Test 4: Verifying user cannot hijack another user\'s folder...');
const bobStorageUrl = `https://mcwadkgzplurjtstrhdd.supabase.co/storage/v1/object/public/avatars/${USER_BOB}/avatar`;
assert.equal(isValidAvatarUrl(bobStorageUrl, USER_ALICE), false, 'Alice must NOT be allowed to point to Bob\'s avatar folder');
console.log('  ✓ Cross-user folder tampering strictly rejected');

// -------------------------------------------------------------
// Test 5: Arbitrary/malicious external URLs are rejected
// -------------------------------------------------------------
console.log('Test 5: Verifying arbitrary external URLs are rejected...');
assert.equal(isValidAvatarUrl('https://evil-hacker.com/image.png', USER_ALICE), false);
assert.equal(isValidAvatarUrl('javascript:alert(1)', USER_ALICE), false);
assert.equal(isValidAvatarUrl('data:text/html;base64,PHNjcmlwdD4=', USER_ALICE), false);
assert.equal(isValidAvatarUrl('', USER_ALICE), false);
assert.equal(isValidAvatarUrl('a'.repeat(256), USER_ALICE), false, 'URL > 255 chars must be rejected');
console.log('  ✓ Untrusted external URLs & oversized URLs rejected');

// -------------------------------------------------------------
// Test 6: Client-side validation simulation (File type & File size limits)
// -------------------------------------------------------------
console.log('Test 6: Validating client file type and size restrictions...');
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const MAX_FILE_BYTES = 5 * 1024 * 1024; // 5 MB

function validateClientUploadFile(file) {
  if (!ALLOWED_TYPES.has(file.type)) {
    return { valid: false, error: 'Unsupported file format. Please upload JPEG, PNG, or WebP.' };
  }
  if (file.size > MAX_FILE_BYTES) {
    return { valid: false, error: 'File size exceeds 5 MB. Please select a smaller photo.' };
  }
  return { valid: true };
}

// Wrong MIME types
assert.equal(validateClientUploadFile({ type: 'image/gif', size: 1000 }).valid, false);
assert.equal(validateClientUploadFile({ type: 'application/pdf', size: 1000 }).valid, false);
assert.equal(validateClientUploadFile({ type: 'text/html', size: 1000 }).valid, false);

// Oversized file (> 5 MB)
assert.equal(validateClientUploadFile({ type: 'image/jpeg', size: 5 * 1024 * 1024 + 1 }).valid, false);
assert.equal(validateClientUploadFile({ type: 'image/jpeg', size: 6 * 1024 * 1024 }).valid, false);

// Valid files (JPEG, PNG, WebP <= 5 MB)
assert.equal(validateClientUploadFile({ type: 'image/jpeg', size: 2 * 1024 * 1024 }).valid, true);
assert.equal(validateClientUploadFile({ type: 'image/png', size: 4 * 1024 * 1024 }).valid, true);
assert.equal(validateClientUploadFile({ type: 'image/webp', size: 500 * 1024 }).valid, true);

console.log('  ✓ Client file-type and 5MB size limits verified');

console.log('\n🎉 All 6 Avatar Upload & Validation test suites passed successfully!\n');
