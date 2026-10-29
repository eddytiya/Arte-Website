# Arte Industries — Website (v1)

One-page marketing and enquiry site for **arteind.com**.
Stack: React 19 · TypeScript · Vite · Tailwind CSS v4 · Lucide icons · self-hosted Manrope font.
Optional serverless enquiry endpoint: `api/enquiry.ts` (Vercel Function → email via Resend).
Admin panel: **Sveltia CMS** at `/admin` — edits the JSON files in `content/` and uploads images via GitHub; Vercel rebuilds the site on every save. Staff instructions: **ADMIN-GUIDE.md**.

---

## 1. Run locally

Requirements: Node.js 20+ and npm.

```bash
npm install
cp .env.example .env.local     # optional, see section 4
npm run dev                    # http://localhost:5173
npm run build                  # type-checks site + API, outputs /dist
npm run preview                # serves /dist at http://localhost:4173
```

## 2. Project structure

```
arte-website/
├─ content/                    ← ALL editable website content (edited through /admin)
│  ├─ settings.json            Company details, contact info, SEO title/description, workshop photo
│  ├─ products/*.json          One file per product
│  └─ sections/*.json          Text for hero, about, products, services, industries, why, contact
├─ public/
│  ├─ admin/                   Admin panel: index.html, config.yml (fields & labels), pinned Sveltia CMS script
│  ├─ images/products/*.webp   Product images extracted from the brochure
│  ├─ images/uploads/          Images uploaded through the admin panel
│  ├─ brand/logo-*.svg         Original logo (vector)
│  ├─ privacy-policy.html, terms.html   DRAFT legal pages
│  └─ favicon.svg, og-image.png, robots.txt, sitemap.xml
├─ src/
│  ├─ content.ts               Loads /content with safe fallbacks (a blank field never breaks the page)
│  ├─ components/              Header, Hero, CapabilityStrip, About, Products, Services, Industries, WhyArte, Contact, Footer
│  ├─ lib/enquiry.ts           Form validation and submission
│  └─ lib/analytics.ts         GA4 placeholder
├─ api/enquiry.ts              Serverless enquiry handler
├─ ADMIN-GUIDE.md              Plain-language guide for admin users
├─ index.html                  SEO tags are filled from content/settings.json at build time (vite.config.ts)
└─ vercel.json, .env.example
```

## 3. Editing content

**Normally: use the admin panel** at `https://www.arteind.com/admin`. See **ADMIN-GUIDE.md** for setup (GitHub accounts + access tokens) and day-to-day use. Each Save commits to GitHub; Vercel rebuilds and publishes in ~1–2 minutes.

How it works:
- The admin panel is Sveltia CMS v0.235.1, self-hosted at `public/admin/sveltia-cms-0.235.1.js` (pinned on purpose; upgrade deliberately).
- It has no database or server. It reads and writes the JSON files in `content/` and stores uploads in `public/images/uploads/` via the GitHub API, using the admin's own GitHub permissions.
- Uploaded photos are converted to WebP and capped at 1600 px automatically.
- Every change is a Git commit, so any edit can be undone from GitHub's history.
- **Before first use**, set `backend.repo` in `public/admin/config.yml` to `<github-owner>/arte-website`.

Adding a new editable field: add it to `public/admin/config.yml`, then read it in `src/content.ts` and use it in a component.
Enquiry dropdown options are fixed in three places that must match: `src/content.ts`, `public/admin/config.yml` (`&enquiryOptions`) and `api/enquiry.ts`.

