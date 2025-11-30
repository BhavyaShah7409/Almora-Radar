/**
 * Base Scraper Class
 * 
 * Abstract base class for all news scrapers with common functionality:
 * - Error handling and logging
 * - Timeout handling (30 seconds per source)
 * - Retry logic with exponential backoff
 * - Standard interface for all scrapers
 */

import { ScrapedArticle, ScraperResult } from '@/types';

export interface ScraperConfig {
  name: string;
  url: string;
  timeout?: number; // milliseconds
  maxRetries?: number;
  retryDelay?: number; // milliseconds
}

export abstract class BaseScraper {
  protected config: ScraperConfig;
  protected errors: string[] = [];

  constructor(config: ScraperConfig) {
    this.config = {
      timeout: 30000, // 30 seconds default
      maxRetries: 3,
      retryDelay: 1000, // 1 second default
      ...config,
    };
  }

  /**
   * Abstract method to be implemented by each scraper
   * Fetches and parses content from the source
   */
  protected abstract fetchContent(): Promise<ScrapedArticle[]>;

  /**
   * Main scraping method with error handling and timeout
   */
  async scrape(): Promise<ScraperResult> {
    const startTime = Date.now();
    let articles: ScrapedArticle[] = [];

    try {
      this.log('info', `Starting scrape from ${this.config.name}`);

      // Execute with timeout
      articles = await this.executeWithTimeout(
        this.fetchContent(),
        this.config.timeout!
      );

      this.log('info', `Successfully scraped ${articles.length} articles from ${this.config.name}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.handleError(`Scraping failed: ${errorMessage}`);
    }

    const duration = Date.now() - startTime;
    this.log('info', `Scrape completed in ${duration}ms`);

    return {
      source: this.config.name,
      articlesScraped: articles.length,
      errors: this.errors,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Execute a promise with timeout
   */
  protected async executeWithTimeout<T>(
    promise: Promise<T>,
    timeoutMs: number
  ): Promise<T> {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Timeout after ${timeoutMs}ms`));
      }, timeoutMs);
    });

    return Promise.race([promise, timeoutPromise]);
  }

  /**
   * Fetch HTML content with retry logic
   */
  protected async fetchHTML(url: string): Promise<string> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.config.maxRetries!; attempt++) {
      try {
        this.log('info', `Fetching ${url} (attempt ${attempt}/${this.config.maxRetries})`);

        const response = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const html = await response.text();
        return html;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        this.log('warn', `Fetch attempt ${attempt} failed: ${lastError.message}`);

        // Wait before retry (exponential backoff)
        if (attempt < this.config.maxRetries!) {
          const delay = this.config.retryDelay! * Math.pow(2, attempt - 1);
          await this.sleep(delay);
        }
      }
    }

    throw lastError || new Error('Failed to fetch HTML');
  }

  /**
   * Validate scraped article has all required fields
   */
  protected validateArticle(article: Partial<ScrapedArticle>): article is ScrapedArticle {
    const required: (keyof ScrapedArticle)[] = [
      'title',
      'content',
      'images',
      'publishTime',
      'sourceLink',
    ];

    for (const field of required) {
      if (!article[field]) {
        this.handleError(`Missing required field: ${field}`);
        return false;
      }
    }

    // Validate content is not empty
    if (typeof article.content === 'string' && article.content.trim().length === 0) {
      this.handleError('Article content is empty');
      return false;
    }

    // Validate images is an array
    if (!Array.isArray(article.images)) {
      this.handleError('Images must be an array');
      return false;
    }

    return true;
  }

  /**
   * Clean and normalize text content
   */
  protected cleanText(text: string): string {
    return text
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .replace(/\n+/g, '\n') // Replace multiple newlines with single newline
      .trim();
  }

  /**
   * Extract absolute URL from relative URL
   */
  protected resolveUrl(relativeUrl: string, baseUrl: string): string {
    try {
      return new URL(relativeUrl, baseUrl).href;
    } catch (error) {
      this.handleError(`Invalid URL: ${relativeUrl}`);
      return relativeUrl;
    }
  }

  /**
   * Handle and log errors
   */
  protected handleError(message: string): void {
    this.errors.push(message);
    this.log('error', message);
  }

  /**
   * Log messages with structured format
   */
  protected log(level: 'info' | 'warn' | 'error', message: string): void {
    const logEntry = {
      level,
      scraper: this.config.name,
      message,
      timestamp: new Date().toISOString(),
    };

    if (level === 'error') {
      console.error(JSON.stringify(logEntry));
    } else if (level === 'warn') {
      console.warn(JSON.stringify(logEntry));
    } else {
      console.log(JSON.stringify(logEntry));
    }
  }

  /**
   * Sleep utility for delays
   */
  protected sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Parse date string to ISO format
   */
  protected parseDate(dateString: string): string {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        throw new Error('Invalid date');
      }
      return date.toISOString();
    } catch (error) {
      this.handleError(`Failed to parse date: ${dateString}`);
      // Return current date as fallback
      return new Date().toISOString();
    }
  }
}
