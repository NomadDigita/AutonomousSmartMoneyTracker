import { SmartMoneySignal } from '../types/index.js';

export class SignalStateManager {
  private static signalsCache: SmartMoneySignal[] = [];

  /**
   * Appends an actual scanned transaction to our in-memory cache
   */
  public static addSignal(signal: SmartMoneySignal): void {
    this.signalsCache.unshift(signal);
    
    // Cap cache length to prevent memory leaks
    if (this.signalsCache.length > 50) {
      this.signalsCache.pop();
    }
  }

  /**
   * Retrieves all actual transactions recorded from blocks
   */
  public static getSignals(): SmartMoneySignal[] {
    return this.signalsCache;
  }
}