Optional upgrade: a "Sign in with GitHub" button instead of access tokens needs a GitHub OAuth app plus the free Sveltia CMS Authenticator on Cloudflare Workers (https://github.com/sveltia/sveltia-cms-auth). Then set `backend.base_url` in config.yml.

## 4. Connecting the enquiry form

The form never shows a success message unless the endpoint returns HTTP 2xx. With no endpoint configured it tells the visitor that online enquiries aren't connected and offers a pre-filled email link and phone number instead.

### Option A (recommended): bundled Vercel function + Resend
1. Create a free account at resend.com, add and verify the domain `arteind.com` (adds DNS records).
2. In the Vercel project → Settings → Environment Variables, set:
   - `RESEND_API_KEY` — from Resend
   - `ENQUIRY_TO_EMAIL` — inbox that receives enquiries (comma-separate several)
   - `ENQUIRY_FROM_EMAIL` — e.g. `Arte Website <website@arteind.com>`
   - `VITE_ENQUIRY_ENDPOINT` — `/api/enquiry`
3. Redeploy, then **submit a real test enquiry with a PDF and a JPG attached** and confirm the email and attachments arrive.

What the function does: re-validates all fields, drops bots (hidden honeypot field + submissions faster than 2.5 s), checks attachments by extension *and* file signature (PDF/JPG/PNG/WebP only, max 3 files, 10 MB total), HTML-escapes everything in the email, sets reply-to to the customer. Files are held in memory and emailed — never written to storage, so there is no public URL.

**Not yet done / recommended before heavy traffic:** rate limiting and a CAPTCHA (Cloudflare Turnstile is free) — the honeypot stops simple bots only.

### Option B: other hosts or a CRM
`VITE_ENQUIRY_ENDPOINT` can point at any endpoint that accepts `multipart/form-data` and returns 2xx on success (Netlify Function, a CRM webhook, Formspree, etc.). Field names: `fullName, company, email, phone, country, product, quantity, details, deliveryLocation, deliveryDate, consent, files[]` plus `website` (honeypot, must be empty) and `elapsedMs`. Note that third-party form services store uploaded files on their servers — check that's acceptable for confidential drawings.

## 5. Deploy and connect the domain (Vercel)

1. Push this folder to a GitHub repository.
2. vercel.com → Add New Project → import the repo. Framework is detected as Vite; build `npm run build`, output `dist` (already in `vercel.json`).
3. Set environment variables (section 4), deploy, check the `*.vercel.app` URL.
4. Project → Settings → Domains → add `arteind.com` and `www.arteind.com`. Vercel shows the DNS records; add them at the current domain registrar (typically an `A` record for the apex and a `CNAME` for `www`). Make `www.arteind.com` primary to match the canonical URL.
5. **Before switching DNS:** check whether `arteind.com` currently hosts email (MX records). Only change the A/CNAME records — leave MX records untouched or email will break.

Any static host works for the site itself (Netlify, Cloudflare Pages, shared hosting via the `dist` folder); only the form endpoint is host-specific.

## 6. Placeholders and items to verify before launch

| Item | Where | Status |
|---|---|---|
| Mobile `+91 99690 07666`, landline `022-2494 4333`, email `tanmay@arteind.com`, Lower Parel address | Admin → Company details (and legal pages) | From brochure — **confirm still current** |
| GitHub repo name in admin config | `public/admin/config.yml` → `backend.repo` | **Must be set** before /admin works |
| Public email address | Admin → Company details | Consider `sales@` / `info@` instead of a personal inbox |
| WhatsApp number | Admin → Company details | Empty (hidden) — brochure doesn't say which number is on WhatsApp |
| LinkedIn URL | Admin → Company details | Empty (hidden) |
| Manufactured vs sourced per product | Admin → Products → "How is it supplied?" | Inferred from brochure cover — **confirm with Arte** |
| Product images | `public/images/products` | From brochure — confirm Arte owns rights to these images (some look like catalogue/stock renders) |
| Workshop photo | Admin → Company details | Not supplied |
| Industry photos | Admin → Industries section | Not supplied — line illustrations used |
| Privacy Policy / Terms | `public/*.html` | Drafts — need review; fill in date, providers, retention |
| Analytics | `VITE_GA_ID` | Off until set; add consent banner if targeting EU/UK |
| OG share image | `public/og-image.png` | Generated; replace if a better brand visual exists |

## 7. Testing checklist

Automated checks run on this build (Playwright, Chromium):
- [x] `npm run build` passes TypeScript checks for site and API
- [x] All nav anchors exist; one `<h1>`; every image has `alt`
- [x] No console errors, no failed requests, no broken visible images
- [x] Product card → details dialog → Esc closes → "Enquire" pre-selects product, pre-fills details, moves focus to form
- [x] Service and full-range enquiry buttons pre-select the right option
- [x] Empty submit flags all 8 required fields and focuses the first
- [x] `.exe` upload rejected; PDF accepted and listed
- [x] No endpoint → honest "not connected" message + mailto fallback (no fake success)
- [x] Mocked endpoint 500 → error shown; 200 → success shown; request is multipart with attachment
- [x] API handler unit-tested with mocked Resend: valid+PDF emails; disguised file rejected; honeypot/too-fast silently dropped; bad fields 422; missing config 503
- [x] Mobile 390 px and tablet 820 px: no horizontal scroll; hamburger menu opens, sets `aria-expanded`, closes on navigation
- [x] Admin config validated against the Sveltia CMS JSON schema; every field matches the content files
- [x] Admin panel driven in a browser against a simulated local repository: lists 15 products and 8 page sections; edited the email and saved; created a product (blocked until a photo was added); uploaded a 490 KB 3000 px JPG, stored as a 62 KB WebP in `public/images/uploads/`; deleted a product
- [x] Admin-made changes (new product, changed email, emptied landline) appear correctly on the built site and in the SEO JSON-LD

Still to do manually:
- [ ] Real end-to-end email test with live Resend credentials
- [ ] Admin login with a real GitHub token against the real repository, then one test edit going live via Vercel
- [ ] Safari (iOS) and Firefox spot-check
- [ ] Lighthouse run on the deployed URL
- [ ] Screen-reader pass (VoiceOver/NVDA) on the form
- [ ] Re-check every contact detail with the company

## 8. Recommendations for v2

1. **Individual product pages** (`/products/worm-reduction-gearboxes` etc.) — the biggest SEO lever; each targets one search phrase. Add React Router or move to Astro for static per-page HTML.
2. **Real photography** of the workshop, machines and finished parts — this is the main credibility gap against the mockup.
3. **Spec ranges** — the brochure publishes "1 5/8″ to 14″ centre distance, ratio 5:1 to 70:1" for worm gearboxes. Not shown on the site per the confidentiality brief; add if Arte approves, as buyers search for this.
4. Cloudflare Turnstile + rate limiting on the form.
5. Google Business Profile for the Lower Parel address, linked from the site.
6. Export/international page once that business line is active.
