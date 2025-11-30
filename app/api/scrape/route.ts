import { NextRequest, NextResponse } from 'next/server';
import { validateCronRequest, createUnauthorizedResponse } from '@/lib/utils/auth';
import { AmarUjalaScraper } from '@/lib/scrapers/amar-ujala-scraper';
import { DainikJagranScraper } from '@/lib/scrapers/dainik-jagran-scraper';
import { LocalNewsScraper } from '@/lib/scrapers/local-news-scraper';
import { FacebookScraper } from '@/lib/scrapers/facebook-scraper';
import { InstagramScraper } from '@/lib/scrapers/instagram-scraper';
import { YouTubeScraper } from '@/lib/scrapers/youtube-scraper';
import { ScrapedArticle, ScraperResult } from '@/types';

/**
 * POST /api/scrape
 * Execute scraping pipeline for all news sources
 * Triggered by Railway Cron every 30 minutes
 */
export async function POST(request: NextRequest) {
  // Validate cron authentication
  if (!validateCronRequest(request)) {
    return createUnauthorizedResponse();
  }

  const startTime = Date.now();
  console.log('='.repeat(60));
  console.log('Starting scrape job...');
  console.log('='.repeat(60));

  try {
    // Initialize all scrapers
    const scrapers = [
      new AmarUjalaScraper(),
      new DainikJagranScraper(),
      new LocalNewsScraper(),
      new FacebookScraper(),
      new InstagramScraper(),
      new YouTubeScraper(),
    ];

    // Execute scrapers in parallel
    const results = await Promise.allSettled(
      scrapers.map(scraper => scraper.scrape())
    );

    // Collect all articles and results
    const allArticles: ScrapedArticle[] = [];
    const scraperResults: ScraperResult[] = [];
    const errors: string[] = [];

    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        const scraperResult = result.value;
        scraperResults.push(scraperResult);
        
        console.log(`✓ ${scraperResult.source}: ${scraperResult.articlesScraped} articles`);
        
        if (scraperResult.errors.length > 0) {
          errors.push(...scraperResult.errors);
        }
      } else {
        const scraperName = scrapers[index].constructor.name;
        const errorMessage = `${scraperName} failed: ${result.reason}`;
        console.error(`✗ ${errorMessage}`);
        errors.push(errorMessage);
      }
    });

    // Process each article through the AI pipeline
    let processedCount = 0;
    let failedCount = 0;

    console.log(`\nProcessing ${allArticles.length} articles...`);

    for (const article of allArticles) {
      try {
        // Call /api/process for each article
        const response = await fetch(`${process.env.VERCEL_URL || 'http://localhost:3000'}/api/process`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(article),
        });

        if (response.ok) {
          processedCount++;
        } else {
          failedCount++;
          console.error(`Failed to process article: ${article.title}`);
        }
      } catch (error) {
        failedCount++;
        console.error(`Error processing article: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    const duration = Date.now() - startTime;

    const summary = {
      success: true,
      sources: scraperResults,
      totalArticlesScraped: scraperResults.reduce((sum, r) => sum + r.articlesScraped, 0),
      articlesProcessed: processedCount,
      articlesFailed: failedCount,
      errors: errors,
      duration: `${(duration / 1000).toFixed(2)}s`,
      timestamp: new Date().toISOString(),
    };

    console.log('='.repeat(60));
    console.log('Scrape job completed:');
    console.log(`  Total scraped: ${summary.totalArticlesScraped}`);
    console.log(`  Processed: ${summary.articlesProcessed}`);
    console.log(`  Failed: ${summary.articlesFailed}`);
    console.log(`  Duration: ${summary.duration}`);
    console.log('='.repeat(60));

    return NextResponse.json(summary);
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error('='.repeat(60));
    console.error('Scrape job failed:', error);
    console.error(`Duration: ${(duration / 1000).toFixed(2)}s`);
    console.error('='.repeat(60));

    return NextResponse.json(
      {
        success: false,
        error: 'Internal Server Error',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
