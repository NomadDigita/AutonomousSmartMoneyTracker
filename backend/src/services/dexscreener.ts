import axios from 'axios';
import { TokenMarketData } from '../types/index.js';

export class DexScreenerService {
  private static readonly BASE_URL = 'https://api.dexscreener.com/latest/dex/tokens';

  /**
   * Fetches real-time price and pool data for any ERC-20 token address
   */
  public static async getTokenData(tokenAddress: string): Promise<TokenMarketData | null> {
    try {
      const response = await axios.get(`${this.BASE_URL}/${tokenAddress}`);
      const pairs = response.data?.pairs;
      
      if (!pairs || pairs.length === 0) {
        return null;
      }

      // Sort pairs by liquidity to fetch the most liquid trading venue
      const primePair = pairs.sort((a: any, b: any) => {
        const liqA = parseFloat(a.liquidity?.usd || '0');
        const liqB = parseFloat(b.liquidity?.usd || '0');
        return liqB - liqA;
      })[0];

      return {
        address: tokenAddress,
        name: primePair.baseToken.name,
        symbol: primePair.baseToken.symbol,
        priceUsd: primePair.priceUsd || '0.00',
        volume24h: primePair.volume?.h24?.toString() || '0.00',
        liquidityUsd: primePair.liquidity?.usd?.toString() || '0.00',
        fdv: primePair.fdv?.toString() || '0.00',
        priceChange24h: primePair.priceChange?.h24?.toString() || '0.00'
      };
    } catch (error: any) {
      console.error(`[DexScreener] Error fetching data for ${tokenAddress}:`, error.message);
      return null;
    }
  }
}