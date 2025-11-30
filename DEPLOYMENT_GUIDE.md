# Almora Radar - Complete Deployment Guide

## 🎯 What Goes Where

```
┌─────────────────────────────────────────────────────────────┐
│                         VERCEL                               │
│  (Hosts the Next.js Application)                            │
│                                                              │
│  📦 What Gets Deployed:                                     │
│  ✅ Entire Next.js project                                  │
│  ✅ All /app directory (pages + API routes)                │
│  ✅ All /lib directory (utilities, scrapers, etc.)         │
│  ✅ All /components directory (React components)           │
│  ✅ All /public directory (static assets)                  │
│  ✅ package.json dependencies                               │
│                                                              │
│  🚫 What DOESN'T Get Deployed:                             │
│  ❌ cron-worker.js (goes to Railway)                       │
│  ❌ railway.json (Railway config only)                     │
│  ❌ .env.local (use Vercel env vars instead)              │
│  ❌ node_modules (rebuilt by Vercel)                       │
│  ❌ .next (rebuilt by Vercel)                              │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                        RAILWAY                               │
│  (Runs the Cron Worker)                                     │
│                                                              │
│  📦 What Gets Deployed:                                     │
│  ✅ cron-worker.js (ONLY this file)                        │
│  ✅ railway.json (config file)                              │
│  ✅ package.json (for node-cron dependency)                │
│                                                              │
│  🚫 What DOESN'T Get Deployed:                             │
│  ❌ Everything else (Railway ignores it)                   │
│                                                              │
│  Railway will:                                               │
│  1. Read railway.json                                        │
│  2. Install node-cron from package.json                     │
│  3. Run: node cron-worker.js                                │
│  4. Keep it running 24/7                                     │
└─────────────────────────────────────────────────────────────┘
```

---

## 📋 Step-by-Step Deployment

### PART 1: Deploy to Vercel (Main Application)

#### Step 1.1: Prepare Your Code

```bash
# Make sure you're in the almora-radar directory
cd almora-radar

# Ensure all changes are committed
git add .
git commit -m "Ready for deployment"
git push origin main
```

#### Step 1.2: Create Vercel Project

1. Go to **https://vercel.com**
2. Click **"Add New Project"**
3. Click **"Import Git Repository"**
4. Select your **almora-radar** repository
5. Vercel will auto-detect it's a Next.js project

#### Step 1.3: Configure Build Settings

Vercel should auto-detect these, but verify:

```
Framework Preset: Next.js
Build Command: npm run build
Output Directory: .next
Install Command: npm install
```

#### Step 1.4: Add Environment Variables

Click **"Environment Variables"** and add these:

```bash
# Database
MONGODB_URI=mongodb+srv://your-connection-string
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key

# AI
GEMINI_API_KEY=your-gemini-key

# Firebase (for future use)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=your-email@project.iam.gserviceaccount.com

# Public (client-side)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Cron Authentication (IMPORTANT!)
CRON_SECRET=generate-a-secure-random-32-char-token-here
```

**Generate CRON_SECRET:**
```bash
# On Mac/Linux:
openssl rand -hex 32

# On Windows PowerShell:
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | % {[char]$_})

# Or use: https://www.random.org/strings/
```

#### Step 1.5: Deploy

1. Click **"Deploy"**
2. Wait 2-3 minutes for build
3. You'll get a URL like: `https://almora-radar.vercel.app`
4. **Save this URL** - you'll need it for Railway!

#### Step 1.6: Verify Vercel Deployment

```bash
# Test that the API is accessible
curl https://your-app.vercel.app/api/process

# Should return: 405 Method Not Allowed (because it needs POST)
# This means the API is working!
```

---

### PART 2: Deploy to Railway (Cron Worker)

#### Step 2.1: Create Railway Account

1. Go to **https://railway.app**
2. Sign up with GitHub
3. Authorize Railway to access your repositories

#### Step 2.2: Create New Project

1. Click **"New Project"**
2. Select **"Deploy from GitHub repo"**
3. Choose your **almora-radar** repository
4. Railway will automatically detect `railway.json`

#### Step 2.3: Configure Environment Variables

In Railway dashboard, go to **Variables** tab and add:

```bash
# Your Vercel URL (from Step 1.5)
VERCEL_URL=https://almora-radar.vercel.app

# Same CRON_SECRET as Vercel (MUST MATCH!)
CRON_SECRET=same-token-you-used-in-vercel
```

**⚠️ CRITICAL:** The `CRON_SECRET` must be **exactly the same** in both Vercel and Railway!

