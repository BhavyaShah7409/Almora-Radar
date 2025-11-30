# Almora Radar - Visual Deployment Guide

## 🎨 The Big Picture

```
┌─────────────────────────────────────────────────────────────────┐
│                         YOUR GITHUB REPO                         │
│                      (almora-radar project)                      │
│                                                                  │
│  📁 almora-radar/                                               │
│  ├── 📁 app/          ← API routes & pages                     │
│  ├── 📁 lib/          ← Utilities & scrapers                   │
│  ├── 📁 components/   ← React components                       │
│  ├── 📁 public/       ← Static files                           │
│  ├── 📄 cron-worker.js ← Cron job script                       │
│  ├── 📄 package.json                                            │
│  └── 📄 next.config.ts                                          │
└─────────────────────────────────────────────────────────────────┘
                    │                           │
                    │                           │
        ┌───────────┴──────────┐    ┌──────────┴──────────┐
        │                      │    │                      │
        ▼                      ▼    ▼                      ▼
┌──────────────────┐   ┌──────────────────┐   ┌──────────────────┐
│     VERCEL       │   │     RAILWAY      │   │   DATABASES      │
│                  │   │                  │   │                  │
│  Deploys:        │   │  Deploys:        │   │  MongoDB Atlas   │
│  ✅ /app         │   │  ✅ cron-worker  │   │  Supabase        │
│  ✅ /lib         │   │  ✅ railway.json │   │  Firebase        │
│  ✅ /components  │   │  ✅ package.json │   │                  │
│  ✅ /public      │   │                  │   │                  │
│  ✅ Next.js      │   │  Runs:           │   │                  │
│                  │   │  node cron-worker│   │                  │
│  Provides:       │   │                  │   │                  │
│  🌐 Website      │   │  Triggers:       │   │                  │
│  🔌 API Routes   │   │  ⏰ Every 30min  │   │                  │
└──────────────────┘   └──────────────────┘   └──────────────────┘
```

---

## 🔄 How They Communicate

```
┌─────────────────────────────────────────────────────────────────┐
│                    RUNTIME FLOW                                  │
└─────────────────────────────────────────────────────────────────┘

Step 1: Railway Cron Triggers
┌──────────────┐
│   RAILWAY    │  Every 30 minutes, cron-worker.js wakes up
│              │  
│  cron-worker │  Sends HTTP POST request:
│     .js      │  ├─ URL: https://your-app.vercel.app/api/scrape
│              │  ├─ Header: Authorization: Bearer <secret>
│              │  └─ Method: POST
└──────┬───────┘
       │
       │ HTTP POST
       │
       ▼
┌──────────────┐
│    VERCEL    │  Receives request at /api/scrape
│              │  
│ /api/scrape  │  1. Validates CRON_SECRET
│              │  2. Runs all scrapers
│              │  3. Processes articles with AI
│              │  4. Stores in MongoDB
│              │  5. Returns results
└──────┬───────┘
       │
       │ Results
       │
       ▼
┌──────────────┐
│   RAILWAY    │  Logs the results
│              │  
│  cron-worker │  Shows success/failure
│     .js      │  Waits for next trigger
└──────────────┘
```

---

## 📦 What Each Platform Does

### VERCEL = Your Application Server

```
┌─────────────────────────────────────────┐
│            VERCEL HOSTS                  │
├─────────────────────────────────────────┤
│                                          │
│  🌐 Frontend (when you build it)        │
│     - React components                   │
│     - Pages                              │
│     - Static assets                      │
│                                          │
│  🔌 Backend API Routes                   │
│     - /api/scrape    (scraping)         │
│     - /api/process   (AI processing)    │
│     - /api/cleanup   (delete old data)  │
│     - /api/events    (get events)       │
│     - /api/comments  (user comments)    │
│     - ... more routes ...               │
│                                          │
│  📚 Libraries & Utilities                │
│     - Scrapers                           │
│     - AI integration                     │
│     - Geocoding                          │
│     - Database connections               │
│                                          │
└─────────────────────────────────────────┘

Access: https://your-app.vercel.app
Cost: FREE (100GB bandwidth/month)
```

### RAILWAY = Your Cron Job Runner

```
┌─────────────────────────────────────────┐
│           RAILWAY RUNS                   │
├─────────────────────────────────────────┤
│                                          │
│  ⏰ Cron Worker (cron-worker.js)        │
│                                          │
│  Schedule:                               │
│  ├─ Every 30 minutes → /api/scrape      │
│  └─ Daily at midnight → /api/cleanup    │
│                                          │
│  What it does:                           │
│  1. Wakes up on schedule                 │
│  2. Calls Vercel API endpoints           │
│  3. Logs results                         │
│  4. Goes back to sleep                   │
│                                          │
└─────────────────────────────────────────┘

Access: Railway Dashboard (logs only)
Cost: FREE ($5 credit = ~500 hours/month)
```

---

## 🔐 Authentication Flow

