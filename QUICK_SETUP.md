# Quick Setup Guide - STIF ESG Champions Platform

A condensed guide for experienced developers. For detailed instructions, see [SETUP_GUIDE.md](./SETUP_GUIDE.md).

## Prerequisites
- GitHub account
- Supabase account (free tier)
- Basic Git knowledge

## Quick Steps

### 1. Get the Code
```bash
git clone https://github.com/[OWNER]/[REPO].git
cd [REPO]
```

### 2. Create Supabase Project
1. Go to [supabase.com](https://supabase.com) → New Project
2. Fill in project details and create
3. Wait for project to initialize (~2 minutes)

### 3. Get Supabase Credentials
In Supabase Dashboard → **Settings** → **API**:
- Copy **Project URL** (e.g., `https://xxxxx.supabase.co`)
- Copy **anon public key** (starts with `eyJ...`)

### 4. Update Configuration
Edit `supabase-config.js`:
```javascript
const SUPABASE_URL = 'YOUR-PROJECT-URL';
const SUPABASE_ANON_KEY = 'YOUR-ANON-KEY';
```

### 5. Set Up Database
In Supabase Dashboard → **SQL Editor**, run these scripts **in order**:

1. **complete-database-schema.sql** (creates all tables)
2. **add-notifications-table.sql** (notifications system)
3. **seed-panels-indicators.sql** (initial data - 14 panels, ~50 indicators)
4. **add-user-progress-tracking.sql** (optional - progress tracking)

### 6. Configure Authentication
In Supabase Dashboard → **Authentication** → **URL Configuration**:
- **Site URL**: `http://localhost:8000` (dev) or your production URL
- **Redirect URLs**: `http://localhost:8000/**` (add `/**` for all routes)

### 7. Test Locally
```bash
# Start local server (choose one):
python -m http.server 8000
# OR
npx serve .
# OR
# Use VS Code Live Server extension
```

Visit `http://localhost:8000` in your browser.

### 8. Create Admin User
1. Register through the website
2. Find your user ID in Supabase Dashboard → **Table Editor** → `champions` table
3. In **SQL Editor**, run:
```sql
UPDATE champions 
SET is_admin = true 
WHERE email = 'your-email@example.com';
```

### 9. Deploy (Vercel Example)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# For production
vercel --prod
```

Then add environment variables in Vercel Dashboard:
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`

### 10. Update Production URLs
In Supabase Dashboard → **Authentication** → **URL Configuration**:
- Add your deployed URL to redirect URLs
- Update site URL if needed

## SQL Scripts Order

Run these in Supabase SQL Editor **in this order**:

1. ✅ `complete-database-schema.sql` - **REQUIRED** (Main schema)
2. ✅ `add-notifications-table.sql` - **REQUIRED** (Notifications)
3. ✅ `seed-panels-indicators.sql` - **REQUIRED** (Initial data)
4. ✅ `add-user-progress-tracking.sql` - **OPTIONAL** (Progress tracking)

## Common Issues

**"Failed to fetch" errors:**
→ Check `supabase-config.js` has correct URL and key

**"Column does not exist" errors:**
→ Make sure SQL scripts ran successfully

**Can't log in after registration:**
→ Check `champions` table has your user (database trigger should create it)

**Admin button not showing:**
→ Set `is_admin = true` for your user in database

**Panels/Indicators not showing:**
→ Make sure `seed-panels-indicators.sql` ran successfully

## File Checklist

Essential files to update:
- ✅ `supabase-config.js` - **UPDATE THIS** with your Supabase credentials

Essential SQL scripts to run:
- ✅ `complete-database-schema.sql` - **RUN THIS FIRST**
- ✅ `add-notifications-table.sql`
- ✅ `seed-panels-indicators.sql`
- ✅ `add-user-progress-tracking.sql` (optional)

## Need Help?

See [SETUP_GUIDE.md](./SETUP_GUIDE.md) for detailed instructions and troubleshooting.

---

**Time to complete:** ~15-20 minutes

