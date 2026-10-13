# Security To-Do

Detailed steps for each item are in `task.md`.

## P0 · Do now (cost and data exposure)
- [ ] T-01 Delete `api/reaction.js` and redeploy
- [ ] T-02 Rate limit `/api/assistant` (Vercel Firewall rule is the 5-minute fix)
- [ ] T-02 Set a spend cap on the OpenRouter key
- [ ] T-03 / T-15 **Run `fix-profiles.sql` in Supabase SQL Editor** (fixes missing profile row + RLS)
- [ ] T-03 Confirm RLS is **enabled** on `profiles`; delete any old "allow all" policy
- [ ] T-03 Confirm users cannot update `xp_earned`, `levels_cleared`, `daily_streak`
- [ ] T-05 Set avatar bucket size and MIME limits; add per-user storage policies

## P1 · This week
- [ ] T-06 Pin and add SRI to unpkg Phosphor and supabase-js (or self-host)
- [ ] T-07 Add `vercel.json` headers; CSP in Report-Only first
- [ ] T-02 Validate input types; move `context` out of the system prompt
- [ ] T-10 Raise minimum password to 8+; enable leaked-password protection
- [ ] T-11 Generic API error messages

## P2 · Soon
- [ ] T-08 Escape all `innerHTML` interpolations
- [ ] T-10 Add optional TOTP MFA in the Security tab
- [ ] T-07 Remove inline handlers/scripts, then enforce CSP (drop `unsafe-inline`)
- [ ] T-12 Add `.gitignore`, `package.json`, secret scanning
- [ ] T-13 Validate `avatar_url` host

## P3 · Later
- [ ] T-09 Server-side answer checking (only if scores matter)
- [ ] T-04 Server-controlled XP/progress sync
- [ ] Upgrade three.js (see `update_upgrade.md`)
- [ ] T-14 Re-test with two accounts, then re-audit

## Things to check in dashboards (no code)
- [ ] Supabase: no test or default accounts in Auth → Users
- [ ] Replace `account.html` on GitHub with the latest version and let Vercel redeploy
- [ ] Supabase: `service_role` key not used or exposed anywhere client-side
- [ ] Vercel: env vars set for Production only as needed; no secrets in `NEXT_PUBLIC_`-style public vars
- [ ] Supabase: confirm Site URL and Redirect URLs list only your real domains

## Done
- [x] Account page JS/CSS fixes (login, signup, logout, name, password, avatar, mobile layout)
- [x] Profile auto-create fallback in `account.html`
- [x] `fix-profiles.sql` written (waiting to be run)
- [x] Security audit v1 and docs

## Favicon (optional polish)
- [ ] Upload `favicon-32.png` and `favicon-192.png`; point all pages at them instead of the 1.2 MB `favicon.png`
