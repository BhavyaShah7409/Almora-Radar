/**
 * Railway Cron Worker
 * 
 * This worker runs on Railway and triggers cron jobs by calling
 * the Vercel-hosted API endpoints at scheduled intervals.
 * 
 * Railway is used because Vercel has limitations on cron frequency
 * (cannot run every 30 minutes on free tier).
 */

const cron = require('node-cron');

const VERCEL_URL = process.env.VERCEL_URL || process.env.NEXT_PUBLIC_VERCEL_URL;
const CRON_SECRET = process.env.CRON_SECRET;

if (!VERCEL_URL) {
  console.error('ERROR: VERCEL_URL environment variable is not set');
  process.exit(1);
}

if (!CRON_SECRET) {
  console.error('ERROR: CRON_SECRET environment variable is not set');
  process.exit(1);
}

console.log('='.repeat(60));
console.log('Almora Radar - Cron Worker');
console.log('='.repeat(60));
console.log(`Target URL: ${VERCEL_URL}`);
console.log(`Started at: ${new Date().toISOString()}`);
console.log('='.repeat(60));

/**
 * Scraper Job - Runs every 30 minutes
 * Fetches news from multiple sources and processes them
 */
cron.schedule('*/30 * * * *', async () => {
  const timestamp = new Date().toISOString();
  console.log(`\n[${timestamp}] Starting scraper job...`);
  
  try {
    const response = await fetch(`${VERCEL_URL}/api/scrape`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CRON_SECRET}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    console.log(`[${timestamp}] Scraper job completed successfully`);
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error(`[${timestamp}] Scraper job failed:`, error.message);
    console.error(error.stack);
  }
});

/**
 * Cleanup Job - Runs daily at midnight UTC
 * Deletes events older than 15 days
 */
cron.schedule('0 0 * * *', async () => {
  const timestamp = new Date().toISOString();
  console.log(`\n[${timestamp}] Starting cleanup job...`);
  
  try {
    const response = await fetch(`${VERCEL_URL}/api/cleanup`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CRON_SECRET}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    console.log(`[${timestamp}] Cleanup job completed successfully`);
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error(`[${timestamp}] Cleanup job failed:`, error.message);
    console.error(error.stack);
  }
});

console.log('\nCron jobs scheduled:');
console.log('  ✓ Scraper: */30 * * * * (every 30 minutes)');
console.log('  ✓ Cleanup: 0 0 * * * (daily at midnight UTC)');
console.log('\nWorker is running. Press Ctrl+C to stop.\n');

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('\nReceived SIGTERM signal');
  console.log('Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('\nReceived SIGINT signal');
  console.log('Shutting down gracefully...');
  process.exit(0);
});

// Keep the process alive
setInterval(() => {
  // Heartbeat log every hour
  const now = new Date();
  if (now.getMinutes() === 0) {
    console.log(`[${now.toISOString()}] Cron worker heartbeat - still running`);
  }
}, 60000); // Check every minute
