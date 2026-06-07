import axios from 'axios';
import { config } from '../config/index.js';
import { SmartMoneySignal } from '../types/index.js';

export class SignalStateManager {
  private static readonly ENDPOINT = `${config.SUPABASE_URL}/rest/v1/signals`;

  /**
   * Helper: Generates headers required to authorize against the Supabase REST gateway
   */
  private static getHeaders() {
    return {
      'apikey': config.SUPABASE_KEY,
      'Authorization': `Bearer ${config.SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    };
  }

  /**
   * Writes a scanned blockchain transaction directly to Supabase PostgreSQL
   */
  public static async addSignal(signal: SmartMoneySignal): Promise<void> {
    try {
      // Map frontend-typings to PostgreSQL snake_case columns
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
      // Handle unique constraint violations silently if scanner duplicates catches
      if (err.response?.status === 409) {
        return;
      }
      console.error('[Database Error] Failed to write signal to Supabase:', err.response?.data || err.message);
    }
  }

  /**
   * Queries the 50 most recent actual on-chain transaction signals recorded in PostgreSQL
   */
  public static async getSignals(): Promise<SmartMoneySignal[]> {
    try {
      const response = await axios.get(
        `${this.ENDPOINT}?order=created_at.desc&limit=50`,
        { headers: this.getHeaders() }
      );

      if (response.data && Array.isArray(response.data)) {
        // Map database columns back to camelCase frontend contracts
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
}