```
┌──────────────────────────────────────────────────────────────┐
│              HOW CRON AUTHENTICATION WORKS                    │
└──────────────────────────────────────────────────────────────┘

1. You generate a secret token (CRON_SECRET)
   Example: "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6"

2. You add it to BOTH platforms:
   
   VERCEL Environment Variables:
   ┌─────────────────────────────────┐
   │ CRON_SECRET = a1b2c3d4...      │
   └─────────────────────────────────┘
   
   RAILWAY Environment Variables:
   ┌─────────────────────────────────┐
   │ CRON_SECRET = a1b2c3d4...      │  ← MUST BE SAME!
   └─────────────────────────────────┘

3. Railway sends request with token:
   ┌─────────────────────────────────────────┐
   │ POST /api/scrape                        │
   │ Authorization: Bearer a1b2c3d4...      │
   └─────────────────────────────────────────┘

4. Vercel validates token:
   ┌─────────────────────────────────────────┐
   │ if (token === CRON_SECRET) {           │
   │   ✅ Allow request                      │
   │ } else {                                │
   │   ❌ Return 401 Unauthorized            │
   │ }                                       │
   └─────────────────────────────────────────┘
```

---

## 📊 Data Flow

```
┌──────────────────────────────────────────────────────────────┐
│                    DATA FLOW DIAGRAM                          │
└──────────────────────────────────────────────────────────────┘

1. NEWS SOURCES
   ├─ Amar Ujala
   ├─ Dainik Jagran
   ├─ Local News
   ├─ Facebook
   ├─ Instagram
   └─ YouTube
        │
        │ HTML/JSON
        ▼
2. VERCEL SCRAPERS
   ├─ Extract articles
   ├─ Parse content
   └─ Clean data
        │
        │ Raw articles
        ▼
3. GEMINI AI (Google)
   ├─ Generate summaries
   ├─ Extract locations
   ├─ Classify categories
   └─ Assign priority
        │
        │ Processed data
        ▼
4. NOMINATIM API
   ├─ Convert location to GPS
   └─ Validate coordinates
        │
        │ Complete event
        ▼
5. MONGODB ATLAS
   ├─ Store event
   ├─ Check duplicates
   └─ Index for search
        │
        │ Stored successfully
        ▼
6. FRONTEND (future)
   ├─ Display on map
   ├─ Show to users
   └─ Enable interactions
```

---

## 🎯 Deployment Checklist

### Before You Start
```
□ GitHub account with your code
□ Vercel account (free)
□ Railway account (free)
□ MongoDB Atlas account (free)
□ Supabase account (free)
□ Gemini API key (free)
□ 20 minutes of time
```

### Deploy to Vercel
```
□ Go to vercel.com
□ Import GitHub repository
□ Add all environment variables
□ Generate and add CRON_SECRET
□ Click Deploy
□ Save your Vercel URL
□ Test API endpoints
```

### Deploy to Railway
```
□ Go to railway.app
□ Create new project from GitHub
□ Add VERCEL_URL
□ Add CRON_SECRET (same as Vercel!)
□ Let Railway deploy
□ Check logs for "Cron worker started"
□ Wait for first scrape (up to 30 min)
```

### Verify Everything Works
```
□ Railway logs show cron worker running
□ Vercel logs show API calls
□ MongoDB shows new events
□ No errors in either platform
□ Test manual API call
```

---

## 🆘 Quick Troubleshooting

### Problem: "401 Unauthorized"
```
❌ CRON_SECRET doesn't match
✅ Fix: Make sure it's EXACTLY the same in both platforms
```

### Problem: "No events in database"
```
❌ Scraper might be failing
✅ Fix: Check Vercel logs for errors
✅ Fix: Verify MongoDB connection string
✅ Fix: Test /api/process manually
```

### Problem: "Railway not calling Vercel"
```
❌ VERCEL_URL might be wrong
✅ Fix: Check for trailing slash (remove it!)
✅ Fix: Verify URL is correct
✅ Fix: Test URL in browser
```

### Problem: "Cron worker crashed"
```
❌ Railway might be out of hours
✅ Fix: Check Railway dashboard
✅ Fix: Restart the service
✅ Fix: Check logs for errors
```

---

## 🎉 Success Indicators

You know it's working when:

```
✅ Railway Dashboard:
   - Status: "Active"
   - Logs show: "Cron worker started"
   - Logs show: Scraper executions every 30 min

✅ Vercel Dashboard:
   - Deployment: "Ready"
   - Functions: /api/scrape called every 30 min
   - No 5xx errors

✅ MongoDB Atlas:
   - Events collection has documents
   - Documents have all required fields
   - New events appear every 30 minutes

✅ Manual Test:
   curl -X POST https://your-app.vercel.app/api/scrape \
     -H "Authorization: Bearer your-secret"
   
   Returns: JSON with scraping results
```

---

## 📚 More Information

- **Step-by-step guide:** `DEPLOYMENT_GUIDE.md`
- **Quick reference:** `QUICK_DEPLOY.md`
- **Railway details:** `RAILWAY_DEPLOYMENT.md`
- **Architecture:** `DEPLOYMENT_ARCHITECTURE.md`
- **Ready to deploy:** `DEPLOY_NOW.md`

---

## 💡 Remember

**VERCEL** = Your application (Next.js + API routes)
**RAILWAY** = Your scheduler (runs cron-worker.js)
**CRON_SECRET** = Must be the same in both!

That's it! 🚀
