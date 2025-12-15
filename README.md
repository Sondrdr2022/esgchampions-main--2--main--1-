# STIF ESG Champions Platform

Democratising sustainability for every business. This repository hosts the front‑end for the STIF ESG Champions platform — a static website powered by Supabase for authentication, database, and real‑time data.

- Live site: https://esgchampions-main-2-main-1-ydmk.vercel.app
- Tech: HTML/CSS/JS (no framework), Supabase (Auth + Postgres), Vercel (hosting)

## Table of Contents

1. Features
2. Architecture
3. Getting Started
4. Supabase Setup
5. Database Schema & SQL Scripts
6. Environment Configuration
7. Running Locally
8. Deploying
9. Key Pages & Flows
10. Admin Tools
11. Troubleshooting
12. Contributing, Legal & Policies
13. Project Structure
14. License

---

## 1) Features

- ESG Champions user workflow:
  - Registration & login (email/password with confirmation)
  - LinkedIn login via OpenID Connect (optional)
  - Dashboard with STIF Score, missions, activity, and panel quick‑start
  - “Continue where you left off” progress resume
- Panels & Indicators:
  - Browse ESG panels and indicators
  - Select indicators to review
  - Submit “validation” reviews (necessary?, rating, comments)
  - Gamified credits/points model
- Community Rankings:
  - 30‑day and weekly leaderboards based on accepted reviews and activity
- Admin Review:
  - Moderation queue to accept/delete reviews
  - One‑click export of all data to Excel
  - Panel/indicator management (create, update, move indicators)
- Privacy & Consent:
  - Cookie consent banner
  - Privacy & Cookie policy pages

---

## 2) Architecture

- Front‑end: Static HTML/CSS/JS
- Backend: Supabase (Auth, Postgres, RLS)
- Hosting: Vercel (recommended), Netlify or GitHub Pages also supported
- No build framework required; a simple `build.js` copies static assets to `public/` for CDNs/hosts that expect a publish directory

Key client‑side services:
- `supabase-config.js` initializes `supabaseClient` (URL + anon key)
- `supabase-service.js` (referenced across the app) wraps CRUD/auth flows
- `champion-db-supabase.js` exposes DB helper methods (via `SupabaseService`)
- Role‑based UI via `dynamic-navigation.js` + `admin-service.js`

---

## 3) Getting Started

Prerequisites:
- Node.js 18+ (for dev convenience)
- Supabase account (free tier fine)
- GitHub account

Clone:
```bash
git clone https://github.com/<owner>/<repo>.git
cd <repo>
```

Install (optional; only needed for Vercel CLI or local dev script):
```bash
npm install
```

---

## 4) Supabase Setup

Create a new project at https://supabase.com and fetch:
- Project URL (e.g., https://xxxxx.supabase.co)
- anon public key

Auth URLs:
- In Supabase Dashboard → Authentication → URL Configuration:
  - Site URL (local): http://localhost:8000 (or your dev host)
  - Redirect URLs: add http://localhost:8000/** and your production domain with /**

LinkedIn OAuth (optional):
- Enable LinkedIn OIDC in Supabase → Authentication → Providers
- Configure client ID/secret from LinkedIn Developers
- Redirect URL: https://YOUR-PROJECT-REF.supabase.co/auth/v1/callback

---

## 5) Database Schema & SQL Scripts

Run these in Supabase SQL Editor (left sidebar → SQL Editor). Order matters.

Required:
1) `complete-database-schema.sql`  
   - Creates tables: champions, panels, indicators, reviews, votes, comments, accepted_reviews, admin_actions, invitations  
   - Installs RLS policies, triggers, and admin RPC functions (`accept_review`, `delete_review`)

2) `add-notifications-table.sql`  
   - Adds notifications infrastructure (if used by your flows)

3) `seed-panels-indicators.sql`  
   - Seeds 14 ESG panels and ~50 indicators

Recommended:
4) `add-user-progress-tracking.sql`  
   - Adds columns used by “Continue where you left off”

Fix (if you see errors about missing updated_at column on accepted_reviews):
5) `fix-accepted-reviews-updated-at.sql`

Set admin for your account:
```sql
UPDATE champions
SET is_admin = true
WHERE id = 'YOUR-AUTH-USER-UUID';
```

---

## 6) Environment Configuration

Create `supabase-config.js` with your Supabase values:
```javascript
// supabase-config.js
const SUPABASE_URL = 'https://YOUR-PROJECT-REF.supabase.co';
const SUPABASE_ANON_KEY = 'YOUR-ANON-PUBLIC-KEY';
// window.supabaseClient is initialized in supabase-service.js using these constants
```

Production (Vercel/Netlify):
- Add environment variables in dashboard:
  - SUPABASE_URL
  - SUPABASE_ANON_KEY
- Ensure your code reads from env (or injects constants at build time if you prefer)

Important: Never expose Supabase service role keys in the client.

---

## 7) Running Locally

Option A (Node serve):
```bash
npm run dev
# opens a static server for current directory
```

Option B (Python):
```bash
python -m http.server 8000
```

Visit http://localhost:8000

---

## 8) Deploying

Vercel (recommended):
```bash
npm i -g vercel
vercel        # first deploy (follow prompts)
vercel --prod # production deploy
```

