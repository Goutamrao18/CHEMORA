# Updates and Upgrades

## 1. Libraries

| Item | Current | Action | Notes |
|---|---|---|---|
| `@supabase/supabase-js` | `@2` (floating) via jsdelivr | Pin to an exact `2.x.y` and add SRI | Floating tags can change under you. Check the current version on npm. |
| `@phosphor-icons/web` | unpkg, unpinned, no SRI | Pin and self-host (preferred) | It injects more files at runtime, so SRI alone is awkward. |
| Font Awesome | 6.4.0 via cdnjs | Add SRI (cdnjs shows the hash) or update to latest 6.x | Low risk, CSS only. |
| Google Fonts | `fonts.googleapis.com` | Optional: self-host | Removes a third-party request and simplifies CSP. |
| `favicon.png` | 1254×1254, 1.2 MB | Replace with `favicon-32.png` + `favicon-192.png` | Used as the tab icon on every page and as the default avatar. Large file slows first load. |

## 2. Project hygiene
- Add `package.json` (`name`, `"type": "module"`, `engines.node`) so Vercel and GitHub can track dependencies.
- Add `.gitignore` (`.env*`, `.vercel`, `node_modules`).
- Once `package.json` exists: run `npm audit` and enable **GitHub Dependabot** alerts and updates.
- Enable GitHub **secret scanning** and **push protection**.

## 3. Vercel
- Add `vercel.json` security headers (see `task.md` T-07).
- Turn on **Firewall → Rate Limiting** for `/api/*`.
- Check the project's Node.js version setting is a current supported LTS.
- Keep the OpenRouter key in Vercel env vars only. Rotate it if it was ever pasted anywhere public.

## 4. Supabase
- Enable RLS and policies (T-03) and storage limits (T-05).
- Auth: min password 8+, leaked-password protection, email confirmation on, optional TOTP MFA.
- Restrict **Site URL / Redirect URLs** to your real domains.
- Never use the `service_role` key in browser code.

## 5. AI endpoint
- Pin the model deliberately (`openrouter/free` can route to different models over time).
- Add a spend limit on the OpenRouter key.
- Remove the hardcoded, inconsistent `HTTP-Referer` values; use one `SITE_URL` env var.

## 6. Upgrade order (suggested)
1. Delete `reaction.js`, add rate limit and spend cap (same day).
2. RLS and storage policies.
3. Headers and CSP (Report-Only), pin/SRI scripts.
4. Auth hardening and MFA.
5. three.js upgrade.
6. Tighten CSP (remove `unsafe-inline`).

## 7. Pending deployment steps (from the latest fixes)
1. Supabase → SQL Editor → run `fix-profiles.sql`.
2. GitHub: replace `account.html` (and `account.css` if not already updated), commit, let Vercel redeploy.
4. Reload the account page and test: login, change name, upload avatar, change password.
5. Check Authentication → Policies → `profiles` has only the three own-row policies.
