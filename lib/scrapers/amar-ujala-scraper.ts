/**
 * Amar Ujala Kumaon Scraper
 * 
 * Scrapes news articles from Amar Ujala's Kumaon section
 * Source: https://www.amarujala.com/uttarakhand/kumaon
 */

import * as cheerio from 'cheerio';
import { BaseScraper, ScraperConfig } from './base-scraper';
import { ScrapedArticle } from '@/types';

export class AmarUjalaScraper extends BaseScraper {
  constructor() {
    super({
      name: 'Amar Ujala Kumaon',
      url: 'https://www.amarujala.com/uttarakhand/kumaon',
      timeout: 30000,
      maxRetries: 3,
      retryDelay: 1000,
    });
  }

  protected async fetchContent(): Promise<ScrapedArticle[]> {
    const articles: ScrapedArticle[] = [];

    try {
      // Fetch the main page
      const html = await this.fetchHTML(this.config.url);
      const $ = cheerio.load(html);

      // Find article links on the page
      // Amar Ujala typically uses article cards with links
      const articleLinks: string[] = [];
      
      $('article a, .article-card a, .news-card a, h2 a, h3 a').each((_, element) => {
        const href = $(element).attr('href');
        if (href && this.isValidArticleUrl(href)) {
          const fullUrl = this.resolveUrl(href, this.config.url);
          if (!articleLinks.includes(fullUrl)) {
            articleLinks.push(fullUrl);
          }
        }
      });

      this.log('info', `Found ${articleLinks.length} article links`);

      // Limit to first 10 articles to avoid overwhelming the system
      const linksToProcess = articleLinks.slice(0, 10);

      // Fetch each article
      for (const articleUrl of linksToProcess) {
        try {
          const article = await this.scrapeArticle(articleUrl);
          if (article && this.validateArticle(article)) {
            articles.push(article);
          }
        } catch (error) {
          this.handleError(`Failed to scrape article ${articleUrl}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      return articles;
    } catch (error) {
      this.handleError(`Failed to fetch main page: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return articles;
    }
  }

  /**
   * Scrape individual article page
   */
  private async scrapeArticle(url: string): Promise<ScrapedArticle | null> {
    try {
      const html = await this.fetchHTML(url);
      const $ = cheerio.load(html);

      // Extract title
      const title = this.extractTitle($);
      if (!title) {
        this.handleError(`No title found for ${url}`);
        return null;
      }

      // Extract content
      const content = this.extractContent($);
      if (!content) {
        this.handleError(`No content found for ${url}`);
        return null;
      }

      // Extract images
      const images = this.extractImages($, url);

      // Extract publish time
      const publishTime = this.extractPublishTime($);

      return {
        title: this.cleanText(title),
        content: this.cleanText(content),
        images,
        publishTime,
        sourceLink: url,
      };
    } catch (error) {
      this.handleError(`Error scraping article: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return null;
    }
  }

  /**
   * Extract article title
   */
  private extractTitle($: cheerio.CheerioAPI): string {
    // Try multiple selectors for title
    const selectors = [
      'h1.article-title',
      'h1.headline',
      'h1[itemprop="headline"]',
      'article h1',
      '.article-header h1',
      'h1',
    ];

    for (const selector of selectors) {
      const title = $(selector).first().text().trim();
      if (title) return title;
    }

    return '';
  }

  /**
   * Extract article content
   */
  private extractContent($: cheerio.CheerioAPI): string {
    // Try multiple selectors for content
    const selectors = [
      '.article-content',
      '.story-content',
      '[itemprop="articleBody"]',
      'article .content',
      '.article-body',
      'article p',
    ];

    for (const selector of selectors) {
      const elements = $(selector);
      if (elements.length > 0) {
        let content = '';
        elements.each((_, el) => {
          const text = $(el).text().trim();
          if (text) {
            content += text + '\n\n';
          }
        });
        if (content.trim()) return content.trim();
      }
    }

    return '';
  }

  /**
   * Extract article images
   */
  private extractImages($: cheerio.CheerioAPI, baseUrl: string): string[] {
    const images: string[] = [];
    const seenUrls = new Set<string>();

    // Try multiple selectors for images
    const selectors = [
      'article img',
      '.article-content img',
      '.story-image img',
      '[itemprop="image"]',
      'figure img',
    ];

    for (const selector of selectors) {
      $(selector).each((_, element) => {
        const src = $(element).attr('src') || $(element).attr('data-src');
        if (src) {
          const fullUrl = this.resolveUrl(src, baseUrl);
          if (!seenUrls.has(fullUrl) && this.isValidImageUrl(fullUrl)) {
            images.push(fullUrl);
            seenUrls.add(fullUrl);
          }
        }
      });
    }

    return images;
  }

  /**
   * Extract publish time
   */
  private extractPublishTime($: cheerio.CheerioAPI): string {
    // Try multiple selectors for publish time
    const selectors = [
      'time[datetime]',
      '[itemprop="datePublished"]',
      '.publish-date',
      '.article-date',
      'meta[property="article:published_time"]',
    ];

    for (const selector of selectors) {
      const element = $(selector).first();
      
      // Try datetime attribute first
      const datetime = element.attr('datetime') || element.attr('content');
      if (datetime) {
        return this.parseDate(datetime);
      }

      // Try text content
      const text = element.text().trim();
      if (text) {
        return this.parseDate(text);
      }
    }

    // Fallback to current time
    return new Date().toISOString();
  }

  /**
   * Check if URL is a valid article URL
   */
  private isValidArticleUrl(url: string): boolean {
    // Filter out non-article URLs
    const invalidPatterns = [
      '/author/',
      '/category/',
      '/tag/',
      '/page/',
      '#',
      'javascript:',
      'mailto:',
    ];

    const lowerUrl = url.toLowerCase();
    return !invalidPatterns.some(pattern => lowerUrl.includes(pattern));
  }

  /**
   * Check if URL is a valid image URL
   */
  private isValidImageUrl(url: string): boolean {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
    const lowerUrl = url.toLowerCase();
    return imageExtensions.some(ext => lowerUrl.includes(ext));
  }
}
