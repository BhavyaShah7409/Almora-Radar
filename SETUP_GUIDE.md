# 🚀 Almora Radar - Quick Setup Guide

## Step-by-Step Setup (15-20 minutes)

### 1️⃣ MongoDB Atlas Setup (5 minutes)

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Click **"Try Free"** and create an account
3. Create a **free cluster** (M0 tier):
   - Choose **AWS** as provider
   - Select **Mumbai (ap-south-1)** region (closest to India)
   - Click **"Create Cluster"**
4. Wait for cluster to be created (~3 minutes)
5. Click **"Connect"**:
   - Add your IP address (or use `0.0.0.0/0` for all IPs)
   - Create a database user (username & password)
6. Choose **"Connect your application"**
7. Copy the connection string
8. In `.env.local`, replace:
   ```
   MONGODB_URI=mongodb+srv://YOUR_USERNAME:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/almora-radar?retryWrites=true&w=majority
   ```

---

### 2️⃣ Supabase Setup (5 minutes)

1. Go to [Supabase](https://supabase.com)
2. Click **"Start your project"** and sign up
3. Click **"New Project"**:
   - Name: `almora-radar`
   - Database Password: (create a strong password)
   - Region: **Mumbai** (closest to India)
   - Click **"Create new project"**
4. Wait for project to be created (~2 minutes)
5. Go to **Settings** → **API**:
   - Copy **Project URL**
   - Copy **anon public** key
   - Copy **service_role** key (click "Reveal" first)
6. In `.env.local`, replace:
   ```
   SUPABASE_URL=https://xxxxx.supabase.co
   SUPABASE_ANON_KEY=eyJhbGci...
   SUPABASE_SERVICE_KEY=eyJhbGci...
   NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
   ```
7. **IMPORTANT:** Run the database schema:
   - Go to **SQL Editor** in Supabase
   - Open `lib/db/supabase-schema.sql` in your project
   - Copy ALL the SQL code
   - Paste into Supabase SQL Editor
   - Click **"Run"**
   - You should see: "Success. No rows returned"

---

### 3️⃣ Google Gemini API Setup (2 minutes)

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click **"Get API Key"**
4. Click **"Create API key in new project"**
5. Copy the API key
6. In `.env.local`, replace:
   ```
   GEMINI_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
   ```

**Note:** Gemini has a generous free tier (60 requests per minute)!

---

### 4️⃣ Firebase Setup (5 minutes)

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **"Add project"**:
   - Name: `almora-radar`
   - Disable Google Analytics (not needed)
   - Click **"Create project"**
3. Go to **Project Settings** (gear icon) → **Service Accounts**
4. Click **"Generate new private key"**
5. Click **"Generate key"** (downloads a JSON file)
6. Open the downloaded JSON file
7. In `.env.local`, replace:
   ```
   FIREBASE_PROJECT_ID=your-project-id
   FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
   FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
   ```
   **Note:** Keep the quotes around FIREBASE_PRIVATE_KEY and include the `\n` characters!

8. Enable Cloud Messaging:
   - Go to **Build** → **Cloud Messaging**
   - Click **"Get Started"** if prompted

---

### 5️⃣ Install and Run (3 minutes)

```bash
# 1. Install dependencies
npm install

# 2. Create MongoDB indexes
npm run setup:mongo

# 3. Start development server
npm run dev
```

Your app should now be running at **http://localhost:3000**!

---

## ✅ Test Your Setup

### Test the API:

```bash
curl -X POST http://localhost:3000/api/process \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Article from Almora",
    "content": "This is a test article about an event in Mall Road, Almora. The incident occurred yesterday and local authorities are investigating.",
    "images": [],
    "publishTime": "2024-01-01T00:00:00Z",
    "sourceLink": "https://example.com/test-article"
  }'
```

**Expected Response:**
- Status: 201 Created
- JSON with processed event including:
  - English and Hindi summaries
  - Category classification
  - GPS coordinates for Almora
  - Priority score

### Test Events API:

```bash
# Get all events
curl http://localhost:3000/api/events

# Get events by category
curl http://localhost:3000/api/events?category=accident
```

---

## 🎉 Success Checklist

- [ ] MongoDB Atlas cluster created and connected
- [ ] Supabase project created with SQL schema loaded
- [ ] Gemini API key obtained
- [ ] Firebase project created with service account
- [ ] All environment variables in `.env.local`
- [ ] `npm install` completed successfully
- [ ] `npm run setup:mongo` created indexes
- [ ] `npm run dev` starts without errors
- [ ] Test API call returns processed article

---

## 🐛 Troubleshooting

### MongoDB Connection Error
```
Error: MongoServerError: bad auth
```
**Solution:** Check username and password in MONGODB_URI are correct

### Supabase Error
```
Error: Invalid API key
```
**Solution:** Make sure you copied the correct keys from Settings → API

### Gemini API Error
```
Error: API key not valid
```
**Solution:** Get a new API key from Google AI Studio

### Firebase Error
```
Error: Failed to parse private key
```
**Solution:** Make sure FIREBASE_PRIVATE_KEY has quotes and includes `\n` characters

---

## 📚 Next Steps

Once everything is working:

1. **Deploy to Vercel:**
   - Push code to GitHub (already done!)
   - Go to [Vercel](https://vercel.com)
   - Import your GitHub repository
   - Add all environment variables
   - Deploy!

2. **Continue Development:**
   - Check `COMPLETION_GUIDE.md` for remaining features
   - Implement scrapers
   - Build frontend components
   - Add PWA features

3. **Monitor Your Services:**
   - MongoDB Atlas: Check database usage
   - Supabase: Monitor auth and database
   - Gemini API: Track API usage
   - Firebase: Monitor notification delivery

---

## 💰 Cost Breakdown

All services are **100% FREE** for development:

| Service | Free Tier | Limits |
|---------|-----------|--------|
| MongoDB Atlas | M0 Cluster | 512MB storage |
| Supabase | Free tier | 500MB database, 2GB bandwidth |
| Gemini API | Free tier | 60 requests/minute |
| Firebase | Spark plan | 20K messages/day |
| Vercel | Hobby tier | 100GB bandwidth |

**Total Cost: $0/month** for development and small-scale production! 🎉

---

## 🆘 Need Help?

- Check `README.md` for project overview
- Check `COMPLETION_GUIDE.md` for implementation details
- Check `FINAL_STATUS.md` for current project status
- Open an issue on GitHub

---

**Happy Coding! 🚀**
