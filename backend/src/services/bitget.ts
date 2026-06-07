import axios, { Method } from 'axios';
import crypto from 'crypto';
import { config } from '../config/index.js';

export class BitgetService {
  private static readonly BASE_URL = 'https://api.bitget.com';
  
  // Dynamic offset cache to sync local clock against Bitget servers
  private static timeOffset: number = 0;
  private static lastSyncTime: number = 0;
  private static readonly SYNC_INTERVAL_MS = 10 * 60 * 1000; // Recalculate drift every 10 minutes

  /**
   * Public: Synchronizes local clock offset with Bitget public server time
   */
  public static async syncClock(): Promise<number> {
    const now = Date.now();
    
    // Return cached offset if within the synchronization interval
    if (now - this.lastSyncTime < this.SYNC_INTERVAL_MS && this.lastSyncTime !== 0) {
      return this.timeOffset;
    }

    try {
      const response = await axios.get(`${this.BASE_URL}/api/v2/public/time`, { timeout: 4000 });
      if (response.data && response.data.code === '00000' && response.data.data?.serverTime) {
        const serverTime = parseInt(response.data.data.serverTime, 10);
        this.timeOffset = serverTime - Date.now();
        this.lastSyncTime = Date.now();
        console.log(`[Bitget Clock Sync] Local clock drift calibrated. Network offset: ${this.timeOffset}ms`);
      }
    } catch {
      console.warn('[Bitget Clock Sync WARNING] Failed to reach Bitget clock node. Relying on local system time.');
    }
    return this.timeOffset;
  }

  /**
   * Generates Base64 HMAC-SHA256 signature
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
      .digest('base64');
  }

  /**
   * Creates authorized headers with adaptive time drift compensation
   */
  private static async getHeaders(
    method: Method,
    requestPath: string,
    body: string = ''
  ): Promise<Record<string, string>> {
    const offset = await this.syncClock();
    const timestamp = Date.now() + offset; // Automatically compensates for server clock drift
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

  /**
   * Queries spot account balances with robust, readable error translation
   */
  public static async getSpotAssets(): Promise<any[]> {
    const endpoint = '/api/v2/spot/account/assets';
    
    try {
      const headers = await this.getHeaders('GET', endpoint);
      const response = await axios.get(`${this.BASE_URL}${endpoint}`, { headers, timeout: 5000 });
      
      if (response.data) {
        if (response.data.code === '00000') {
          return response.data.data;
        }
        
        // Translate specific code failures into clear instructions
        if (response.data.code === '40014' || response.data.code === '40001') {
          throw new Error('API passphrase or signature validation rejected. Please verify your credentials.');
        }
        if (response.data.code === '40006') {
          throw new Error('IP address restricted on your Bitget API settings. Please add your IP to the Whitelist.');
        }
        if (response.data.code === '40017') {
          throw new Error('API key lacks Spot Read permissions. Please enable Read permissions on your Bitget Dashboard.');
        }
        
        throw new Error(response.data.msg || `Exchange API Error (Code: ${response.data.code})`);
      }
      throw new Error('Empty response received from Bitget gateway.');
    } catch (error: any) {
      // Intercept networking status codes
      if (error.response?.status === 401 || error.response?.status === 400) {
        throw new Error('Bitget API Handshake Rejected: Please verify Spot permissions and Whitelist settings on your Bitget Console.');
      }
      throw new Error(error.message || 'Bitget API Connection Timeout.');
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
      const headers = await this.getHeaders('POST', endpoint, bodyStr);

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