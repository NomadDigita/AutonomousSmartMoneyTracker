import axios, { Method } from 'axios';
import crypto from 'crypto';
import { config } from '../config/index.js';

export class BitgetService {
  private static readonly BASE_URL = 'https://api.bitget.com';

  /**
   * Generates Base64-encoded signature for Bitget API authentication
   */
  private static generateSignature(
    timestamp: number,
    method: Method,
    requestPath: string,
    body: string
  ): string {
    const message = timestamp + method.toUpperCase() + requestPath + body;
    return crypto
      .createHmac('sha256', config.BITGET_SECRET_KEY)
      .update(message)
      .digest('base64'); // Fixed from 'hex' to 'base64' matching Bitget V2 spec
  }

  private static getHeaders(
    method: Method,
    requestPath: string,
    body: string = ''
  ): Record<string, string> {
    const timestamp = Date.now();
    const signature = this.generateSignature(timestamp, method, requestPath, body);

    return {
      'ACCESS-KEY': config.BITGET_API_KEY,
      'ACCESS-SIGN': signature,
      'ACCESS-TIMESTAMP': timestamp.toString(),
      'ACCESS-PASSPHRASE': config.BITGET_PASSPHRASE,
      'Content-Type': 'application/json',
      'locale': 'en-US'
    };
  }

  public static async getTicker(symbol: string): Promise<any> {
    try {
      const endpoint = `/api/v2/spot/market/tickers?symbol=${symbol.toUpperCase()}`;
      const response = await axios.get(`${this.BASE_URL}${endpoint}`);
      if (response.data && response.data.code === '00000') {
        return response.data.data[0];
      }
      throw new Error(response.data?.msg || 'Failed to retrieve market ticker data');
    } catch (error: any) {
      console.error(`[Bitget] Market Ticker Error for ${symbol}:`, error.message);
      throw error;
    }
  }

  public static async getSpotAssets(): Promise<any[]> {
    try {
      const endpoint = '/api/v2/spot/account/assets';
      const headers = this.getHeaders('GET', endpoint);

      const response = await axios.get(`${this.BASE_URL}${endpoint}`, { headers });
      if (response.data && response.data.code === '00000') {
        return response.data.data;
      }
      throw new Error(response.data?.msg || 'Failed to retrieve asset data');
    } catch (error: any) {
      console.error('[Bitget] Asset Fetch Error:', error.message);
      throw error;
    }
  }

  public static async placeSpotOrder(
    symbol: string,
    side: 'buy' | 'sell',
    orderType: 'market' | 'limit',
    size: string,
    price?: string
  ): Promise<any> {
    try {
      const endpoint = '/api/v2/spot/trade/place-order';
      const bodyObj: Record<string, any> = {
        symbol: symbol.toUpperCase(),
        side: side.toLowerCase(),
        orderType: orderType.toLowerCase(),
        force: 'gtc',
        size: size
      };

      if (orderType === 'limit' && price) {
        bodyObj.price = price;
      }

      const bodyStr = JSON.stringify(bodyObj);
      const headers = this.getHeaders('POST', endpoint, bodyStr);

      const response = await axios.post(`${this.BASE_URL}${endpoint}`, bodyObj, { headers });
      if (response.data && response.data.code === '00000') {
        return response.data.data;
      }
      throw new Error(response.data?.msg || 'Order execution failed');
    } catch (error: any) {
      console.error(`[Bitget] Order Error for ${symbol}:`, error.message);
      throw error;
    }
  }
}