#### Step 2.4: Deploy

1. Railway will automatically deploy
2. Check the **Logs** tab
3. You should see:

```
=============================================================
Almora Radar - Cron Worker
=============================================================
Target URL: https://almora-radar.vercel.app
Started at: 2024-01-30T...
=============================================================

Cron jobs scheduled:
  ✓ Scraper: */30 * * * * (every 30 minutes)
  ✓ Cleanup: 0 0 * * * (daily at midnight UTC)

Worker is running. Press Ctrl+C to stop.
```

#### Step 2.5: Verify Railway Deployment

Railway logs will show cron executions. Wait up to 30 minutes for first scraper run, or test manually:

```bash
# Test the connection from Railway to Vercel
# (This simulates what Railway does)
curl -X POST https://your-app.vercel.app/api/scrape \
  -H "Authorization: Bearer your-cron-secret" \
  -H "Content-Type: application/json"

# Should return JSON with scraping results
```

---

## 🔄 How They Work Together

```
┌──────────────────────────────────────────────────────────────┐
│                    DEPLOYMENT FLOW                            │
└──────────────────────────────────────────────────────────────┘

1. RAILWAY CRON WORKER (runs every 30 minutes)
   │
   │  Executes: node cron-worker.js
   │
   ├─► Sends HTTP POST to Vercel
   │   URL: https://your-app.vercel.app/api/scrape
   │   Header: Authorization: Bearer <CRON_SECRET>
   │
   ▼

2. VERCEL API ROUTE (/api/scrape)
   │
   ├─► Validates CRON_SECRET
   │   ├─► If invalid: Returns 401 Unauthorized
   │   └─► If valid: Continues...
   │
   ├─► Runs all scrapers in parallel
   │   ├─► Amar Ujala scraper
   │   ├─► Dainik Jagran scraper
   │   ├─► Local news scraper
   │   ├─► Facebook scraper
   │   ├─► Instagram scraper
   │   └─► YouTube scraper
   │
   ├─► For each scraped article:
   │   └─► Calls /api/process internally
   │       ├─► Processes with Gemini AI
   │       ├─► Geocodes location
   │       └─► Stores in MongoDB
   │
   └─► Returns results to Railway
       └─► Railway logs the results

3. RAILWAY LOGS
   │
   └─► Shows success/failure of each scrape job
```

---

## 🧪 Testing Your Deployment

### Test 1: Verify Vercel is Running

```bash
# Visit your Vercel URL in browser
https://your-app.vercel.app

# You should see the Next.js default page (no frontend yet)
```

### Test 2: Test API Endpoints

```bash
# Test the process endpoint (should work)
curl -X POST https://your-app.vercel.app/api/process \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Article",
    "content": "This is a test article about Almora with enough content to process properly and trigger the AI.",
    "images": [],
    "publishTime": "2024-01-30T12:00:00Z",
    "sourceLink": "https://example.com/test-123"
  }'

# Should return JSON with processed event
```

### Test 3: Test Cron Authentication

```bash
# Test scraper endpoint WITH auth (should work)
curl -X POST https://your-app.vercel.app/api/scrape \
  -H "Authorization: Bearer your-cron-secret" \
  -H "Content-Type: application/json"

# Should return JSON with scraping results

# Test WITHOUT auth (should fail)
curl -X POST https://your-app.vercel.app/api/scrape \
  -H "Content-Type: application/json"

# Should return 401 Unauthorized
```

### Test 4: Check Railway Logs

1. Go to Railway dashboard
2. Click on your project
3. Click **"Logs"** tab
4. You should see the cron worker running
5. Wait for next 30-minute mark to see scraper execute

### Test 5: Check MongoDB

1. Go to MongoDB Atlas dashboard
2. Click **"Browse Collections"**
3. Select `almora-radar` database
4. Select `events` collection
5. You should see events appearing after scraper runs

---

## 📊 Monitoring Your Deployment

### Vercel Dashboard

**What to Monitor:**
- Function invocations (should see /api/scrape every 30 min)
- Function duration (should be under 10 seconds)
- Errors (should be minimal)
- Bandwidth usage

**Where to Find:**
- Go to vercel.com
- Select your project
- Click "Analytics" or "Logs"

### Railway Dashboard

**What to Monitor:**
- Deployment status (should be "Active")
- Logs (should show cron executions)
- Memory usage (should be low, ~50MB)
- CPU usage (should be minimal)

**Where to Find:**
- Go to railway.app
- Select your project
- Click "Metrics" or "Logs"

