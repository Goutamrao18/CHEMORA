# CHEMORA launch checklist status

This package applies the website-side items from the supplied launch checklist. The checklist recommends search discoverability, share previews, image alt text, forms/privacy, HTTPS, FAQ and real reviews. CHEMORA uses Supabase for authentication and database-backed features and does not require a Google account.

## Applied in code
- Custom `404.html` for missing pages. Vercel should serve it with HTTP 404.
- Unique page titles and meta descriptions.
- Canonical, Open Graph and Twitter card metadata.
- 1200×630 `assets/chemora-share.png`.
- Existing meaningful image alt text reviewed; decorative logo instances use empty alt where appropriate.
- `sitemap.xml` and `robots.txt`; API and challenge JSON are excluded from crawling.
- Internal navigation is already present across the main public pages.
- FAQ section added to the homepage without FAQ schema.
- Reviews area has a styled email-based feedback invitation. No testimonials or ratings are fabricated; publish real reviews only after permission is confirmed.
- `privacy.html` based on the current codebase; it is explicitly a template to review.
- Google Analytics removed; CHEMORA does **not** require a Google Analytics account or Measurement ID.
- Vercel security headers added. Vercel normally provides HTTPS and HTTP→HTTPS redirects automatically.

## Requires your action / dashboard verification
1. Confirm the production domain. The current source documentation points to `https://project-draft-three.vercel.app`; replace it everywhere if your real domain is different.
2. Submit the sitemap to any search-engine webmaster tools you choose; this is optional and does not require Google.
3. Verify Vercel HTTPS/redirect behavior and check for mixed-content warnings.
4. Review Supabase Auth, Row Level Security, storage policies and redirect URLs.
5. The site's forms are account/profile/security forms backed by Supabase, not public lead/contact forms. The checklist's server-side honeypot/rate-limit pattern does not map directly to Supabase Auth.
6. Add received, genuine reviews only when you have explicit permission to publish them. The current review CTA opens an email draft; it does not store reviews in a database.

## Important
The privacy page is a template, not legal advice. Check it against the final deployed services, cookies, Supabase configuration and applicable law before launch.
