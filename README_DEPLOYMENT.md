# Almora Radar - Deployment Summary

## 🎯 Simple Answer to "What Goes Where?"

### VERCEL gets: **The Entire Next.js Application**
- All your code except `cron-worker.js`
- Runs as a web server
- Provides API endpoints
- Hosts frontend (when built)

### RAILWAY gets: **Only the Cron Worker**
- Just `cron-worker.js`
- Runs as a background process
- Calls Vercel API endpoints on schedule
- Doesn't serve any web pages

---

## 📋 Quick Deployment Steps

### 1. Vercel (2 minutes)
```
1. Go to vercel.com
2. Click "Import Project"
3. Select your GitHub repo
4. Add environment variables
5. Deploy
```

### 2. Railway (2 minutes)
```
1. Go to railway.app
2. Click "New Project" → "Deploy from GitHub"
3. Select your repo
4. Add VERCEL_URL and CRON_SECRET
5. Deploy
```

### 3. Done! ✅
```
Railway will now call Vercel every 30 minutes
Vercel will scrape news and store in MongoDB
```

---

## 📚 Documentation Files

Choose based on your needs:

| File | Best For | Time |
|------|----------|------|
| `QUICK_DEPLOY.md` | Just want to deploy fast | 2 min read |
| `DEPLOYMENT_VISUAL.md` | Visual learner, want diagrams | 5 min read |
| `DEPLOYMENT_GUIDE.md` | Complete step-by-step guide | 15 min read |
| `RAILWAY_DEPLOYMENT.md` | Railway-specific details | 10 min read |
| `DEPLOY_NOW.md` | Ready to deploy right now | 5 min read |

---

## 🔑 Key Concepts

### Why Two Platforms?

**Vercel:**
- Great for Next.js apps
- Serverless functions
- ❌ Can't run cron jobs every 30 minutes (free tier limitation)

**Railway:**
- Great for background processes
- Can run any schedule
- ✅ Runs cron jobs every 30 minutes

### How They Work Together

```
Railway (Timer) → Calls → Vercel (Worker) → Stores → MongoDB
     ⏰                      🔧                  💾
```

---

## ⚠️ Critical: CRON_SECRET

The `CRON_SECRET` must be:
- ✅ The same in both Vercel AND Railway
- ✅ A random 32+ character string
- ✅ Kept secret (never commit to Git)

Generate one:
```bash
openssl rand -hex 32
```

---

## 🎉 What You Get

After deployment, your system will:
- ✅ Scrape news every 30 minutes automatically
- ✅ Process articles with AI
- ✅ Store events in MongoDB
- ✅ Clean up old data daily
- ✅ Run 24/7 without manual intervention

---

## 🆘 Need Help?

1. **Quick answer:** Read `QUICK_DEPLOY.md`
2. **Visual guide:** Read `DEPLOYMENT_VISUAL.md`
3. **Detailed steps:** Read `DEPLOYMENT_GUIDE.md`
4. **Troubleshooting:** Check the troubleshooting sections in any guide

---

## 🚀 Ready to Deploy?

Start with: `QUICK_DEPLOY.md` or `DEPLOYMENT_VISUAL.md`

Good luck! 🎯
