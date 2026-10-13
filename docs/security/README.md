# Chemora Security Audit

**Date:** 2026-10-08 (updated after profile and favicon fixes)  **Type:** Static source review (white-box)  **Scope:** `chemora.zip` (Chemora-main)

## What this is
A review of the Chemora website source against a 20-point web-security checklist. Everything is in this folder:

| File | Purpose |
|---|---|
| `readme.md` | This overview, scope and summary |
| `list.md` | The 20 checks with result, severity and evidence |
| `task.md` | Detailed fix instructions with code (T-01 ... T-14) |
| `todo.md` | Short tick-box backlog, ordered by priority |
| `history.md` | Dated log of audit and code changes |
| `update_upgrade.md` | Library, config and platform upgrades |
| `../fix-profiles.sql` | SQL to run in Supabase: profile rows, trigger, RLS, column grants |

> These files live in `security-audit/` so `readme.md` does not collide with your site's existing `README.md` (case-insensitive filesystems treat them as the same file).

## Result at a glance
- **11 of 20** checks: no issue found, or not applicable.
- **9 of 20** need action: 2 High, 4 Medium, 3 Low.
- **No leaked secrets** were found. No service-role key, no hardcoded OpenRouter key, no `.env`, no source maps.

### Top 5 things to fix first
1. **Public AI endpoints have no auth or rate limit** (`api/assistant.js`, `api/reaction.js`). Anyone can run up your OpenRouter bill. `reaction.js` is not even used by the site, so delete it. (T-01, T-02)
2. **Supabase RLS and storage rules are unverified.** The site relies on filtering by `user_id` in browser code, which is not security. Confirm RLS is on and that users cannot edit their own XP, streak or levels. (T-03, T-04)
3. **Avatar upload checks are client-side only.** Enforce size and type on the Supabase bucket. (T-05)
4. **Unpinned third-party scripts with no integrity check** (`unpkg.com/@phosphor-icons/web`, `supabase-js@2`). (T-06)
5. **No Content-Security-Policy or security headers.** (T-07)

## Status since the audit
| Item | Status |
|---|---|
| Account page login / profile / avatar code | Fixed in `account.html`; works on the live site (chemora-one.vercel.app) |
| `profiles` table empty, "no profile row found" | `fix-profiles.sql` written, **waiting for you to run it in Supabase**. `account.html` also creates a missing row itself |
| RLS on `profiles` | Table shows 1 policy; contents unknown. `fix-profiles.sql` replaces it with own-row policies. Delete any older "allow all" policy |
| All other audit findings (T-01, T-02, T-05 to T-13) | **Open** |

## Method and limits (please read)
- **Reviewed:** all HTML, JS, JSON, CSS and API files in the zip, using targeted searches (XSS sinks, storage, fetches, secrets, logging, CDN scripts) plus a manual read of the API handlers and the account page.
- **Not reviewed:** your live deployment, Vercel project settings, response headers, and the **Supabase dashboard** (tables, RLS policies, storage policies, auth settings). Anything marked **VERIFY** depends on those and cannot be confirmed from code alone.
- **No dependency scan was possible.** There is no `package.json` or lockfile, and the sandbox had no network, so `npm audit` could not run.
- This is not a penetration test. Nothing was exploited or sent to your live site.

## Severity scale
- **High:** realistic abuse with financial or data impact.
- **Medium:** weakens defenses or needs a second flaw to hurt.
- **Low:** hygiene or hardening.
- **VERIFY:** cannot be judged from code. Check the named setting.
