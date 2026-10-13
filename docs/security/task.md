# Fix Tasks (detailed)

Each task has what, where, how and how to check it's done. Tick-boxes are in `todo.md`.

---
## T-01 · Delete the unused public endpoint — **High**
**Where:** `api/reaction.js` (nothing in the site calls it).
**Do:** delete the file and redeploy.
**Done when:** `POST /api/reaction` returns 404.

## T-02 · Lock down `/api/assistant` — **High**
**Where:** `api/assistant.js`
**Do (in order of value):**
1. **Rate limit.** Quickest: Vercel Dashboard → Firewall → Rate Limiting rule on path `/api/assistant`, for example 10 requests per minute per IP. Or in code with Upstash:
```js
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
const limiter = new Ratelimit({ redis: Redis.fromEnv(), limiter: Ratelimit.slidingWindow(10, "1 m") });

const ip = (req.headers["x-forwarded-for"] || "").split(",")[0].trim() || "anon";
const { success } = await limiter.limit(ip);
if (!success) return res.status(429).json({ error: "Too many requests. Try again shortly." });
```
2. **Validate input:** `typeof prompt === "string"`, keep the 4000-character cap, reject otherwise with 400.
3. **Optional but best: require login.** Send the Supabase access token from the browser (`Authorization: Bearer <token>`) and verify it server-side:
```js
const token = (req.headers.authorization || "").replace("Bearer ", "");
const u = await fetch(`${process.env.SUPABASE_URL}/auth/v1/user`, {
  headers: { Authorization: `Bearer ${token}`, apikey: process.env.SUPABASE_ANON_KEY }
});
if (!u.ok) return res.status(401).json({ error: "Login required" });
```
4. **Set a spend limit** on the OpenRouter key (OpenRouter dashboard) so abuse is capped even if code fails.
5. **Prompt injection:** stop concatenating `context` into the system prompt. Put it in the user message, for example `Page: ${context}\n\nQuestion: ${prompt}`.
**Done when:** 11 rapid requests from one IP get a 429, and non-strings get a 400.

## T-03 · Verify and enable RLS on `profiles` — **High (verify)**
**Status:** ready to run. Everything below is already combined in `fix-profiles.sql` (also adds the unique index on `user_id`, column defaults and a backfill for existing users). Use that file instead of copying from here.
**Where:** Supabase Dashboard → Table Editor → `profiles` → RLS must show **enabled**.
**Template (adapt names to your schema):**
```sql
alter table public.profiles enable row level security;

create policy "profiles_select_own" on public.profiles
  for select to authenticated using (auth.uid() = user_id);

create policy "profiles_update_own" on public.profiles
  for update to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Users may only edit these columns; score columns stay server-controlled
revoke update on public.profiles from authenticated;
grant update (full_name, avatar_url) on public.profiles to authenticated;

-- Create the profile row automatically on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (user_id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', 'New Researcher'));
  return new;
end; $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
```
**Done when:** with user A's session, `select` on user B's row returns nothing, and `update({xp_earned: 999999})` is rejected.

## T-04 · Make XP / levels / streak server-controlled — **Medium**
**Why:** today they can be edited in `localStorage`, and (if RLS is loose) in the database.
**Do:** when you start syncing progress, write it through a Postgres function or an API route that checks the answer on the server, and keep the answers out of public JSON. Until then, treat all scores as cosmetic.
**Done when:** a user cannot raise their own `xp_earned` from the browser console.

## T-05 · Enforce avatar rules on the server — **Medium**
**Where:** Supabase → Storage → `avatars` bucket.
```sql
update storage.buckets
set file_size_limit = 2097152,
    allowed_mime_types = array['image/png','image/jpeg','image/webp']
where id = 'avatars';

create policy "avatars_insert_own" on storage.objects for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "avatars_update_own" on storage.objects for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "avatars_delete_own" on storage.objects for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
```
Keep SVG and HTML out of the allowed types.
**Done when:** uploading a 5 MB file or a `.html` file with a direct API call is rejected, and writing to another user's folder fails.

