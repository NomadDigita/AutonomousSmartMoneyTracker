import axios from 'axios';
import { config } from '../config/index.js';

interface CachedQuery {
  result: string;
  expiry: number;
}

export class TavilyService {
  private static readonly API_URL = 'https://api.tavily.com/search';
  
  // In-Memory cache storage to protect free-tier API credits
  private static readonly cache: Record<string, CachedQuery> = {};
  private static readonly CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour time-to-live

  /**
   * Searches the web for crypto narratives, with 1-hour semantic request caching
   */
  public static async searchNarrative(query: string): Promise<string> {
    const sanitizedQuery = query.trim().toLowerCase();
    const now = Date.now();

    // Check if the query exists in our cache and has not expired
    if (this.cache[sanitizedQuery] && this.cache[sanitizedQuery].expiry > now) {
      console.log(`[Tavily Cache] Cache hit resolved for query: "${query}"`);
      return this.cache[sanitizedQuery].result;
    }

    try {
      console.log(`[Tavily API] Cache miss. Fetching fresh context for query: "${query}"`);
      const response = await axios.post(
        this.API_URL,
        {
          api_key: config.TAVILY_API_KEY,
          query: query,
          search_depth: 'advanced',
          include_answer: true,
          max_results: 5
        },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      let textResult = '';
      if (response.data?.answer) {
        textResult = response.data.answer;
      } else if (response.data?.results) {
        textResult = response.data.results
          .map((res: any) => `- ${res.title}: ${res.content}`)
          .join('\n');
      }

      if (!textResult) {
        throw new Error('No search context returned from Tavily API');
      }

      // Write to cache
      this.cache[sanitizedQuery] = {
        result: textResult,
        expiry: now + this.CACHE_TTL_MS
      };

      return textResult;
    } catch (error: any) {
      console.error('[Tavily Search Error]:', error.response?.data || error.message);
      throw error;
    }
  }
}