/**
 * Dainik Jagran Kumaon Scraper
 * 
 * Scrapes news articles from Dainik Jagran's Kumaon section
 * Source: https://www.jagran.com/uttarakhand/kumaon-news.html
 */

import * as cheerio from 'cheerio';
import { BaseScraper, ScraperConfig } from './base-scraper';
import { ScrapedArticle } from '@/types';

export class DainikJagranScraper extends BaseScraper {
  constructor() {
    super({
      name: 'Dainik Jagran Kumaon',
      url: 'https://www.jagran.com/uttarakhand/kumaon-news.html',
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
      const articleLinks: string[] = [];
      
      // Dainik Jagran typically uses specific article structures
      $('article a, .news-list a, .story-card a, h2 a, h3 a, .headline a').each((_, element) => {
        const href = $(element).attr('href');
        if (href && this.isValidArticleUrl(href)) {
          const fullUrl = this.resolveUrl(href, this.config.url);
          if (!articleLinks.includes(fullUrl)) {
            articleLinks.push(fullUrl);
          }
        }
      });

      this.log('info', `Found ${articleLinks.length} article links`);

      // Limit to first 10 articles
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
    const selectors = [
      'h1.story-title',
      'h1.article-title',
      'h1[itemprop="headline"]',
      '.story-header h1',
      'article h1',
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
    const selectors = [
      '.story-content',
      '.article-content',
      '[itemprop="articleBody"]',
      '.story-description',
      'article .content',
      '.article-body p',
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

    const selectors = [
      '.story-image img',
      'article img',
      '.article-image img',
      '[itemprop="image"]',
      'figure img',
      '.lead-image img',
    ];

    for (const selector of selectors) {
      $(selector).each((_, element) => {
        const src = $(element).attr('src') || $(element).attr('data-src') || $(element).attr('data-lazy-src');
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
    const selectors = [
      'time[datetime]',
      '[itemprop="datePublished"]',
      '.publish-time',
      '.story-date',
      '.article-date',
      'meta[property="article:published_time"]',
      '.date-time',
    ];

    for (const selector of selectors) {
      const element = $(selector).first();
      
      // Try datetime attribute
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
    const invalidPatterns = [
      '/author/',
      '/category/',
      '/tag/',
      '/page/',
      '/gallery/',
      '#',
      'javascript:',
      'mailto:',
      '/video/',
    ];

    const lowerUrl = url.toLowerCase();
    
    // Must contain some article indicators
    const hasArticleIndicator = 
      lowerUrl.includes('/news/') ||
      lowerUrl.includes('/article/') ||
      lowerUrl.includes('/story/') ||
      lowerUrl.includes('uttarakhand') ||
      lowerUrl.includes('kumaon');

    return hasArticleIndicator && !invalidPatterns.some(pattern => lowerUrl.includes(pattern));
  }

  /**
   * Check if URL is a valid image URL
   */
  private isValidImageUrl(url: string): boolean {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
    const lowerUrl = url.toLowerCase();
    return imageExtensions.some(ext => lowerUrl.includes(ext)) && !lowerUrl.includes('logo');
  }
}
