# CHEMORA One-Shot Upgrade Bundle

This bundle consolidates the previous challenge stability, 100-level question set, shared-site polish, learning dashboard, and the additions below.

## Included in this package
- 100 challenge JSON files (1,000 question records) and the existing challenge resilience fixes.
- Browser-local learning dashboard with completed levels, XP, answers, accuracy, topic estimates, recommendations, and recent results.
- Progressive Web App manifest, 192/512 app icons, and a service worker for repeat/offline access to public learning pages and cached static content.
- Service-worker exclusions for `/account.html` and `/api/*`; authentication screens and AI responses are not cached.
- AI endpoint hardening: bounded inputs, static tutor instructions, page context treated as untrusted user data, timeout, generic provider errors, `no-store`, and best-effort per-instance throttling.
- Additional Vercel security headers and a built-in Node validation script.
- Navigation links to Learning Progress where an existing main navigation was detected.

## Run checks
```bash
npm run validate:project
npm run test:smoke
node --check app.js
node --check progress.js
node --check api/assistant.js
```

## Important production steps that cannot be completed from this ZIP
- Set `OPENROUTER_API_KEY`, `OPENROUTER_MODEL` (optional), and `SITE_URL` in Vercel Project Settings. Never place API secrets in browser files.
- Configure Vercel Firewall rate limiting and provider spending limits. In-memory throttling is only best-effort across serverless instances.
- Review Supabase Auth, Row Level Security, storage policies, allowed redirect URLs, and run the existing profile SQL only after reviewing it against your actual schema.
- Confirm the canonical production domain before changing metadata and redirect URLs.
- Run real browser/mobile/accessibility tests and deploy a preview before production.

## Limits
- Learning data is stored locally and does not sync between devices.
- Topic strengths are estimates based on level results and the topics represented in those levels, not per-question analytics.
- The service worker caches a small public shell; first load and some sections still require network access.
- Automated schema checks do not fact-check chemistry claims. Review new or edited questions with a qualified chemistry educator.
- No Vercel or Supabase dashboard settings were changed, and deployment/browser testing was not performed by this packaging step.
