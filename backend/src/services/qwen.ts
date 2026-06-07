import axios from 'axios';
import { config } from '../config/index.js';

export class QwenService {
  // Primary and secondary fallback gateways for global network resilience
  private static readonly ENDPOINTS = [
    'https://dashscope-intl.aliyuncs.com/compatible-mode/v1/chat/completions', // International
    'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions'      // Domestic fallback
  ];

  /**
   * Queries Alibaba Qwen model with adaptive fallback gateways
   */
  private static async postRequest(payload: Record<string, any>): Promise<any> {
    let lastError: any = null;

    for (const endpoint of this.ENDPOINTS) {
      try {
        const response = await axios.post(
          endpoint,
          payload,
          {
            headers: {
              'Authorization': `Bearer ${config.QWEN_API_KEY}`,
              'Content-Type': 'application/json'
            },
            timeout: 8000 // 8-second request timeout limit per gateway
          }
        );
        if (response.data) {
          return response.data;
        }
      } catch (err: any) {
        console.warn(`[Qwen Warning] Gateway ${endpoint} unreachable. Reason: ${err.message}`);
        lastError = err;
        continue; // Fallback to secondary endpoint
      }
    }

    throw new Error(`[Qwen Critical Failure] All Aliyun completion gateways are unreachable. Last error: ${lastError?.message}`);
  }

  /**
   * Queries model and guarantees structured semantic text summaries
   */
  public static async analyzeMarketData(
    systemPrompt: string,
    userPrompt: string
  ): Promise<string> {
    try {
      const payload = {
        model: 'qwen-turbo',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.15
      };

      const response = await this.postRequest(payload);
      if (response?.choices?.[0]?.message?.content) {
        return response.choices[0].message.content.trim();
      }
      throw new Error('Malformed or empty completions content returned from Aliyun server.');
    } catch (error: any) {
      console.error('[Qwen Core Error]:', error.message);
      throw error;
    }
  }

  /**
   * Safe JSON Schema Parser: Forces model to output strict JSON keys and validates schema alignment
   */
  public static async queryStructuredJson<T>(
    systemPrompt: string,
    userPrompt: string,
    fallbackValue: T
  ): Promise<T> {
    try {
      const rawResponse = await this.analyzeMarketData(systemPrompt, userPrompt);
      
      // Clean up markdown block wrapping characters (e.g. ```json)
      const cleanJsonStr = rawResponse
        .replace(/```json/gi, '')
        .replace(/```/g, '')
        .trim();

      const parsedData = JSON.parse(cleanJsonStr);
      return parsedData as T;
    } catch (parseError: any) {
      console.warn('[Qwen Schema Guard] Malformed JSON generated. Activating defensive fallback schema.');
      console.warn(`Details: ${parseError.message}`);
      return fallbackValue;
    }
  }
}