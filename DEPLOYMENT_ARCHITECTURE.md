# Deployment Architecture

## Overview

Almora Radar uses a hybrid deployment architecture:
- **Vercel**: Hosts the Next.js application (frontend + API routes)
- **Railway**: Runs cron jobs for scheduled tasks

This separation is necessary because Vercel's free tier has limitations on cron job frequency.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     Railway (Cron Worker)                    │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │  cron-worker.js (Node.js Process)                  │    │
│  │                                                      │    │
│  │  - Scraper Job: */30 * * * * (every 30 min)       │    │
│  │  - Cleanup Job: 0 0 * * * (daily at midnight)     │    │
│  │                                                      │    │
│  │  Sends authenticated HTTP requests ──────────┐     │    │
│  └──────────────────────────────────────────────┼─────┘    │
└─────────────────────────────────────────────────┼──────────┘
                                                   │
                                                   │ POST with
                                                   │ Bearer token
                                                   ▼
┌─────────────────────────────────────────────────────────────┐
│                    Vercel (Next.js App)                      │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │  API Routes                                         │    │
│  │                                                      │    │
│  │  POST /api/scrape  ◄─── Validates CRON_SECRET     │    │
│  │  POST /api/cleanup ◄─── Validates CRON_SECRET     │    │
│  │                                                      │    │
│  │  GET  /api/events                                   │    │
│  │  POST /api/process                                  │    │
│  │  ... (other routes)                                 │    │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │  Frontend (React + Next.js)                         │    │
│  │  - Interactive map                                   │    │
│  │  - User authentication                               │    │
│  │  - Search and filters                                │    │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                    │              │              │
                    ▼              ▼              ▼
        ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
        │   MongoDB    │  │   Supabase   │  │   Firebase   │
        │    Atlas     │  │              │  │     FCM      │
        └──────────────┘  └──────────────┘  └──────────────┘
```

## Components

### 1. Vercel (Primary Application)

**Purpose:** Hosts the main Next.js application

**Responsibilities:**
- Serve frontend React application
- Handle API routes for events, auth, comments, etc.
- Process scraped articles with AI
- Store events in MongoDB
- Manage user authentication via Supabase
- Send push notifications via Firebase

**Deployment:**
- Automatic deployment from GitHub
- Serverless functions for API routes
- Edge network for global distribution
- Free tier: 100GB bandwidth, unlimited requests

### 2. Railway (Cron Worker)

**Purpose:** Execute scheduled tasks

**Responsibilities:**
- Run scraper job every 30 minutes
- Run cleanup job daily at midnight UTC
- Call Vercel API endpoints with authentication
- Log execution results
- Retry on failure

**Deployment:**
- Deploys `cron-worker.js` as a long-running Node.js process
- Uses `node-cron` library for scheduling
- Automatic restarts on failure
- Free tier: 500 hours/month (~$5 credit)

### 3. External Services

**MongoDB Atlas:**
- Stores news events
- Free tier: 512MB storage

**Supabase:**
- User authentication
- User preferences
- Comments storage
- Free tier: 500MB database

**Firebase:**
- Push notifications (FCM)
- Free tier: 20K messages/day

**Google Gemini:**
- AI content processing
- Free tier with rate limits

**Nominatim:**
- Geocoding service
- Free, no API key required

## Authentication Flow

### Cron Job Authentication

1. Railway cron worker sends POST request to Vercel
2. Request includes `Authorization: Bearer <CRON_SECRET>` header
3. Vercel API route validates the token using `validateCronRequest()`
4. If valid, executes the job
5. If invalid, returns 401 Unauthorized

**Security:**
- `CRON_SECRET` is a shared secret between Railway and Vercel
- Must be a cryptographically secure random string
- Stored as environment variable (never in code)
- Should be rotated periodically

## Environment Variables

### Vercel Environment Variables

```bash
# Database
MONGODB_URI=mongodb+srv://...
SUPABASE_URL=https://...
SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_KEY=...

# AI & Services
GEMINI_API_KEY=...
FIREBASE_PROJECT_ID=...
FIREBASE_PRIVATE_KEY=...
FIREBASE_CLIENT_EMAIL=...

# Public (client-side)
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...

# Cron Authentication
CRON_SECRET=<secure-random-token>
```

### Railway Environment Variables

```bash
# Target URL
VERCEL_URL=https://your-app.vercel.app

