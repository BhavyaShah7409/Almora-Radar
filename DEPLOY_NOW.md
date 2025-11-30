# Deploy Almora Radar Backend - Quick Start Guide

## ✅ What's Ready to Deploy

The **complete backend infrastructure** is ready for production deployment:

- ✅ Automated news scraping (6 sources)
- ✅ AI processing with Gemini
- ✅ Geocoding with Nominatim
- ✅ MongoDB Atlas storage
- ✅ Supabase integration
- ✅ Railway cron jobs
- ✅ Error handling & logging

## 🚀 Deployment Steps

### Step 1: Deploy to Vercel (5 minutes)

```bash
# 1. Push to GitHub (if not already done)
git add .
git commit -m "Backend infrastructure complete"
git push origin main

# 2. Go to vercel.com and import your repository
# 3. Configure environment variables (see below)
# 4. Deploy
```

### Step 2: Configure Vercel Environment Variables

Add these in Vercel Dashboard → Settings → Environment Variables:

```bash
# Database
MONGODB_URI=your_mongodb_connection_string
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_KEY=your_supabase_service_key

# AI & Services
GEMINI_API_KEY=your_gemini_api_key

# Firebase (for future notifications)
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_PRIVATE_KEY=your_private_key
FIREBASE_CLIENT_EMAIL=your_client_email

# Public (client-side)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Cron Authentication
CRON_SECRET=generate_a_secure_random_token_here
```

### Step 3: Deploy Railway Cron Worker (10 minutes)

```bash
# 1. Go to railway.app
# 2. Create new project from GitHub repo
# 3. Railway will auto-detect railway.json
# 4. Add environment variables:

VERCEL_URL=https://your-app.vercel.app
CRON_SECRET=same_token_as_vercel

# 5. Deploy
```

### Step 4: Verify Deployment (5 minutes)

```bash
# Test the scraper endpoint
curl -X POST https://your-app.vercel.app/api/scrape \
  -H "Authorization: Bearer your_cron_secret" \
  -H "Content-Type: application/json"

# Test the cleanup endpoint
curl -X POST https://your-app.vercel.app/api/cleanup \
  -H "Authorization: Bearer your_cron_secret" \
  -H "Content-Type: application/json"

# Test the process endpoint
curl -X POST https://your-app.vercel.app/api/process \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Article",
    "content": "This is a test article about Almora with enough content to process.",
    "images": [],
    "publishTime": "2024-01-30T12:00:00Z",
    "sourceLink": "https://example.com/test"
  }'
```

## 📊 What Happens After Deployment

### Automatic Operations:

1. **Every 30 Minutes:**
   - Railway triggers scraper
   - Fetches news from 6 sources
   - Processes with AI
   - Stores in MongoDB
   - Logs results

2. **Daily at Midnight UTC:**
   - Railway triggers cleanup
   - Deletes events older than 15 days
   - Removes associated comments
   - Logs results

### Monitoring:

- **Vercel Dashboard:** View API logs and performance
- **Railway Dashboard:** View cron job execution logs
- **MongoDB Atlas:** Monitor database size and queries
- **Supabase Dashboard:** Monitor database and auth

## 🔍 Verify It's Working

### Check Railway Logs:
```
Look for:
✓ Almora Radar - Cron Worker
✓ Cron jobs scheduled
✓ Scraper: */30 * * * *
✓ Cleanup: 0 0 * * *
```

### Check Vercel Logs:
```
Look for:
✓ POST /api/scrape - 200
✓ Scraper job completed
✓ Articles processed: X
```

### Check MongoDB:
```
Look for:
✓ New events appearing in 'events' collection
✓ Events have all required fields
✓ Coordinates are valid
```

## ⚠️ Important Notes

### What Works:
- ✅ Backend API endpoints
- ✅ Automated scraping
- ✅ AI processing
- ✅ Data storage
- ✅ Cron jobs

### What Doesn't Work Yet:
- ❌ No frontend UI (users can't see anything)
- ❌ No authentication (can't create accounts)
- ❌ No map visualization
- ❌ No user features

### This Deployment Is For:
- ✅ Starting data collection
- ✅ Testing the scraping pipeline
- ✅ Validating AI processing
- ✅ Monitoring system performance
- ✅ Building up event database

## 🎯 Next Steps After Deployment

### Immediate (Week 1):
1. Monitor logs for errors
2. Verify data quality in MongoDB
3. Check scraper success rates
4. Adjust scraper configurations if needed

### Short-term (Week 2-3):
1. Build basic frontend to view events
2. Create simple map visualization
3. Add event listing page
4. Deploy frontend MVP

### Medium-term (Month 1-2):
1. Add user authentication
2. Implement user preferences
3. Add comments functionality
4. Build PWA features

## 📞 Troubleshooting

### Scraper Not Running:
- Check Railway logs
- Verify VERCEL_URL is correct
- Verify CRON_SECRET matches

### API Errors:
- Check Vercel logs
- Verify environment variables
- Test MongoDB connection
- Test Gemini API key

### No Data in Database:
- Check scraper logs
- Verify news sources are accessible
- Check AI processing logs
- Verify MongoDB connection

## 💰 Cost Estimate

### Free Tier (Current Setup):
- Vercel: $0/month (100GB bandwidth)
- Railway: $0/month (500 hours)
- MongoDB Atlas: $0/month (512MB)
- Supabase: $0/month (500MB)
- Gemini API: $0/month (free tier)
- **Total: $0/month**

### If Scaling Needed:
- Railway Hobby: $5/month
- MongoDB M2: $9/month
- Supabase Pro: $25/month
- **Total: ~$39/month**

## ✅ Deployment Checklist

- [ ] Code pushed to GitHub
- [ ] Vercel project created
- [ ] Vercel environment variables configured
- [ ] Vercel deployment successful
- [ ] Railway project created
- [ ] Railway environment variables configured
- [ ] Railway deployment successful
- [ ] Test /api/scrape endpoint
- [ ] Test /api/process endpoint
- [ ] Test /api/cleanup endpoint
- [ ] Verify Railway cron logs
- [ ] Verify Vercel API logs
- [ ] Check MongoDB for new events
- [ ] Monitor for 24 hours
- [ ] Document any issues

## 🎉 Success Criteria

Your deployment is successful when:

1. ✅ Railway cron worker shows "running"
2. ✅ Scraper executes every 30 minutes
3. ✅ New events appear in MongoDB
4. ✅ Events have valid coordinates
5. ✅ AI summaries are generated
6. ✅ No critical errors in logs
7. ✅ Cleanup runs daily at midnight

---

**Ready to deploy?** Follow the steps above and you'll have a working backend in ~20 minutes!

**Questions?** Check the comprehensive guides:
- `RAILWAY_DEPLOYMENT.md` - Detailed Railway setup
- `DEPLOYMENT_ARCHITECTURE.md` - System architecture
- `SETUP_GUIDE.md` - Local development setup
