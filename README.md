# 🧪 Chemora lab — Chemistry Learning Platform

> **TOUCH. MIX. REACT.**
> An interactive chemistry education platform and virtual laboratory created through AI coding (vibe coding: Gemini, Claude, ChatGPT).
>
> **Company:** Chemora lab  
> **Owner:** Goutam  
> **Government Jurisdiction:** Government of India (india govt)  
> **Contact Email:** chemora_lab@agentmail.to  
> **Deployment:** Vercel  
> **Database:** Supabase (PostgreSQL with Row Level Security)  
> **Extra RAM & In-Memory Cache:** Upstash (Serverless Redis)  

---

## ✨ Features

- **🏛 Home Showcase:** Hero interactive video banner, platform walkthrough, FAQs, and feedback.
- **📚 Know Library:** 134 verified items covering laboratory apparatus, glassware, chemicals, indicators, hazard ratings, and formulas.
- **🏆 Challenge Arena:** 100 progressive levels with 1,000 curriculum-aligned multiple choice questions, timer, streaks, and milestone XP rewards.
- **🔬 20 Guided Practicals:** Step-by-step experiment protocols with demonstration videos, checklists, balanced chemical equations, and safety protocols.
- **📊 Learning Dashboard (Progress):** Analytics tracking completed levels, overall accuracy, discipline strengths (Organic, Inorganic, Physical, Analytical), and recent score history.
- **⚗️ Virtual Chemistry Lab:** Reaction workbench with reagent dispensing, Bunsen burner thermal controls, precipitation animations, effervescence, and atomic flame spectroscopy.
- **👤 Researcher Account:** Customizable researcher identity, rank milestones, audio feedback settings, high-contrast display options, and persistent progress.
- **✦ CHEMORA AI Tutor:** Context-aware interactive chemistry assistant for instant question answering, equation balancing, and safety guidance.

---

## 🚀 Development & Build

Requires **Node.js 22+** and **npm**.

```bash
# Start development server on port 3000
npm run dev

# Compile TypeScript and build production bundle
npm run build

# Preview production build locally
npm run preview
```

---

---

## 🔐 Phase 4 — Secure Admin Enclave (`/admin`)

An administrative command center modeled after an AI dashboard with floating navigation rail, soft cards, real-time telemetry, and operational AI assistant.

### Features
- **Stealth Security:** Unauthenticated or unauthorized requests to `/api/admin/*` return **HTTP 404** (stealth mode, invisible to unauthorized actors).
- **Mandatory Email OTP (2FA):** Password verification alone NEVER creates a session. Every admin login requires a single-use 6-digit email verification code delivered via the AgentMail REST API.
- **Fail-Closed Design:** Server refuses to start or process logins if `ADMIN_SESSION_SECRET` is missing or under 32 characters, or if AgentMail email delivery is unconfigured in production.
- **Session Protection:** Signed `chemora_admin_session` cookie (`httpOnly`, `Secure`, `SameSite=Strict`) with 30-minute idle sliding expiration and an 8-hour absolute lifetime ceiling.
- **Rate-Limiting & Lockouts:** 5 failed login attempts per 15 minutes per IP/email. 5 failed OTP attempts permanently lock the challenge (`otp_locked`, HTTP 429). 60-second cooldown and 5 sends/hour limit on OTP resends.
- **Audit Trail:** Immutable records in `admin_audit_log` with client IP address, action type (`OTP_SENT`, `OTP_FAILED`, `OTP_LOCKED`, `OTP_VERIFIED`, `LOGIN_SUCCESS`), and metadata. Codes are NEVER logged or returned in responses.
- **Review Moderation:** Filter by pending/approved/rejected, keyboard shortcuts (`A` to approve, `R` to reject, `↑`/`↓` to navigate), bulk actions, and undo toast.
- **Video Content Health:** Automated server-side HEAD checks against Supabase storage URLs for 21 manifest video streams.
- **Operational AI Assistant:** Read-only intelligence querying live metrics, queue backlogs, and video health with zero PII and automated prompt sanitization.

### Creating the First Admin
1. Apply the database migrations in Supabase SQL Editor:
   ```bash
   cat supabase/migrations/20261022000000_admin_hardening.sql
   cat supabase/migrations/20261022030000_admin_otp_challenges.sql
   ```
