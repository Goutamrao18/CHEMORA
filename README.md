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

## 📹 Video Storage & Updates

Demonstration videos and posters are served directly from Supabase Storage CDN. To upload or replace video files:

1. Place compressed `.mp4`, `.webm`, and `.webp` files in `./videos-compressed/`.
2. Run `npm run upload:videos` with `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` set.
3. **Note:** After replacing a video, hard refresh (`Ctrl+F5` / `Cmd+Shift+R`) in your browser to clear the CDN edge cache and see the updated video.

