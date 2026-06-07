import axios from 'axios';
import { config } from '../config/index.js';
import { SmartMoneySignal } from '../types/index.js';

export class SignalStateManager {
  private static readonly ENDPOINT = `${config.SUPABASE_URL}/rest/v1/signals`;
  private static readonly SUB_ENDPOINT = `${config.SUPABASE_URL}/rest/v1/subscribers`;

  private static getHeaders() {
    return {
      'apikey': config.SUPABASE_KEY,
      'Authorization': `Bearer ${config.SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    };
  }

  public static async addSignal(signal: SmartMoneySignal): Promise<void> {
    try {
      const dbPayload = {
        transaction_hash: signal.transactionHash,
        wallet_label: signal.walletLabel,
        wallet_category: signal.walletCategory,
        action: signal.action,
        asset: signal.asset,
        amount: signal.amount,
        confidence_score: signal.confidenceScore,
        impact_score: signal.impactScore,
        risk_score: signal.riskScore,
        ai_explanation: signal.aiExplanation
      };

      await axios.post(this.ENDPOINT, dbPayload, { headers: this.getHeaders() });
      console.log(`[Database] Scanned transaction ${signal.transactionHash.substring(0, 10)}... safely written to Supabase.`);
    } catch (err: any) {
      if (err.response?.status === 409) {
        return;
      }
      console.error('[Database Error] Failed to write signal to Supabase:', err.response?.data || err.message);
    }
  }

  public static async getSignals(): Promise<SmartMoneySignal[]> {
    try {
      const response = await axios.get(
        `${this.ENDPOINT}?order=created_at.desc&limit=50`,
        { headers: this.getHeaders() }
      );

      if (response.data && Array.isArray(response.data)) {
        return response.data.map((row: any) => ({
          transactionHash: row.transaction_hash,
          walletLabel: row.wallet_label,
          walletCategory: row.wallet_category,
          action: row.action,
          asset: row.asset,
          amount: row.amount,
          confidenceScore: row.confidence_score,
          impactScore: row.impact_score,
          riskScore: row.risk_score,
          aiExplanation: row.ai_explanation,
          timestamp: new Date(row.created_at).getTime()
        }));
      }
      return [];
    } catch (err: any) {
      console.error('[Database Error] Failed to retrieve signals from Supabase:', err.response?.data || err.message);
      return [];
    }
  }

  /**
   * Registers a user Chat ID for live block broadcasts on Supabase
   */
  public static async addSubscriber(chatId: string): Promise<void> {
    try {
      await axios.post(
        this.SUB_ENDPOINT,
        { chat_id: chatId.toString() },
        { headers: this.getHeaders() }
      );
      console.log(`[Database] New subscriber registered: ${chatId}`);
    } catch (err: any) {
      if (err.response?.status === 409) return; // Silent return if already registered
      console.error('[Database Error] Subscriber write failed:', err.response?.data || err.message);
    }
  }

  /**
   * Unregisters a user Chat ID on Supabase
   */
  public static async removeSubscriber(chatId: string): Promise<void> {
    try {
      await axios.delete(
        `${this.SUB_ENDPOINT}?chat_id=eq.${chatId}`,
        { headers: this.getHeaders() }
      );
      console.log(`[Database] Subscriber unsubscribed: ${chatId}`);
    } catch (err: any) {
      console.error('[Database Error] Subscriber delete failed:', err.response?.data || err.message);
    }
  }

  /**
   * Retrieves all active subscribers for WebSocket live broadcasting
   */
  public static async getSubscribers(): Promise<any[]> {
    try {
      const response = await axios.get(this.SUB_ENDPOINT, { headers: this.getHeaders() });
      return response.data || [];
    } catch (err: any) {
      console.error('[Database Error] Failed to retrieve subscribers:', err.response?.data || err.message);
      return [];
    }
  }
}