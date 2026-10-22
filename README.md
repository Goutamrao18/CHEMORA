# 🧪 CHEMORA — Chemistry Learning Platform

> **TOUCH. MIX. REACT.**
> A modern React 19 + TypeScript web application for interactive chemistry education, practical experiments, progressive challenges, and laboratory simulation.

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
- **Session Protection:** Session in `httpOnly`, `Secure`, `SameSite=Strict` cookie with 30-minute idle expiration.
- **Rate-Limiting:** 5 failed login attempts per 15 minutes per IP and email.
- **Audit Trail:** Immutable records in `admin_audit_log` with client IP address, action type, and metadata for every administrative write.
- **Review Moderation:** Filter by pending/approved/rejected, keyboard shortcuts (`A` to approve, `R` to reject, `↑`/`↓` to navigate), bulk actions, and undo toast.
- **Video Content Health:** Automated server-side HEAD checks against Supabase storage URLs for 21 manifest video streams.
- **Operational AI Assistant:** Read-only intelligence querying live metrics, queue backlogs, and video health with zero PII and automated prompt sanitization.

### Creating the First Admin
1. Apply the migration:
   ```bash
   # Run in Supabase SQL Editor
   cat supabase/migrations/20261022000000_admin_hardening.sql
   ```
2. In the Supabase SQL Editor, insert your target user's UUID into `admin_users`:
   ```sql
   INSERT INTO public.admin_users (user_id, role)
   VALUES ('YOUR_USER_UUID_HERE', 'super_admin');
   ```

*(In local development environments without Supabase credentials configured, a built-in pre-seeded administrator `admin@chemora.edu` / `ChemoraAdmin2026!` is available for local testing.)*

### Running Admin Verification Tests
```bash
node scripts/test-admin.mjs
```


