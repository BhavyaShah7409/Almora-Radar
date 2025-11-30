/**
 * Local News Sites Scraper
 * 
 * Generic scraper for local Almora/Kumaon news websites
 * Configurable list of URLs to scrape
 */

import * as cheerio from 'cheerio';
import { BaseScraper, ScraperConfig } from './base-scraper';
import { ScrapedArticle } from '@/types';

interface LocalNewsSite {
  name: string;
  url: string;
  articleSelector?: string;
  titleSelector?: string;
  contentSelector?: string;
  imageSelector?: string;
  dateSelector?: string;
}

// Configurable list of local news sites
const LOCAL_NEWS_SITES: LocalNewsSite[] = [
  {
    name: 'Almora Live',
    url: 'https://almoralive.com',
    articleSelector: 'article, .post, .news-item',
  },
  {
    name: 'Kumaon Jagran',
    url: 'https://kumaunjagran.in',
    articleSelector: 'article, .post-item',
  },
  {
    name: 'Uttarakhand Today',
    url: 'https://uttarakhandtoday.com',
    articleSelector: 'article, .news-card',
  },
];

export class LocalNewsScraper extends BaseScraper {
  private sites: LocalNewsSite[];

  constructor(sites: LocalNewsSite[] = LOCAL_NEWS_SITES) {
    super({
      name: 'Local News Sites',
      url: 'multiple',
      timeout: 30000,
      maxRetries: 3,
      retryDelay: 1000,
    });
    this.sites = sites;
  }

  protected async fetchContent(): Promise<ScrapedArticle[]> {
    const allArticles: ScrapedArticle[] = [];

    // Scrape each configured site
    for (const site of this.sites) {
      try {
        this.log('info', `Scraping ${site.name}...`);
        const articles = await this.scrapeSite(site);
        allArticles.push(...articles);
        this.log('info', `Scraped ${articles.length} articles from ${site.name}`);
      } catch (error) {
        this.handleError(`Failed to scrape ${site.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    return allArticles;
  }

  /**
   * Scrape a single local news site
   */
  private async scrapeSite(site: LocalNewsSite): Promise<ScrapedArticle[]> {
    const articles: ScrapedArticle[] = [];

    try {
      const html = await this.fetchHTML(site.url);
      const $ = cheerio.load(html);

      // Find article links
      const articleLinks: string[] = [];
      const selector = site.articleSelector || 'article a, .post a, .news-item a';

      $(selector).each((_, element) => {
        const href = $(element).attr('href');
        if (href && this.isValidArticleUrl(href)) {
          const fullUrl = this.resolveUrl(href, site.url);
          if (!articleLinks.includes(fullUrl)) {
            articleLinks.push(fullUrl);
          }
        }
      });

      // Limit to first 5 articles per site
      const linksToProcess = articleLinks.slice(0, 5);

      // Scrape each article
      for (const articleUrl of linksToProcess) {
        try {
          const article = await this.scrapeArticle(articleUrl, site);
          if (article && this.validateArticle(article)) {
            articles.push(article);
          }
        } catch (error) {
          this.handleError(`Failed to scrape article ${articleUrl}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      return articles;
    } catch (error) {
      this.handleError(`Failed to fetch ${site.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return articles;
    }
  }

  /**
   * Scrape individual article
   */
  private async scrapeArticle(url: string, site: LocalNewsSite): Promise<ScrapedArticle | null> {
    try {
      const html = await this.fetchHTML(url);
      const $ = cheerio.load(html);

      // Extract title
      const title = this.extractTitle($, site.titleSelector);
      if (!title) {
        this.handleError(`No title found for ${url}`);
        return null;
      }

      // Extract content
      const content = this.extractContent($, site.contentSelector);
      if (!content) {
        this.handleError(`No content found for ${url}`);
        return null;
      }

      // Extract images
      const images = this.extractImages($, url, site.imageSelector);

      // Extract publish time
      const publishTime = this.extractPublishTime($, site.dateSelector);

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
   * Extract article title with custom selector
   */
  private extractTitle($: cheerio.CheerioAPI, customSelector?: string): string {
    const selectors = customSelector 
      ? [customSelector]
      : [
          'h1.entry-title',
          'h1.post-title',
          'h1.article-title',
          'h1[itemprop="headline"]',
          'article h1',
          '.post-header h1',
          'h1',
        ];

    for (const selector of selectors) {
      const title = $(selector).first().text().trim();
      if (title) return title;
    }

    return '';
  }

  /**
   * Extract article content with custom selector
   */
  private extractContent($: cheerio.CheerioAPI, customSelector?: string): string {
    const selectors = customSelector
      ? [customSelector]
      : [
          '.entry-content',
          '.post-content',
          '.article-content',
          '[itemprop="articleBody"]',
          'article .content',
          '.post-body',
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
   * Extract article images with custom selector
   */
  private extractImages($: cheerio.CheerioAPI, baseUrl: string, customSelector?: string): string[] {
    const images: string[] = [];
    const seenUrls = new Set<string>();

    const selectors = customSelector
      ? [customSelector]
      : [
          'article img',
          '.entry-content img',
          '.post-content img',
          '.featured-image img',
          '[itemprop="image"]',
          'figure img',
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
   * Extract publish time with custom selector
   */
  private extractPublishTime($: cheerio.CheerioAPI, customSelector?: string): string {
    const selectors = customSelector
      ? [customSelector]
      : [
          'time[datetime]',
          '[itemprop="datePublished"]',
          '.entry-date',
          '.post-date',
          '.published',
          'meta[property="article:published_time"]',
        ];

    for (const selector of selectors) {
      const element = $(selector).first();
      
      const datetime = element.attr('datetime') || element.attr('content');
      if (datetime) {
        return this.parseDate(datetime);
      }

      const text = element.text().trim();
      if (text) {
        return this.parseDate(text);
      }
    }

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
      '/about',
      '/contact',
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
    return imageExtensions.some(ext => lowerUrl.includes(ext)) && 
           !lowerUrl.includes('logo') && 
           !lowerUrl.includes('icon');
  }
}
