# History

Newest first.

## 2026-10-08 · Favicon fix
- Gave copy-paste lines using the existing `favicon.png`. Also generated `favicon-32.png` (about 2 KB) and `favicon-192.png` (about 33 KB) because the original is 1.2 MB. Upload is optional.

## 2026-10-08 · Profile row bug (found on the live site)
- Live site (chemora-one.vercel.app) logged in correctly, so the Supabase key and URL are good.
- Avatar save failed: "no profile row found for this account". Supabase screenshot showed `profiles` with 0 records and 1 RLS policy.
- Cause: nothing creates a profile row on signup.
- Fix: `fix-profiles.sql` (unique index on `user_id`, column defaults, backfill, signup trigger, own-row RLS policies, column-level grants for name/avatar only) and an insert-if-missing fallback in `account.html`.
- **Pending:** user must run the SQL and redeploy `account.html`.
- Earlier preview error "Failed to fetch" was the Claude preview blocking network access, not a code bug.

## 2026-10-08 · Security audit v1
- Reviewed the full `chemora.zip` against the 20-point checklist.
- Result: 11 clear / N/A, 9 needing action (2 High, 4 Medium, 3 Low). Details in `list.md`.
- No secrets, source maps, default credentials or webhooks found.
- Created `readme.md`, `list.md`, `task.md`, `todo.md`, `history.md`, `update_upgrade.md`.
- **Not covered:** live site headers, Supabase dashboard settings (RLS, storage, auth), dependency CVE scan (no `package.json`, no network).

## 2026-10-08 · Account page CSS fixes (`account.css`, `account.html`)
- Removed `style.css` from the account page (home-page styles clashed with the account design); added Inter font.
- Fixed `.full-width` / `.form-actions`, spacing between profile card and tabs, focus and disabled styles.
- Fixed horizontal overflow on phones; tabs now scroll inside their own row; stats card wraps.

## 2026-10-08 · Account page JS fixes (`account.html`)
- Loaded `supabase-js` in `<head>` before the scripts using it.
- Merged three scripts into one; removed duplicate `const` declarations that caused a syntax error.
- Removed lookup of non-existent `registerBtn`; removed duplicate login listener and page reload.
- Removed avatar upload handler nested in the tab-click handler (it was re-attached on every tab click) and a duplicate copy.
- Moved a stray avatar block out of the gap between `</head>` and `<body>`.
- Wired up "Modify Passkey" (`auth.updateUser`); Enter now submits login; signup handles email-confirmation flow.
- Update calls now report an error if no profile row was changed.
- Open question: the original file contained two slightly different Supabase publishable keys; one was kept and flagged for confirmation.

## Baseline
- Project: Chemora (static site + Vercel serverless `api/assistant.js`, `api/reaction.js`; Supabase for auth, `profiles` table and `avatars` storage).
