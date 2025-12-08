# STIF ESG Champions Platform - Setup Guide

This guide will walk you through setting up the STIF ESG Champions platform with your own Supabase account and GitHub repository.

## Prerequisites

Before you begin, ensure you have:
- A GitHub account
- A Supabase account (free tier is sufficient)
- Basic knowledge of Git and command line
- A code editor (VS Code recommended)

## Table of Contents

1. [GitHub Setup](#1-github-setup)
2. [Supabase Project Setup](#2-supabase-project-setup)
3. [Database Schema Setup](#3-database-schema-setup)
4. [Configure Supabase Credentials](#4-configure-supabase-credentials)
5. [LinkedIn OAuth Setup (Optional)](#5-linkedin-oauth-setup-optional)
6. [Test the Setup](#6-test-the-setup)
7. [Deployment](#7-deployment)

---

## 1. GitHub Setup

### Step 1.1: Clone or Fork the Repository

If the repository is public, you can fork it:
1. Go to the repository on GitHub
2. Click the "Fork" button in the top right
3. Select your GitHub account as the destination

Or clone it to your local machine:
```bash
git clone https://github.com/[OWNER]/[REPO-NAME].git
cd [REPO-NAME]
```

### Step 1.2: Create Your Own GitHub Repository (Optional)

If you want to create a fresh repository:

1. Go to GitHub and create a new repository
2. Clone it locally:
   ```bash
   git clone https://github.com/YOUR-USERNAME/YOUR-REPO-NAME.git
   cd YOUR-REPO-NAME
   ```
3. Copy all files from the original repository to your new repository
4. Commit and push:
   ```bash
   git add .
   git commit -m "Initial commit: STIF ESG Champions platform"
   git push origin main
   ```

---

## 2. Supabase Project Setup

### Step 2.1: Create a New Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign up or log in to your account
3. Click "New Project"
4. Fill in the project details:
   - **Name**: Give your project a name (e.g., "stif-esg-champions")
   - **Database Password**: Create a strong password and **save it securely**
   - **Region**: Choose the region closest to your users
   - **Pricing Plan**: Select "Free" (sufficient for development and small projects)
5. Click "Create new project"
6. Wait for the project to be created (this takes 1-2 minutes)

### Step 2.2: Get Your Supabase Credentials

Once your project is created:

1. Go to **Settings** → **API** in your Supabase dashboard
2. You'll see two important values:
   - **Project URL** (looks like: `https://xxxxxxxxxxxxx.supabase.co`)
   - **anon/public key** (a long JWT token starting with `eyJ...`)

**Important:** Save these values - you'll need them in the next step.

---

## 3. Database Schema Setup

The website requires several database tables, functions, and policies. We've provided SQL scripts to set everything up.

### Step 3.1: Open SQL Editor

1. In your Supabase dashboard, click **SQL Editor** in the left sidebar
2. Click **New Query**

### Step 3.2: Run the Complete Database Schema

1. Open the file `complete-database-schema.sql` in your code editor
2. Copy **ALL** the contents of the file
3. Paste it into the Supabase SQL Editor
4. Click **Run** (or press `Ctrl+Enter`)
5. Wait for the script to complete (you should see "Success. No rows returned" if everything worked)

This creates:
- All required tables (champions, panels, indicators, reviews, votes, comments, etc.)
- Row Level Security (RLS) policies
- Database functions and triggers
- Indexes for performance

### Step 3.3: Add Notifications Table

1. Open the file `add-notifications-table.sql`
2. Copy all contents
3. Paste into SQL Editor
4. Click **Run**

This adds the notifications system for review workflow.

### Step 3.4: Seed Initial Data (Panels and Indicators)

1. Open the file `seed-panels-indicators.sql`
2. Copy all contents
3. Paste into SQL Editor
4. Click **Run**

This populates the database with:
- 14 ESG panels (Climate & GHG Emissions, Energy & Resource Efficiency, etc.)
- ~50 indicators across different panels

### Step 3.5: Add Progress Tracking (Optional but Recommended)

1. Open the file `add-user-progress-tracking.sql`
2. Copy all contents
3. Paste into SQL Editor
4. Click **Run**

This adds columns to track user progress for "Continue where you left off" functionality.

### Step 3.6: Set Up Admin User

To access the admin panel, you need to grant admin privileges to a user:

1. After creating your account through the website, note your user ID from the URL or database
2. In SQL Editor, run this query (replace `YOUR-USER-ID` with your actual user UUID):

```sql
UPDATE champions 
SET is_admin = true 
WHERE id = 'YOUR-USER-ID';
```

**How to find your user ID:**
- After registering, check the browser console
- Or run this query in SQL Editor:
```sql
SELECT id, email, first_name, last_name 
FROM champions 
ORDER BY created_at DESC 
LIMIT 5;
```

---

## 4. Configure Supabase Credentials

Now you need to connect the website code to your Supabase project.

### Step 4.1: Update supabase-config.js

1. Open the file `supabase-config.js` in your code editor
2. Replace the placeholder values with your Supabase credentials:

```javascript
// Update these values with your Supabase project credentials
const SUPABASE_URL = 'https://YOUR-PROJECT-REF.supabase.co';
const SUPABASE_ANON_KEY = 'your-anon-key-here';
```

**Where to find these values:**
- Go to Supabase Dashboard → Settings → API
- Copy the "Project URL" → paste as `SUPABASE_URL`
- Copy the "anon public" key → paste as `SUPABASE_ANON_KEY`

### Step 4.2: Configure Authentication Settings

1. In Supabase Dashboard, go to **Authentication** → **URL Configuration**
2. Set your site URL:
   - **Site URL**: `http://localhost:3000` (for local development)
   - For production: Your deployed URL (e.g., `https://your-domain.com`)
3. Add redirect URLs:
   - `http://localhost:3000/**` (for local development)
   - `http://localhost:8080/**` (if using a different local port)
   - Your production URL with `/**` wildcard

4. Save the changes

---

## 5. LinkedIn OAuth Setup (Optional)

If you want to enable LinkedIn login:

### Step 5.1: Create LinkedIn App

1. Go to [LinkedIn Developers](https://www.linkedin.com/developers/)
2. Create a new app
3. Fill in the required details
4. In "Products", request access to "Sign In with LinkedIn using OpenID Connect"
5. After approval, go to "Auth" tab

### Step 5.2: Configure LinkedIn in Supabase

1. In Supabase Dashboard, go to **Authentication** → **Providers**
2. Find "LinkedIn" and enable it
3. Copy your LinkedIn credentials:
   - **Client ID** (from LinkedIn app)
   - **Client Secret** (from LinkedIn app)
4. Paste them into Supabase
5. Set the Redirect URL:
   - `https://YOUR-PROJECT-REF.supabase.co/auth/v1/callback`
   - Add this same URL in your LinkedIn app's "Authorized Redirect URLs"

6. Save the changes

---

## 6. Test the Setup

### Step 6.1: Test Locally

1. Open a terminal in your project folder
2. Start a local server:

   **Option A: Using Python (if installed)**
   ```bash
   python -m http.server 8000
   ```

   **Option B: Using Node.js (if installed)**
   ```bash
   npx serve .
   ```

   **Option C: Using VS Code Live Server extension**
   - Install "Live Server" extension
   - Right-click `index.html` → "Open with Live Server"

3. Open your browser and go to `http://localhost:8000` (or the port shown)

### Step 6.2: Test Registration

1. Click "Membership" → "ESG Champion"
2. Click "Register as Champion"
3. Fill out the registration form
4. Submit and check:
   - You should be redirected to the dashboard
   - Check Supabase Dashboard → Table Editor → `champions` table
   - Your new user should appear there

### Step 6.3: Test Login

1. Log out (if logged in)
2. Go to the login page
3. Enter your credentials
4. You should be able to log in successfully

### Step 6.4: Test Admin Access

1. Make sure you've set yourself as admin (Step 3.6)
2. Log in with your admin account
3. You should see an "Admin" button in the navigation
4. Click it to access the admin review page

### Step 6.5: Verify Database Data

In Supabase Dashboard → Table Editor, verify:
- ✅ `champions` table has your user
- ✅ `panels` table has 14 panels
- ✅ `indicators` table has indicators
- ✅ Other tables exist (reviews, votes, comments, etc.)

---

## 7. Deployment

### Option A: Deploy to Vercel (Recommended)

#### Step 7.1: Prepare for Deployment

The project already includes Vercel configuration (`vercel.json` and `build.js`).

#### Step 7.2: Deploy to Vercel

1. Install Vercel CLI (if not installed):
   ```bash
   npm i -g vercel
   ```

2. In your project folder, run:
   ```bash
   vercel
   ```

3. Follow the prompts:
   - Link to existing project or create new one
   - Enter your Vercel account credentials
   - Keep default settings

4. For production deployment:
   ```bash
   vercel --prod
   ```

#### Step 7.3: Configure Environment Variables (Important!)

1. Go to your Vercel project dashboard
2. Go to **Settings** → **Environment Variables**
3. Add these variables:
   - `SUPABASE_URL`: Your Supabase project URL
   - `SUPABASE_ANON_KEY`: Your Supabase anon key

4. Redeploy:
   ```bash
   vercel --prod
   ```

#### Step 7.4: Update Supabase Redirect URLs

1. In Supabase Dashboard → Authentication → URL Configuration
2. Add your Vercel URL:
   - **Site URL**: `https://your-project.vercel.app`
   - **Redirect URLs**: `https://your-project.vercel.app/**`

### Option B: Deploy to Netlify

1. Push your code to GitHub
2. Go to [Netlify](https://netlify.com) and sign up
3. Click "Add new site" → "Import an existing project"
4. Connect your GitHub repository
5. Build settings:
   - **Build command**: `node build.js`
   - **Publish directory**: `public`
6. Add environment variables (Settings → Environment Variables):
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
7. Deploy

### Option C: Deploy to GitHub Pages

1. Update `supabase-config.js` to use environment variables or your production credentials
2. Push code to GitHub
3. Go to repository → Settings → Pages
4. Select source branch (usually `main`)
5. Select folder: `/ (root)` or `/public` if using build script
6. Save

---

## 8. Troubleshooting

### Common Issues and Solutions

#### Issue: "Failed to fetch" errors
**Solution**: 
- Check that `supabase-config.js` has the correct URL and key
- Verify your Supabase project is active
- Check browser console for specific error messages

#### Issue: "Column does not exist" errors
**Solution**: 
- Make sure you ran all SQL scripts in order
- Check that the table exists in Supabase Dashboard → Table Editor
- Verify the column name matches (case-sensitive)

#### Issue: "RLS policy violation" errors
**Solution**: 
- Check that RLS policies are enabled
- Verify you're authenticated (check browser console)
- Ensure the SQL scripts ran successfully

#### Issue: Cannot log in after registration
**Solution**: 
- Check Supabase Dashboard → Authentication → Users
- Verify your email is confirmed
- Check Supabase Dashboard → Table Editor → `champions` table for your user
- Verify the database trigger created your profile

#### Issue: Admin button not showing
**Solution**: 
- Verify you set `is_admin = true` for your user (Step 3.6)
- Check browser console for errors
- Try logging out and back in

#### Issue: Panels/Indicators not showing
**Solution**: 
- Verify you ran `seed-panels-indicators.sql`
- Check Supabase Dashboard → Table Editor → `panels` and `indicators` tables
- Check browser console for fetch errors

---

## 9. Additional Configuration

### Enable Email Authentication

1. In Supabase Dashboard → Authentication → Providers → Email
2. Enable "Enable email provider"
3. Configure email templates if needed
4. For production, set up custom SMTP (Settings → Auth → SMTP Settings)

### Set Up Custom Domain (Production)

1. In Supabase Dashboard → Settings → API
2. Add your custom domain
3. Update DNS records as instructed
4. Update redirect URLs in Authentication settings

---

## 10. File Structure Overview

Here's what each important file does:

### HTML Files
- `index.html` - Homepage
- `champion-register.html` - Registration page
- `champion-login.html` - Login page
- `champion-dashboard.html` - User dashboard
- `champion-panels.html` - Panels listing
- `champion-indicators.html` - Indicators review page
- `admin-review.html` - Admin review interface
- `ranking.html` - Leaderboard/rankings page

### JavaScript Files
- `supabase-config.js` - Supabase connection configuration ⚠️ **UPDATE THIS**
- `supabase-service.js` - Database operations service layer
- `champion-auth-supabase.js` - Authentication logic
- `champion-dashboard.js` - Dashboard functionality
- `admin-service.js` - Admin operations
- `dynamic-navigation.js` - Navigation bar logic

### SQL Files
- `complete-database-schema.sql` - Main database schema ⚠️ **RUN THIS FIRST**
- `add-notifications-table.sql` - Notifications system
- `seed-panels-indicators.sql` - Initial data
- `add-user-progress-tracking.sql` - Progress tracking

---

## Quick Start Checklist

- [ ] Clone/fork the GitHub repository
- [ ] Create Supabase project
- [ ] Get Supabase URL and anon key
- [ ] Update `supabase-config.js` with your credentials
- [ ] Run `complete-database-schema.sql` in Supabase SQL Editor
- [ ] Run `add-notifications-table.sql`
- [ ] Run `seed-panels-indicators.sql`
- [ ] Run `add-user-progress-tracking.sql` (optional)
- [ ] Register a test account
- [ ] Set yourself as admin in the database
- [ ] Test all functionality
- [ ] Deploy to hosting platform
- [ ] Update Supabase redirect URLs for production
- [ ] Test deployed site

---

## Support

If you encounter issues:

1. Check the browser console for errors
2. Check Supabase Dashboard → Logs for server-side errors
3. Verify all SQL scripts ran successfully
4. Ensure your Supabase credentials are correct
5. Check that tables and columns exist in Supabase Dashboard → Table Editor

---

## Next Steps

After setup is complete:

1. Customize the content and branding
2. Add your own panels and indicators
3. Configure email templates
4. Set up production domain
5. Enable additional authentication providers if needed
6. Set up backups for your Supabase database

---

**Congratulations!** 🎉 Your STIF ESG Champions platform is now set up and ready to use!

