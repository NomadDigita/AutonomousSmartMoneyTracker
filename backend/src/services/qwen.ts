import axios from 'axios';
import { config } from '../config/index.js';

export class QwenService {
  private static readonly API_URL = 'https://dashscope-intl.aliyuncs.com/compatible-mode/v1/chat/completions';
  
  // Model rotation list: automatically falls back to secondary models if quota is exhausted
  private static readonly MODELS = ['qwen-turbo', 'qwen-plus', 'qwen-max'];

  /**
   * Queries Alibaba Qwen model with automated model rotation on quota exhaustion
   */
  public static async analyzeMarketData(
    systemPrompt: string,
    userPrompt: string
  ): Promise<string> {
    let lastError: any = null;

    for (const model of this.MODELS) {
      try {
        const response = await axios.post(
          this.API_URL,
          {
            model: model,
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
            },
            timeout: 8000
          }
        );

        if (response.data?.choices?.[0]?.message?.content) {
          console.log(`[Qwen LLM] Completions resolved successfully using model: ${model}`);
          return response.data.choices[0].message.content.trim();
        }
      } catch (err: any) {
        // Intercept quota exhaustion (400 / 403 / 429) or authentication errors
        console.warn(`[Qwen Warning] Model ${model} failed or quota exhausted. Retrying with fallback...`);
        lastError = err;
        continue;
      }
    }

    throw new Error(`[Qwen Critical Failure] All models exhausted or API key invalid. Last error: ${lastError?.message}`);
  }
}