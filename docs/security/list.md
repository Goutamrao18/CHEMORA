# Checklist Results (20 items)

Legend: ✅ no issue / N/A  ·  ⚠️ VERIFY (depends on Supabase/Vercel settings)  ·  ❌ finding

| # | Check | Result | Severity | Evidence / notes |
|---|---|---|---|---|
| 1 | SQL injection | ✅ | n/a | No raw SQL anywhere. Database access is through `supabase-js` (PostgREST), which parameterizes queries. If you add `rpc()` functions later, avoid string-built SQL inside them. |
| 3 | CSRF | ✅ | Low | No cookie-based sessions. Supabase sends the JWT in a header, and `/api/*` takes JSON with no ambient credentials. No state-changing endpoint relies on cookies. |
| 4 | Insecure file uploads | ❌ / ⚠️ | **Medium** | Avatar upload (`account.html`) checks size (2 MB) and MIME only in the browser. `file.type` is user-controlled, and direct calls to the Storage API skip the checks. Needs bucket-level limits and per-user storage policies. See T-05. |
| 5 | IDOR / broken object-level auth | ⚠️ | **High if RLS is off** (status: SQL ready, not yet run) | Code selects and updates with `.eq('user_id', session.user.id)`. That filter is client-side and an attacker can drop it. Only RLS stops reading or editing other users' rows. Also, the avatar path `{uid}/avatar` is only safe with a storage policy. See T-03, T-05. |
| 6 | Missing rate limiting | ❌ | **High** | `/api/assistant` and `/api/reaction` are public with no per-IP limit. `reaction.js` has no input length cap. Supabase Auth has built-in limits (check they are not raised). See T-01, T-02. |
| 7 | Insecure JWT secrets | ✅ | n/a | No JWT signing in your code. Supabase manages the secret. Nothing hardcoded. Never expose the JWT secret or `service_role` key. |
| 8 | Exposed API secrets | ✅ | n/a | OpenRouter key is read from `process.env` only. The Supabase *publishable* key in `account.html` is public by design. Searches for `service_role`, `sk-`, bearer tokens and `.env` found nothing. No `.gitignore` exists (T-12). |
| 9 | Weak password hashing | ✅ | n/a | Passwords go to Supabase Auth only (bcrypt). Nothing stored or hashed in your code. |
| 10 | Missing MFA | ❌ | Medium | Not implemented. Supabase supports TOTP MFA. See T-10. |
| 11 | Overly permissive CORS | ✅ | n/a | No `Access-Control-*` headers set, so browsers allow same-origin only. No `vercel.json` adding `*`. Do not add `*` later. |
| 12 | Auth tokens in localStorage | ❌ | Medium | `supabase-js` defaults to storing the session (access and refresh token) in `localStorage`. Any XSS can steal it. Mitigate with CSP and the XSS fixes (T-07, T-08). Full fix needs cookie-based sessions via a server. |
| 13 | Client-side-only permission enforcement | ❌ | Low (Medium if XP syncs) | Quiz answers are in public JSON (`challenge/data/level-*.json`). Progress, XP and unlocks live in `localStorage` and can be edited. The profile has `xp_earned`, `levels_cleared`, `daily_streak` columns. If RLS lets users update them, they can award themselves points. See T-04, T-09. |
| 14 | Missing row-level security | ⚠️ | **High if off** | A Supabase screenshot shows `profiles` has **1 RLS policy** (contents unknown) and **0 rows**. Storage policies not seen. `fix-profiles.sql` sets own-row policies and column grants. Run it, then check Authentication → Policies and delete any "allow all" policy. |
| 15 | Unverified webhook signatures | ✅ | n/a | No webhooks in the codebase. |
| 16 | SSRF | ✅ | n/a | The only server-side `fetch` targets are the fixed `https://openrouter.ai/...` URL. No user-supplied URLs. |
| 17 | Exposed source maps | ✅ | n/a | No `.map` files, no `sourceMappingURL` comments. |
| 18 | Default credentials | ✅ | n/a | None found. Check that no test accounts exist in Supabase Auth. |
| 19 | Sensitive data in logs | ✅ (minor) | Low | Only `console.error(e)` (`api/assistant.js:28`) and `console.error(error.message)` in `account.html`. No passwords, tokens or emails logged. Related: both APIs return raw upstream errors and env-var names to the client (T-11). |
| 20 | Vulnerable dependencies | ⚠️ | Low–Medium | No `package.json` or lockfile, so nothing can be audited automatically. Vendored `three.min.js` is **r128 (2021)**. `unpkg.com/@phosphor-icons/web` and `supabase-js@2` are unpinned with no SRI (supply-chain risk). See T-06, `update_upgrade.md`. |

## Extra findings (not in your list)
| Finding | Severity | Notes |
|---|---|---|
| No Content-Security-Policy, X-Frame-Options, X-Content-Type-Options or Referrer-Policy | Medium | No `vercel.json`, no `<meta>` CSP. Site can be framed (clickjacking). T-07. |
| Prompt injection: client-supplied `context` is placed in the **system** prompt (`api/assistant.js`) | Low | Capped at 1200 chars but still user-controlled. Move it into the user message or drop it. T-02. |
| `api/reaction.js` is unused by the site yet publicly deployed | Medium | Delete it. T-01. |
| `profiles.avatar_url` is trusted and assigned to `img.src` | Low | Validate it points to your Supabase storage host. T-13. |
| Inline `onclick="openExp('...')"` in `experiments.js:14` | Low | Blocks a strict CSP. Use `addEventListener`. T-07. |
| Password minimum is 6 characters | Low | Raise to 8+ and enable leaked-password protection in Supabase. T-10. |

## Update 2026-10-08 (after the audit)
- Live-site test: login works and the dashboard loads, so the Supabase URL and key are correct.
- Found in testing: no profile row was created at signup, so name and avatar saves failed. This is a functional bug, not a vulnerability, but it forced the RLS rewrite in `fix-profiles.sql`.
- Items 5 and 14 stay ⚠️ until the SQL is run and the two-account test in T-14 is done.
- No other results changed.
