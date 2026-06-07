import axios from 'axios';
import { config } from '../config/index.js';

export class QwenService {
  // Configured to target the international Model Studio gateway for global API keys
  private static readonly API_URL = 'https://dashscope-intl.aliyuncs.com/compatible-mode/v1/chat/completions';

  /**
   * Queries the international Alibaba Qwen LLM for market decision analysis
   */
  public static async analyzeMarketData(
    systemPrompt: string,
    userPrompt: string
  ): Promise<string> {
    try {
      const response = await axios.post(
        this.API_URL,
        {
          model: 'qwen-turbo',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          temperature: 0.15
        },
        {
          headers: {
            'Authorization': `Bearer ${config.QWEN_API_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data?.choices?.[0]?.message?.content) {
        return response.data.choices[0].message.content.trim();
      }
      throw new Error('Malformed API response received from Alibaba Qwen international endpoint');
    } catch (error: any) {
      console.error('[Qwen LLM Service Error]:', error.response?.data || error.message);
      throw error;
    }
  }
}