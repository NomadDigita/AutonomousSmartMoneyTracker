import axios from 'axios';
import { config } from '../config/index.js';
import { SignalStateManager } from './signalState.js';
import { TavilyService } from './tavily.js';
import { QwenService } from './qwen.js';

export class AutonomousResearchAgent {
  private static readonly REPORT_ENDPOINT = `${config.SUPABASE_URL}/rest/v1/research_reports`;

  private static getHeaders() {
    return {
      'apikey': config.SUPABASE_KEY,
      'Authorization': `Bearer ${config.SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    };
  }

  /**
   * Core Agent Loop: Aggregates on-chain data, sweeps web context, and generates macro reports
   */
  public static async executeAutonomousResearch(): Promise<any> {
    try {
      console.log('[Research Agent] Fetching on-chain signals history from Supabase...');
      const signals = await SignalStateManager.getSignals();

      if (signals.length === 0) {
        console.warn('[Research Agent] Insufficient on-chain database logs to compile a research report.');
        return null;
      }

      // 1. Aggregate on-chain transaction metrics
      const totalEthMoved = signals
        .filter(s => s.asset === 'ETH')
        .reduce((sum, s) => sum + parseFloat(s.amount), 0)
        .toFixed(2);

      const buyCount = signals.filter(s => s.action === 'BUY').length;
      const sellCount = signals.filter(s => s.action === 'SELL').length;

      // 2. Query Tavily for global technical market narratives
      const searchQuery = 'ethereum bitcoin macroeconomic crypto market trends interest rates breaking news';
      const webContext = await TavilyService.searchNarrative(searchQuery);

      console.log('[Research Agent] Context gathered. Triggering Aliyun Qwen Macro Synthesis...');

      const systemPrompt = `You are a Senior Macroeconomic Researcher for the Bitget AI Team.
Analyze the provided on-chain transaction data and the breaking news context.
Synthesize a highly professional, Bloomberg-standard market report.
You MUST output a strict JSON object with no markdown block formatting. Example format:
{"title": "Report Title", "sentiment_rating": "BULLISH", "report_text": "HTML formatted text using ONLY standard <b>, <i>, and <code> tags."}`;

      const userPrompt = `
On-Chain Database Activity (Last 24 Hours):
- Scanned Transactions: ${signals.length}
- ETH Accumulated: ${totalEthMoved} ETH
- Smart Buy Pressure Events: ${buyCount}
- Smart Sell Pressure Events: ${sellCount}

Global News Context:
${webContext}

Generate the final persistent research report.`;

      const aiResponse = await QwenService.analyzeMarketData(systemPrompt, userPrompt);
      const cleaned = aiResponse.replace(/```json|```/g, '').trim();
      const parsedReport = JSON.parse(cleaned);

      // 3. Write the compiled agent report persistently to Supabase PostgreSQL
      const dbPayload = {
        title: parsedReport.title,
        report_text: parsedReport.report_text,
        sentiment_rating: parsedReport.sentiment_rating
      };

      const writeResponse = await axios.post(
        this.REPORT_ENDPOINT,
        dbPayload,
        { headers: this.getHeaders() }
      );

      console.log(`[Research Agent] Autonomous Smart Money Research Report "${parsedReport.title}" published to Supabase.`);
      return writeResponse.data?.[0] || null;
    } catch (err: any) {
      console.error('[Research Agent Error] Execution halted:', err.response?.data || err.message);
      return null;
    }
  }

  /**
   * Retrieves the latest published autonomous report
   */
  public static async getLatestReport(): Promise<any> {
    try {
      const response = await axios.get(
        `${this.REPORT_ENDPOINT}?order=created_at.desc&limit=1`,
        { headers: this.getHeaders() }
      );
      return response.data?.[0] || null;
    } catch (err: any) {
      console.error('[Database Error] Failed to retrieve latest research report:', err.response?.data || err.message);
      return null;
    }
  }
}