## T-06 · Pin third-party scripts and add integrity — **Medium**
**Do:** pin an exact version and add SRI, or self-host the files.
```bash
curl -s https://cdn.jsdelivr.net/npm/@supabase/supabase-js@<EXACT_VERSION>/dist/umd/supabase.js | openssl dgst -sha384 -binary | openssl base64 -A
```
```html
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@<EXACT_VERSION>/dist/umd/supabase.js"
        integrity="sha384-<HASH>" crossorigin="anonymous"></script>
```
Font Awesome on cdnjs publishes its SRI hash on the cdnjs page. Self-hosting Phosphor is simplest, since its script injects further files at runtime.
**Done when:** no `<script src="https://...">` remains without a pinned version and `integrity`.

## T-07 · Add security headers and a CSP — **Medium**
**Do:** create `vercel.json`:
```json
{
  "headers": [{
    "source": "/(.*)",
    "headers": [
      { "key": "X-Content-Type-Options", "value": "nosniff" },
      { "key": "X-Frame-Options", "value": "DENY" },
      { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" },
      { "key": "Permissions-Policy", "value": "camera=(), microphone=(), geolocation=()" },
      { "key": "Content-Security-Policy-Report-Only", "value": "default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://unpkg.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdnjs.cloudflare.com https://unpkg.com; font-src 'self' https://fonts.gstatic.com https://cdnjs.cloudflare.com https://unpkg.com; img-src 'self' data: https://*.supabase.co; media-src 'self'; connect-src 'self' https://*.supabase.co; frame-ancestors 'none'; base-uri 'self'; form-action 'self'" }
    ]
  }]
}
```
Start with **Report-Only**, load every page, and fix what the console reports. Then rename the key to `Content-Security-Policy`. Later, remove `'unsafe-inline'` by moving inline scripts to files and replacing the inline `onclick` in `experiments.js:14`.
**Done when:** securityheaders.com gives B or better and no CSP violations remain in normal use.

## T-08 · Escape data before `innerHTML` — **Low**
**Where:** `experiments.js:14,18`, `challenge.html:160,195,209,214`, `make.js:396-398`, `know.html:323`.
**Do:** reuse the `escapeHTML` helper you already have in `experiments.js` (and `esc()` in `library.js`) on every interpolated value, or build nodes with `textContent`. In `know.html:323`, set `strong.textContent = formula` instead of concatenating HTML.
**Done when:** a quick test with `<img src=x onerror=alert(1)>` in each data source shows plain text.

## T-09 · Stop shipping quiz answers in public JSON — **Low**
Only matters if scores will ever count for something. Then move answer checking to an API route or database function.

## T-10 · Auth hardening in Supabase — **Medium**
- Dashboard → Authentication → Policies: minimum length **8+**, require mixed characters, enable **leaked password protection** (plan-dependent).
- Keep **email confirmation on**. Review Auth → Rate Limits and do not raise them.
- Add **TOTP MFA**: `supabase.auth.mfa.enroll({ factorType: 'totp' })`, `challenge`, `verify`. Put the enroll UI in the Security tab. Offer it as optional first.
- Update the client check in `account.html` from 6 to 8 characters to match.

## T-11 · Stop leaking internals in error messages — **Low**
**Where:** both `api/*.js`.
**Do:** return generic messages (`"AI service unavailable"`) and keep details in server logs. Remove env var names (`OPENROUTER_API_KEY is missing in Vercel`) and raw upstream bodies (`errText`).

## T-12 · Repo hygiene — **Low**
Add `.gitignore` with `.env*`, `.vercel`, `node_modules`. Turn on GitHub secret scanning and push protection. Add a minimal `package.json` so dependency alerts work.

## T-13 · Validate `avatar_url` before using it — **Low**
In `account.html`, only assign `img.src` if the URL starts with your Supabase storage origin; otherwise use `favicon.png`.

## T-14 · Re-test after fixes
Re-run this audit, and from two different accounts try: reading the other user's profile, editing the other user's avatar path, raising your own XP, and hammering `/api/assistant`.

---
## T-15 · Profile rows missing after signup — **Done in code, SQL pending**
**Symptom:** "Failed to save avatar: no profile row found for this account"; `profiles` had 0 records.
**Fix:** run `fix-profiles.sql` (backfill + signup trigger). `account.html` also inserts `{user_id, full_name}` if the row is missing, which needs the insert policy from the same file.
**Done when:** the table shows a row for your account, and a brand-new test signup gets a row automatically.

## T-16 · Favicon on all pages — **Low (not security)**
