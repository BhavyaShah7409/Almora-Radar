/**
 * YouTube News Scraper
 * 
 * Scrapes news videos from YouTube channels/searches related to Almora/Kumaon
 * Note: YouTube requires API key for reliable access
 */

import * as cheerio from 'cheerio';
import { BaseScraper, ScraperConfig } from './base-scraper';
import { ScrapedArticle } from '@/types';

// YouTube channels or search queries to monitor
const YOUTUBE_QUERIES = [
  'Almora news',
  'Kumaon news',
  'Uttarakhand news Almora',
];

export class YouTubeScraper extends BaseScraper {
  private queries: string[];

  constructor(queries: string[] = YOUTUBE_QUERIES) {
    super({
      name: 'YouTube News',
      url: 'https://www.youtube.com',
      timeout: 30000,
      maxRetries: 3,
      retryDelay: 1000,
    });
    this.queries = queries;
  }

  protected async fetchContent(): Promise<ScrapedArticle[]> {
    const allArticles: ScrapedArticle[] = [];

    this.log('warn', 'YouTube scraping without API is unreliable');
    this.log('info', 'Consider using YouTube Data API v3 for better results');

    // Note: YouTube heavily uses JavaScript for content loading
    // This basic scraper will have limited success
    // For production, use YouTube Data API v3:
    // https://developers.google.com/youtube/v3

    for (const query of this.queries) {
      try {
        this.log('info', `Searching YouTube for: ${query}`);
        const articles = await this.searchYouTube(query);
        allArticles.push(...articles);
      } catch (error) {
        this.handleError(`Failed to search YouTube for "${query}": ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    return allArticles;
  }

  /**
   * Search YouTube for videos
   * Note: This is a basic implementation with limitations
   */
  private async searchYouTube(query: string): Promise<ScrapedArticle[]> {
    const articles: ScrapedArticle[] = [];

    try {
      const searchUrl = `${this.config.url}/results?search_query=${encodeURIComponent(query)}&sp=CAI%253D`;
      const html = await this.fetchHTML(searchUrl);
      const $ = cheerio.load(html);

      // YouTube embeds video data in script tags
      // Look for ytInitialData
      $('script').each((_, element) => {
        const scriptContent = $(element).html();
        if (scriptContent && scriptContent.includes('var ytInitialData')) {
          try {
            // Extract JSON data from script
            const jsonMatch = scriptContent.match(/var ytInitialData = ({.*?});/);
            if (jsonMatch && jsonMatch[1]) {
              const data = JSON.parse(jsonMatch[1]);
              const videos = this.extractVideosFromData(data);
              
              // Limit to 3 videos per query
              videos.slice(0, 3).forEach(video => {
                const article: ScrapedArticle = {
                  title: video.title,
                  content: video.description || video.title,
                  images: video.thumbnail ? [video.thumbnail] : [],
                  publishTime: video.publishTime || new Date().toISOString(),
                  sourceLink: `https://www.youtube.com/watch?v=${video.videoId}`,
                };

                if (this.validateArticle(article)) {
                  articles.push(article);
                }
              });
            }
          } catch (error) {
            this.handleError(`Error parsing YouTube data: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
        }
      });

      if (articles.length === 0) {
        this.log('warn', `No videos found for query: ${query}`);
        this.log('info', 'YouTube Data API recommended for reliable video scraping');
      }

      return articles;
    } catch (error) {
      this.handleError(`Failed to search YouTube: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return articles;
    }
  }

  /**
   * Extract video information from YouTube's data structure
   */
  private extractVideosFromData(data: any): Array<{
    videoId: string;
    title: string;
    description?: string;
    thumbnail?: string;
    publishTime?: string;
  }> {
    const videos: Array<{
      videoId: string;
      title: string;
      description?: string;
      thumbnail?: string;
      publishTime?: string;
    }> = [];

    try {
      // Navigate YouTube's complex data structure
      const contents = data?.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer?.contents;
      
      if (contents && Array.isArray(contents)) {
        contents.forEach((section: any) => {
          const items = section?.itemSectionRenderer?.contents;
          if (items && Array.isArray(items)) {
            items.forEach((item: any) => {
              const videoRenderer = item?.videoRenderer;
              if (videoRenderer) {
                videos.push({
                  videoId: videoRenderer.videoId,
                  title: videoRenderer.title?.runs?.[0]?.text || videoRenderer.title?.simpleText || '',
                  description: videoRenderer.descriptionSnippet?.runs?.[0]?.text || '',
                  thumbnail: videoRenderer.thumbnail?.thumbnails?.[0]?.url || '',
                  publishTime: videoRenderer.publishedTimeText?.simpleText || '',
                });
              }
            });
          }
        });
      }
    } catch (error) {
      this.handleError(`Error extracting video data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return videos;
  }
}
