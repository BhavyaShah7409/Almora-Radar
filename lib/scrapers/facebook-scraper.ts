/**
 * Facebook Public Pages Scraper
 * 
 * Scrapes public posts from Facebook pages related to Almora/Kumaon
 * Note: This scraper uses public HTML parsing (no API required)
 * Facebook's structure changes frequently, so this may need updates
 */

import * as cheerio from 'cheerio';
import { BaseScraper, ScraperConfig } from './base-scraper';
import { ScrapedArticle } from '@/types';

// List of public Facebook pages to monitor
const FACEBOOK_PAGES = [
  'AlmoraNews',
  'KumaonNews',
  'UttarakhandNews',
];

export class FacebookScraper extends BaseScraper {
  private pages: string[];

  constructor(pages: string[] = FACEBOOK_PAGES) {
    super({
      name: 'Facebook Public Pages',
      url: 'https://www.facebook.com',
      timeout: 30000,
      maxRetries: 3,
      retryDelay: 1000,
    });
    this.pages = pages;
  }

  protected async fetchContent(): Promise<ScrapedArticle[]> {
    const allArticles: ScrapedArticle[] = [];

    this.log('warn', 'Facebook scraping is limited due to dynamic content loading');
    this.log('info', 'Consider using Facebook Graph API for better results');

    // Note: Facebook uses heavy JavaScript rendering
    // This basic scraper may have limited success
    // For production, consider using:
    // 1. Facebook Graph API (requires app registration)
    // 2. Puppeteer/Playwright for JavaScript rendering
    // 3. Third-party services like RapidAPI

    for (const page of this.pages) {
      try {
        this.log('info', `Attempting to scrape Facebook page: ${page}`);
        const articles = await this.scrapePage(page);
        allArticles.push(...articles);
      } catch (error) {
        this.handleError(`Failed to scrape Facebook page ${page}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    return allArticles;
  }

  /**
   * Scrape a Facebook page
   * Note: This is a basic implementation that may not work reliably
   */
  private async scrapePage(pageName: string): Promise<ScrapedArticle[]> {
    const articles: ScrapedArticle[] = [];

    try {
      const url = `${this.config.url}/${pageName}`;
      const html = await this.fetchHTML(url);
      const $ = cheerio.load(html);

      // Facebook's HTML structure is complex and changes frequently
      // This is a simplified approach that may need updates

      // Try to find post containers
      const posts = $('[data-testid="post_message"], .userContentWrapper, ._5pbx');

      posts.each((index, element) => {
        if (index >= 5) return; // Limit to 5 posts per page

        try {
          const $post = $(element);
          
          // Extract text content
          const content = $post.text().trim();
          if (!content || content.length < 50) return;

          // Extract images
          const images: string[] = [];
          $post.find('img').each((_, img) => {
            const src = $(img).attr('src');
            if (src && this.isValidImageUrl(src)) {
              images.push(src);
            }
          });

          // Create article from post
          const article: ScrapedArticle = {
            title: this.extractTitle(content),
            content: content,
            images: images,
            publishTime: new Date().toISOString(), // Facebook doesn't expose dates easily
            sourceLink: url,
          };

          if (this.validateArticle(article)) {
            articles.push(article);
          }
        } catch (error) {
          this.handleError(`Error parsing Facebook post: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      });

      return articles;
    } catch (error) {
      this.handleError(`Failed to fetch Facebook page: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return articles;
    }
  }

  /**
   * Extract title from post content (first sentence or first 100 chars)
   */
  private extractTitle(content: string): string {
    // Try to get first sentence
    const firstSentence = content.split(/[.!?]/)[0];
    if (firstSentence && firstSentence.length > 10 && firstSentence.length < 150) {
      return firstSentence.trim();
    }

    // Fallback to first 100 characters
    return content.substring(0, 100).trim() + '...';
  }

  /**
   * Check if URL is a valid image URL
   */
  private isValidImageUrl(url: string): boolean {
    return url.includes('fbcdn.net') || 
           url.includes('.jpg') || 
           url.includes('.png') ||
           url.includes('.jpeg');
  }
}
