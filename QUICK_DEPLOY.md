# Quick Deploy Guide - TL;DR

## 🎯 Simple Answer

### Deploy to VERCEL:
**Everything except `cron-worker.js`**

```
✅ Deploy to Vercel:
   - /app (all pages and API routes)
   - /lib (all utilities and scrapers)
   - /components (React components)
   - /public (static files)
   - /types (TypeScript types)
   - package.json
   - next.config.ts
   - All other Next.js files
```

### Deploy to RAILWAY:
**Only the cron worker**

```
✅ Deploy to Railway:
   - cron-worker.js (ONLY THIS!)
   - railway.json (config)
   - package.json (for dependencies)
```

---

## 🚀 5-Minute Deploy

### 1. Deploy to Vercel (2 minutes)

```bash
# Push code to GitHub
git push origin main

# Go to vercel.com
# Click "Import Project"
# Select your repo
# Add environment variables (see below)
# Click "Deploy"
```

**Environment Variables for Vercel:**
```
MONGODB_URI=your_mongodb_uri
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_key
SUPABASE_SERVICE_KEY=your_key
GEMINI_API_KEY=your_key
CRON_SECRET=generate_random_32_chars
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
```

**Result:** You get `https://your-app.vercel.app`

---

### 2. Deploy to Railway (2 minutes)

```bash
# Go to railway.app
# Click "New Project"
# Select "Deploy from GitHub"
# Choose your repo
# Add environment variables (see below)
# Railway auto-deploys
```

**Environment Variables for Railway:**
```
VERCEL_URL=https://your-app.vercel.app
CRON_SECRET=same_as_vercel
```

**Result:** Cron worker runs automatically

---

### 3. Verify (1 minute)

```bash
# Check Railway logs - should see:
"Cron worker started"
"Scraper: */30 * * * *"

# Test the API:
curl -X POST https://your-app.vercel.app/api/scrape \
  -H "Authorization: Bearer your_cron_secret"

# Check MongoDB - should see events appearing
```

---

## 📊 What Happens After Deploy

```
Every 30 minutes:
  Railway → Calls Vercel /api/scrape
         → Vercel scrapes news
         → Processes with AI
         → Stores in MongoDB
         → Returns results to Railway

Daily at midnight:
  Railway → Calls Vercel /api/cleanup
         → Vercel deletes old events
         → Returns results to Railway
```

---

## ⚠️ Common Mistakes

### ❌ DON'T:
- Deploy cron-worker.js to Vercel (it won't run)
- Forget to add CRON_SECRET to both platforms
- Use different CRON_SECRET values
- Add trailing slash to VERCEL_URL

### ✅ DO:
- Deploy entire Next.js app to Vercel
- Deploy only cron-worker.js to Railway
- Use same CRON_SECRET in both
- Test endpoints after deployment

---

## 🎯 Quick Reference

| What | Where | Why |
|------|-------|-----|
| Next.js App | Vercel | Serverless hosting |
| API Routes | Vercel | Serverless functions |
| Cron Worker | Railway | Scheduled tasks |
| Frontend | Vercel | Static hosting |
| Database | MongoDB Atlas | Data storage |
| Auth | Supabase | User management |

---

## 🔗 Full Guides

- **Detailed Steps:** See `DEPLOYMENT_GUIDE.md`
- **Railway Specific:** See `RAILWAY_DEPLOYMENT.md`
- **Architecture:** See `DEPLOYMENT_ARCHITECTURE.md`
- **Quick Start:** See `DEPLOY_NOW.md`

---

## ✅ Done!

That's it! Your backend is now:
- ✅ Scraping news every 30 minutes
- ✅ Processing with AI
- ✅ Storing in MongoDB
- ✅ Running automatically 24/7

**Next:** Build the frontend to visualize the data!