- Set env vars in Vercel → Project → Settings → Environment Variables:
  - SUPABASE_URL
  - SUPABASE_ANON_KEY

Netlify:
- Build command: `node build.js`
- Publish directory: `public`
- Set env vars (Netlify UI) and deploy

GitHub Pages:
- Serve root or `public/` (if you run `node build.js`) depending on your setup
- Make sure Supabase Auth redirect URLs include your Pages domain

---

## 9) Key Pages & Flows

- Public:
  - `/index.html` — marketing homepage
  - `/faq.html`, `/privacy.html`, `/cookie-policy.html`
- Auth:
  - `/champion-register.html` — registration (email confirmation flow)
  - `/champion-login.html` — login (email/password + LinkedIn)
  - `/linkedin-callback.html` — OAuth callback helper
- App:
  - `/champion-dashboard.html` — STIF Score, panels, activity
  - `/champion-panels.html` — browse panels, pick indicators
  - `/champion-indicators.html?panel=<id>[&indicator=<id>]` — validate indicators
  - `/champion-profile.html` — account settings
  - `/ranking.html` — community rankings (30‑day + weekly)
- Admin:
  - `/admin-review.html` — moderation queue, accept/delete reviews, Excel export, panel & indicator management

Role‑aware navigation:
- `dynamic-navigation.js` shows “Admin”, “Dashboard”, “Account Settings”, “Logout” based on auth/admin state.

Progress resume:
- “Continue where you left off” uses champion columns:
  - `last_active_panel_id`, `last_active_indicator_id`, `last_activity_at` (from `add-user-progress-tracking.sql`)

Credits & scoring:
- Reviews award credits; leaderboards rank by accepted reviews/credits.
- The scoring modal explains credit components on dashboard and ranking pages.

---

## 10) Admin Tools

- Review queue:
  - Accept moves a review into `accepted_reviews` via RPC `accept_review`
  - Delete marks review as `deleted` via RPC `delete_review`
- Panel & Indicator management:
  - Create/edit panels
  - Create/edit indicators and move indicators to panels
- Export:
  - Download Excel with sheets for reviews, panels, indicators, champions, votes, comments

To grant admin:
```sql
UPDATE champions SET is_admin = true WHERE email = 'admin@yourdomain.com';
```

---

## 11) Troubleshooting

Common errors and fixes:

- “Failed to fetch”:
  - Check `supabase-config.js` URL/key
  - Verify Supabase project is active; inspect browser console

- “RLS policy violation”:
  - Ensure you ran the schema SQL
  - Confirm user is authenticated (`supabaseClient.auth.getUser()`)

- “Column does not exist”:
  - Re‑run all SQL scripts in order
  - Add optional progress tracking or fix scripts as needed

- Admin button not showing:
  - Verify `champions.is_admin = true` for your user
  - Logout and login again (cached UI state)

- Panels/Indicators empty:
  - Run `seed-panels-indicators.sql`

- OAuth issues (LinkedIn):
  - Check provider is enabled in Supabase
  - Redirect matches `https://<ref>.supabase.co/auth/v1/callback`
  - `linkedin-callback.html` is reachable at your domain

---

## 12) Contributing, Legal & Policies

- Contributor agreements:
  - See `contributor-agreements.md` (CLA, NDA, IP & Attribution)
- Policies:
  - `/privacy.html`, `/cookie-policy.html`
- Code of conduct & terms:
  - Link your documents/pages as applicable

We recommend collecting explicit consent for CLA/NDA at registration (already supported in the UI) and keeping database records for the legal checks.

---

## 13) Project Structure

High‑value files (non‑exhaustive):

- Front‑end:
  - `index.html`, `styles.css`
  - `mobile-menu.js`, `membership-modal.js`, `logout.js`
  - `dynamic-navigation.js` (role‑aware nav)
- Auth & DB:
  - `supabase-config.js` (inject your project URL & anon key)
  - `supabase-service.js` (service wrapper; used across the app)
  - `champion-auth-supabase.js` (register/login/email confirm/OAuth)
  - `champion-db-supabase.js` (DB helpers)
- App pages:
  - `champion-dashboard.html` / `champion-dashboard.js`
  - `champion-panels.html` / `champion-panels.js`
  - `champion-indicators.html` / `champion-indicators.js`
  - `champion-profile.html` / `champion-profile.js`
  - `ranking.html` / `ranking-supabase.js`
- Admin:
  - `admin-review.html`
  - `admin-service.js` (admin RPC + CRUD)
  - `admin-review.js` (moderation queue)
  - `admin-management.js` (panel/indicator management UI)
- SQL (run in Supabase SQL Editor):
  - `complete-database-schema.sql`
  - `add-notifications-table.sql`
  - `seed-panels-indicators.sql`
  - `add-user-progress-tracking.sql` (optional)
  - `fix-accepted-reviews-updated-at.sql` (optional fix)
- Build/Deploy:
  - `build.js` (copies static assets to `public/`)
  - `package.json` (`dev`, `build`, `deploy`)

---

## 14) License

MIT License. See the repository’s LICENSE (package metadata indicates MIT).

© STIF — Sustainability Technology and Innovation Forum