### MongoDB Atlas

**What to Monitor:**
- Database size (should grow slowly)
- Number of events
- Connection count
- Query performance

**Where to Find:**
- Go to cloud.mongodb.com
- Select your cluster
- Click "Metrics"

---

## 🐛 Troubleshooting

### Problem: Railway can't connect to Vercel

**Symptoms:**
- Railway logs show connection errors
- No events in MongoDB

**Solutions:**
1. Check `VERCEL_URL` in Railway (no trailing slash!)
2. Check `CRON_SECRET` matches in both platforms
3. Verify Vercel deployment is live
4. Test manually with curl

### Problem: 401 Unauthorized errors

**Symptoms:**
- Railway logs show 401 errors
- Scraper doesn't run

**Solutions:**
1. Verify `CRON_SECRET` is **exactly the same** in Vercel and Railway
2. Check for extra spaces or quotes
3. Regenerate the secret and update both platforms
4. Redeploy Vercel after changing env vars

### Problem: Scraper runs but no data

**Symptoms:**
- Railway shows success
- MongoDB is empty

**Solutions:**
1. Check Vercel logs for errors
2. Verify MongoDB connection string
3. Test /api/process endpoint manually
4. Check Gemini API key is valid
5. Verify news sources are accessible

### Problem: Railway worker stops

**Symptoms:**
- No cron executions
- Railway shows "Crashed"

**Solutions:**
1. Check Railway logs for errors
2. Verify `cron-worker.js` exists
3. Verify `node-cron` is in package.json
4. Restart the Railway service
5. Check Railway free tier hours remaining

---

## 💰 Cost Tracking

### Free Tier Limits

**Vercel:**
- ✅ 100GB bandwidth/month
- ✅ Unlimited API requests
- ✅ Unlimited deployments

**Railway:**
- ✅ $5 credit/month
- ✅ ~500 execution hours
- ⚠️ Cron worker uses ~1 hour/day = 30 hours/month

**MongoDB Atlas:**
- ✅ 512MB storage
- ✅ Shared cluster
- ⚠️ Watch storage usage

**Supabase:**
- ✅ 500MB database
- ✅ 50K monthly active users
- ✅ 2GB bandwidth

### When You'll Need to Upgrade

**Railway** ($5/month):
- If worker runs out of free hours
- If you need more reliability

**MongoDB** ($9/month):
- When storage exceeds 400MB
- When you need better performance

**Supabase** ($25/month):
- When database exceeds 400MB
- When you need more bandwidth

---

## ✅ Deployment Checklist

### Pre-Deployment
- [ ] All code committed to GitHub
- [ ] MongoDB Atlas cluster created
- [ ] Supabase project created
- [ ] Gemini API key obtained
- [ ] Firebase project created (optional)
- [ ] CRON_SECRET generated

### Vercel Deployment
- [ ] Project imported from GitHub
- [ ] All environment variables added
- [ ] CRON_SECRET added
- [ ] Deployment successful
- [ ] URL saved for Railway
- [ ] API endpoints tested

### Railway Deployment
- [ ] Project created from GitHub
- [ ] VERCEL_URL added
- [ ] CRON_SECRET added (matching Vercel)
- [ ] Deployment successful
- [ ] Logs show cron worker running
- [ ] First scrape executed successfully

### Verification
- [ ] Test /api/process manually
- [ ] Test /api/scrape with auth
- [ ] Check Railway logs
- [ ] Check Vercel logs
- [ ] Verify events in MongoDB
- [ ] Monitor for 24 hours
- [ ] Document any issues

---

## 🎉 Success!

Your deployment is complete when:

1. ✅ Vercel shows your app is live
2. ✅ Railway shows cron worker is running
3. ✅ Scraper executes every 30 minutes
4. ✅ Events appear in MongoDB
5. ✅ No errors in logs
6. ✅ Cleanup runs daily at midnight

**Next Steps:**
- Monitor for a few days
- Check data quality
- Adjust scraper configurations if needed
- Start building the frontend!

---

## 📞 Need Help?

**Documentation:**
- `RAILWAY_DEPLOYMENT.md` - Detailed Railway guide
- `DEPLOYMENT_ARCHITECTURE.md` - System architecture
- `SETUP_GUIDE.md` - Local development

**Common Issues:**
- Check logs first (Vercel + Railway)
- Verify environment variables
- Test endpoints manually
- Check database connections

**Still stuck?**
- Review the troubleshooting section above
- Check Vercel documentation
- Check Railway documentation
- Verify all services are running