2. Insert your authenticated user's UUID into `admin_users`:
   ```sql
   INSERT INTO public.admin_users (user_id, role)
   VALUES ('<YOUR_USER_UUID_FROM_AUTH_USERS>', 'super_admin');
   ```

### Admin Security & Session Architecture
- **No Hardcoded Credentials:** There are zero default or fallback credentials in the source code.
- **Local Dev Fallback:** Allowed ONLY when `NODE_ENV=development`, `ALLOW_DEV_ADMIN=true`, and `DEV_ADMIN_PASSWORD` is explicitly set via environment variables. In production (`NODE_ENV=production`), dev fallback is strictly impossible.
- **Stateless Sessions:** Sessions are signed using HMAC-SHA256 (`ADMIN_SESSION_SECRET`) in an `httpOnly`, `Secure`, `SameSite=Strict` cookie, re-verified against `admin_users` on every request. Re-issues cookie on activity with a rolling 30-minute idle sliding expiration and 8-hour maximum lifetime limit. Global logout (`/logout-all`) revokes older tokens via `sessions_valid_after`.
- **Mandatory Email OTP Delivery:** Uses AgentMail REST API (`POST {AGENTMAIL_API_BASE}/inboxes/{AGENTMAIL_INBOX_ID}/messages/send`) without third-party email SDKs. Codes are generated via `crypto.randomInt` and stored exclusively as HMAC-SHA256 hashes (`code_hash = HMAC-SHA256(ADMIN_SESSION_SECRET + ':otp_challenge', challengeId + ':' + code)`).
- **Required Production Environment Variables:**
  - `ADMIN_SESSION_SECRET`: Random string of at least 32 characters for HMAC token signing.
  - `AGENTMAIL_API_KEY`: API key from AgentMail for transactional email dispatch.
  - `AGENTMAIL_INBOX_ID`: Full inbox address configured in AgentMail (e.g. `chemora_lab@agentmail.to`).
  - `AGENTMAIL_API_BASE` *(optional)*: Base API URL (defaults to `https://api.agentmail.to`; use `https://api.agentmail.eu` for EU region).
- **Distributed Rate Limiting:** 5 failed attempts per 15 minutes per IP and email tracked via Upstash Redis (or in-memory sliding window fallback).

### Clearing an Admin Lockout
If an administrator account or IP is temporarily locked out after 5 failed attempts:
```bash
# Clear by email
node scripts/clear-admin-lockout.mjs --email=myadmin@domain.com

# Clear by IP address
node scripts/clear-admin-lockout.mjs --ip=127.0.0.1

# Clear all active lockouts
node scripts/clear-admin-lockout.mjs --all
```
*(In local development without Redis, restarting the dev server also resets the in-memory counter immediately).*

### Running Admin Verification Tests
```bash
node scripts/test-admin.mjs
```

---

## 🖼️ Avatar Storage (`avatars` Bucket)

Profile pictures are hosted in a public Supabase Storage bucket named `avatars`.

### Storage Architecture & Security
- **Bucket Configuration:** Public read bucket restricted to image formats (`image/jpeg`, `image/png`, `image/webp`) with a 5 MB raw file size limit.
- **Folder Isolation (RLS):** Authenticated researchers can only upload, update, and delete objects within their own designated folder: `<user_id>/avatar`. Cross-user folder access is strictly blocked at the database level.
- **Client Processing:** The web application provides circular crop preview with zoom/pan and renders a 512×512 square WebP image at 0.85 quality using an HTML5 Canvas, automatically stripping EXIF and GPS location metadata for privacy.
- **Server Validation:** The backend API (`server/routes/account.ts`) strictly verifies that `avatar_url` starts with the user's own storage folder (`/storage/v1/object/public/avatars/<user_id>/`), is one of the preset lab emblems, or originates from a verified Google account photo.

### SQL Migration
To provision the `avatars` bucket and configure the Row Level Security (RLS) policies in Supabase, execute:
```sql
-- Run in Supabase SQL Editor:
-- supabase/migrations/20261022010000_avatar_storage.sql
```

### Running Avatar Storage Verification Tests
```bash
npm run test:avatar
```