# Authentication
CRON_SECRET=<same-token-as-vercel>
```

## Cron Jobs

### Scraper Job

**Schedule:** `*/30 * * * *` (every 30 minutes)

**Process:**
1. Railway triggers at scheduled time
2. Sends POST to `https://your-app.vercel.app/api/scrape`
3. Vercel validates authentication
4. Scraper fetches news from all sources
5. Each article is processed via `/api/process`
6. Results logged and returned

**Timeout:** 5 minutes

### Cleanup Job

**Schedule:** `0 0 * * *` (daily at midnight UTC)

**Process:**
1. Railway triggers at midnight UTC
2. Sends POST to `https://your-app.vercel.app/api/cleanup`
3. Vercel validates authentication
4. Identifies events older than 15 days
5. Deletes events from MongoDB
6. Deletes associated comments from Supabase
7. Results logged and returned

**Timeout:** 1 minute

## Monitoring

### Railway Monitoring

- View logs in Railway dashboard
- Check deployment status
- Monitor resource usage
- Set up alerts for failures

### Vercel Monitoring

- Vercel Analytics for performance
- Function logs for API calls
- Error tracking
- Bandwidth usage

### Database Monitoring

- MongoDB Atlas dashboard
- Supabase dashboard
- Firebase Console

## Scaling Considerations

### Current Limits (Free Tier)

- **Vercel:** 100GB bandwidth/month
- **Railway:** 500 hours/month (~$5 credit)
- **MongoDB:** 512MB storage
- **Supabase:** 500MB database, 50K MAU
- **Firebase:** 20K messages/day

### When to Scale

- MongoDB storage > 400MB (80% capacity)
- Supabase database > 400MB (80% capacity)
- Railway hours > 400/month (80% capacity)
- Daily events > 500
- Concurrent users > 1000

### Scaling Options

1. **Upgrade MongoDB** to M2 tier ($9/month) for 2GB
2. **Upgrade Supabase** to Pro ($25/month) for 8GB
3. **Upgrade Railway** to Hobby ($5/month) for 500 hours
4. **Implement caching** to reduce database queries
5. **Optimize scraping** to reduce processing time
6. **Archive old data** to cold storage

## Cost Breakdown

### Free Tier (Current)

- Vercel: $0
- Railway: $0 (within 500 hours)
- MongoDB Atlas: $0
- Supabase: $0
- Firebase: $0
- **Total: $0/month**

### If Scaling Needed

- Vercel: $0 (still within limits)
- Railway Hobby: $5/month
- MongoDB M2: $9/month
- Supabase Pro: $25/month
- Firebase: $0 (still within limits)
- **Total: ~$39/month**

## Disaster Recovery

### Railway Failure

If Railway goes down:
- Cron jobs won't execute
- Application continues to work normally
- Manual trigger: `curl -X POST https://your-app.vercel.app/api/scrape -H "Authorization: Bearer <token>"`
- Alternative: Run cron-worker.js locally or on another server

### Vercel Failure

If Vercel goes down:
- Entire application is unavailable
- Railway cron jobs will fail (but retry)
- Wait for Vercel to recover
- Alternative: Deploy to another platform (Netlify, AWS, etc.)

### Database Failure

If MongoDB or Supabase fails:
- Application degrades gracefully
- Show cached data if available
- Display error messages to users
- Wait for service recovery

## Security Best Practices

1. **Never commit secrets to Git**
   - Use `.env.local` for local development
   - Use platform environment variables for production

2. **Rotate CRON_SECRET regularly**
   - Update in both Vercel and Railway
   - Use strong random tokens (32+ characters)

3. **Monitor for unauthorized access**
   - Check logs for 401 errors
   - Set up alerts for suspicious activity

4. **Use HTTPS only**
   - Enforced by both Vercel and Railway
   - Never send secrets over HTTP

5. **Implement rate limiting**
   - Prevent abuse of API endpoints
   - Use Vercel Edge Config or Redis

## Troubleshooting

See [RAILWAY_DEPLOYMENT.md](./RAILWAY_DEPLOYMENT.md) for detailed troubleshooting guide.

## Future Improvements

1. **Add health checks**
   - Endpoint to verify system status
   - Monitor from external service (UptimeRobot, etc.)

2. **Implement alerting**
   - Email/SMS alerts for failures
   - Integration with PagerDuty or similar

3. **Add metrics dashboard**
   - Track scraping success rate
   - Monitor processing times
   - Visualize system health

4. **Implement backup strategy**
   - Regular MongoDB backups
   - Supabase automatic backups
   - Export critical data periodically

5. **Consider multi-region deployment**
   - Deploy to multiple Vercel regions
   - Use CDN for static assets
   - Improve global performance
