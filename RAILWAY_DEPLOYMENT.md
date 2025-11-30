# Railway Deployment Guide for Cron Jobs

This guide explains how to deploy the cron worker to Railway for scheduled tasks.

## Why Railway?

Vercel has limitations on cron job frequency in the free tier. Railway provides:
- Free tier with 500 hours/month
- Support for any cron schedule (including every 30 minutes)
- Simple deployment from GitHub
- Automatic restarts on failure

## Prerequisites

1. GitHub account with your Almora Radar repository
2. Railway account (sign up at https://railway.app)
3. Vercel deployment URL (e.g., `https://almora-radar.vercel.app`)
4. Secure CRON_SECRET token

## Step 1: Generate CRON_SECRET

Generate a secure random token for authenticating cron requests:

```bash
# On Linux/Mac:
openssl rand -hex 32

# On Windows (PowerShell):
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))

# Or use an online generator:
# https://www.random.org/strings/
```

Save this token - you'll need it for both Vercel and Railway.

## Step 2: Add CRON_SECRET to Vercel

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add new variable:
   - **Name:** `CRON_SECRET`
   - **Value:** Your generated token
   - **Environments:** Production, Preview, Development
4. Click **Save**
5. Redeploy your application for changes to take effect

## Step 3: Deploy to Railway

### Option A: Deploy from GitHub (Recommended)

1. Go to https://railway.app and sign in
2. Click **New Project**
3. Select **Deploy from GitHub repo**
4. Authorize Railway to access your GitHub account
5. Select your `almora-radar` repository
6. Railway will automatically detect the `railway.json` configuration

### Option B: Deploy using Railway CLI

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login

# Initialize project
railway init

# Deploy
railway up
```

## Step 4: Configure Railway Environment Variables

1. In your Railway project dashboard, go to **Variables**
2. Add the following environment variables:

   ```
   VERCEL_URL=https://your-app.vercel.app
   CRON_SECRET=your-generated-token-from-step-1
   ```

3. Click **Deploy** to apply changes

## Step 5: Verify Deployment

### Check Railway Logs

1. Go to your Railway project dashboard
2. Click on the **Deployments** tab
3. View the logs to confirm the cron worker started:

```
=============================================================
Almora Radar - Cron Worker
=============================================================
Target URL: https://your-app.vercel.app
Started at: 2024-01-30T12:00:00.000Z
=============================================================

Cron jobs scheduled:
  ✓ Scraper: */30 * * * * (every 30 minutes)
  ✓ Cleanup: 0 0 * * * (daily at midnight UTC)

Worker is running. Press Ctrl+C to stop.
```

### Test Cron Endpoints Manually

You can test the endpoints manually to ensure they work:

```bash
# Test scraper endpoint
curl -X POST https://your-app.vercel.app/api/scrape \
  -H "Authorization: Bearer your-cron-secret" \
  -H "Content-Type: application/json"

# Test cleanup endpoint
curl -X POST https://your-app.vercel.app/api/cleanup \
  -H "Authorization: Bearer your-cron-secret" \
  -H "Content-Type: application/json"
```

Expected response (200 OK):
```json
{
  "success": true,
  "message": "...",
  "timestamp": "2024-01-30T12:00:00.000Z"
}
```

## Step 6: Monitor Cron Jobs

### Railway Dashboard

- View real-time logs in the Railway dashboard
- Check deployment status and resource usage
- Monitor for errors or failures

### Vercel Logs

- Check Vercel logs for API endpoint calls
- Verify scraper and cleanup jobs are executing
- Monitor for any errors in processing

## Cron Schedule

The worker runs two jobs:

1. **Scraper Job**
   - Schedule: `*/30 * * * *` (every 30 minutes)
   - Endpoint: `POST /api/scrape`
   - Purpose: Fetch and process news from all sources

2. **Cleanup Job**
   - Schedule: `0 0 * * *` (daily at midnight UTC)
   - Endpoint: `POST /api/cleanup`
   - Purpose: Delete events older than 15 days

## Troubleshooting

### Worker Not Starting

**Problem:** Railway deployment fails or worker doesn't start

**Solutions:**
- Check Railway logs for error messages
- Verify `railway.json` is in the repository root
- Ensure `cron-worker.js` exists and is executable
- Check that `node-cron` is in `package.json` dependencies

### Authentication Errors (401 Unauthorized)

**Problem:** Cron jobs return 401 Unauthorized

**Solutions:**
- Verify `CRON_SECRET` matches in both Vercel and Railway
- Check that the secret doesn't have extra spaces or quotes
- Ensure Vercel environment variables are deployed (redeploy if needed)
- Test manually with curl to isolate the issue

### Jobs Not Executing

**Problem:** Cron jobs scheduled but not running

**Solutions:**
- Check Railway logs for cron execution attempts
- Verify `VERCEL_URL` is correct (no trailing slash)
- Ensure Railway service is running (not sleeping)
- Check Railway free tier hours remaining

### Network/Timeout Errors

**Problem:** Requests to Vercel timeout or fail

**Solutions:**
- Verify Vercel deployment is live and accessible
- Check Vercel function timeout limits (10s on free tier)
- Ensure MongoDB and Supabase are accessible from Vercel
- Check for rate limiting on external APIs (Gemini, Nominatim)

## Cost Considerations

### Railway Free Tier

- **500 execution hours per month**
- **$5 credit per month**
- Cron worker uses minimal resources (~1 hour/day = 30 hours/month)
- Well within free tier limits

### Upgrading

If you exceed free tier limits:
- Railway Hobby Plan: $5/month for 500 hours
- Railway Pro Plan: $20/month for unlimited hours

## Alternative: Self-Hosted Cron

If you prefer not to use Railway, you can run the cron worker anywhere:

```bash
# On your own server
git clone https://github.com/your-username/almora-radar.git
cd almora-radar
npm install
export VERCEL_URL=https://your-app.vercel.app
export CRON_SECRET=your-secret
node cron-worker.js
```

Use a process manager like PM2 to keep it running:

```bash
npm install -g pm2
pm2 start cron-worker.js --name almora-cron
pm2 save
pm2 startup
```

## Security Best Practices

1. **Never commit CRON_SECRET to Git**
   - Use environment variables only
   - Rotate the secret periodically

2. **Use HTTPS only**
   - Vercel enforces HTTPS automatically
   - Railway supports HTTPS by default

3. **Monitor for suspicious activity**
   - Check logs for unauthorized access attempts
   - Set up alerts for repeated 401 errors

4. **Limit API access**
   - Only allow cron endpoints to be called with valid token
   - Consider IP whitelisting if Railway provides static IPs

## Support

- Railway Documentation: https://docs.railway.app
- Railway Discord: https://discord.gg/railway
- Vercel Documentation: https://vercel.com/docs

## Next Steps

After successful deployment:

1. ✅ Verify cron jobs are running on schedule
2. ✅ Monitor logs for the first 24 hours
3. ✅ Check that events are being scraped and stored
4. ✅ Verify cleanup job runs at midnight UTC
5. ✅ Set up monitoring/alerting for failures
