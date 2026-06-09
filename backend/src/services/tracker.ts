import { ethers } from 'ethers';
import { config } from '../config/index.js';
import { QwenService } from './qwen.js';
import { DexScreenerService } from './dexscreener.js';
import { LiveTransaction, SmartMoneySignal, TrackedWallet } from '../types/index.js';

export class BlockchainTrackerService {
  private static provider: ethers.JsonRpcProvider | null = null;
  private static wsProvider: ethers.WebSocketProvider | null = null;
  private static activeTracking = false;
  private static isUsingWebSocket = false;

  private static readonly FALLBACK_RPCS = [
    'https://cloudflare-eth.com',
    'https://ethereum-rpc.publicnode.com',
    'https://eth.llamarpc.com'
  ];

  private static readonly FALLBACK_WSS = [
    'wss://ethereum-rpc.publicnode.com',
    'wss://eth.llamarpc.com'
  ];

  // Updated watched wallets (Removed Wrapped Ether Contract utility to prevent 0 ETH spam)
  public static readonly WATCHED_WALLETS: TrackedWallet[] = [
    { address: '0x00000000219ab540356cBB839Cbe05303d7705Fa', label: 'Ethereum Deposit Contract', category: 'Institution' },
    { address: '0xAb5801a7D398351b8bE11C439e05C5B3259aec9B', label: 'Vitalik Buterin', category: 'Elite Trader', historicalWinRate: 88, averageRoi: 145 },
    { address: '0xBE0eB53F46cd790Cd13851d5EFf43D12404d33E8', label: 'Binance 8 Wallet', category: 'Institution', historicalWinRate: 75, averageRoi: 62 },
    { address: '0x53d6118667e54f0c707538290fa16e1e8dd489aa', label: 'Amber Group Wallet', category: 'Venture Capital', historicalWinRate: 72, averageRoi: 48 },
    { address: '0x6550cf605d8f6cc3e387bc6a4ca2b07ef94fe3d1', label: 'a16z Crypto', category: 'Venture Capital', historicalWinRate: 69, averageRoi: 95 }
  ];

  private static readonly ERC20_TRANSFER_TOPIC = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';

  public static async getProvider(): Promise<ethers.JsonRpcProvider> {
    if (this.provider) return this.provider;

    for (const rpc of this.FALLBACK_RPCS) {
      try {
        const testProvider = new ethers.JsonRpcProvider(rpc, undefined, { staticNetwork: true });
        await testProvider.getNetwork();
        this.provider = testProvider;
        return this.provider;
      } catch {
        continue;
      }
    }
    throw new Error('[Tracker] Critical Node Failure: All public HTTP RPC gateways are unreachable.');
  }

  /**
   * Only triggers Qwen completions for high-value on-chain movements
   */
  private static async getSignalExplanation(
    tx: LiveTransaction,
    wallet: TrackedWallet,
    assetSymbol: string
  ): Promise<string> {
    const amountVal = parseFloat(tx.valueEth);

    if (amountVal < 100) {
      return `${wallet.label} transferred ${tx.valueEth} ${assetSymbol}. Standard on-chain capital allocation.`;
    }

    const systemPrompt = `You are the lead quantitative blockchain intelligence engine for the Bitget AI Base Camp.
Write a concise, one-sentence retail narrative explaining this transaction.`;

    const userPrompt = `Wallet: ${wallet.label} (${wallet.category}) transferred ${tx.valueEth} ${assetSymbol}. Hash: ${tx.hash}`;

    try {
      return await QwenService.analyzeMarketData(systemPrompt, userPrompt);
    } catch {
      return `${wallet.label} transferred ${tx.valueEth} ${assetSymbol}. Capital reallocation observed.`;
    }
  }

  public static async scanBlock(blockNumber: number): Promise<SmartMoneySignal[]> {
    const signals: SmartMoneySignal[] = [];

    try {
      const activeProvider = this.isUsingWebSocket && this.wsProvider ? this.wsProvider : await this.getProvider();
      const block = await activeProvider.getBlock(blockNumber, true);
      if (!block) return [];

      const blockTimestamp = block.timestamp * 1000;

      // Scan Native ETH
      if (block.prefetchedTransactions) {
        for (const tx of block.prefetchedTransactions) {
          if (!tx.to || !tx.from) continue;

          const matchedWallet = this.WATCHED_WALLETS.find(
            w => w.address.toLowerCase() === tx.to?.toLowerCase() || w.address.toLowerCase() === tx.from?.toLowerCase()
          );

          const valEth = parseFloat(ethers.formatEther(tx.value));

          // Enforce 50 ETH Minimum Value Floor to prevent dust/0 ETH alert spamming
          if (valEth >= 50) {
            const matched = matchedWallet || {
              address: tx.from,
              label: `Whale Wallet (${tx.from.substring(0, 6)}...${tx.from.substring(38)})`,
              category: 'Whale' as const
            };

            const liveTx: LiveTransaction = {
              hash: tx.hash,
              from: tx.from,
              to: tx.to,
              valueEth: valEth.toFixed(4),
              blockNumber,
              timestamp: blockTimestamp,
              gasPriceGwei: tx.gasPrice ? ethers.formatUnits(tx.gasPrice, 'gwei') : '0'
            };

            const explanation = await this.getSignalExplanation(liveTx, matched, 'ETH');

            signals.push({
              transactionHash: liveTx.hash,
              walletLabel: matched.label,
              walletCategory: matched.category,
              action: tx.to.toLowerCase() === matched.address.toLowerCase() ? 'BUY' : 'SELL',
              asset: 'ETH',
              amount: liveTx.valueEth,
              confidenceScore: valEth > 500 ? 95 : 75,
              impactScore: valEth > 500 ? 85 : 55,
              riskScore: 30,
              aiExplanation: explanation,
              timestamp: liveTx.timestamp
            });
          }
        }
      }

      // Scan ERC-20
      const logs = await activeProvider.getLogs({
        fromBlock: blockNumber,
        toBlock: blockNumber,
        topics: [this.ERC20_TRANSFER_TOPIC]
      });

      for (const log of logs) {
        if (log.topics.length < 3) continue;

        const fromAddress = ethers.getAddress('0x' + log.topics[1].substring(26));
        const toAddress = ethers.getAddress('0x' + log.topics[2].substring(26));

        const matchedWallet = this.WATCHED_WALLETS.find(
          w => w.address.toLowerCase() === fromAddress.toLowerCase() || w.address.toLowerCase() === toAddress.toLowerCase()
        );

        if (matchedWallet) {
          try {
            const tokenData = await DexScreenerService.getTokenData(log.address);
            if (!tokenData) continue;

            const amountRaw = ethers.toBigInt(log.data === '0x' ? '0' : log.data);
            if (amountRaw === 0n) continue;

            const decimals = 18; 
            const formattedAmount = ethers.formatUnits(amountRaw, decimals);

            // Enforce a strict valuation limit to prevent any ERC-20 dust spamming
            if (parseFloat(formattedAmount) < 10) continue;

            const liveTx: LiveTransaction = {
              hash: log.transactionHash,
              from: fromAddress,
              to: toAddress,
              valueEth: parseFloat(formattedAmount).toFixed(4),
              blockNumber,
              timestamp: blockTimestamp,
              gasPriceGwei: '0'
            };

            const explanation = await this.getSignalExplanation(liveTx, matchedWallet, tokenData.symbol);

            signals.push({
              transactionHash: log.transactionHash,
              walletLabel: matchedWallet.label,
              walletCategory: matchedWallet.category,
              action: toAddress.toLowerCase() === matchedWallet.address.toLowerCase() ? 'BUY' : 'SELL',
              asset: tokenData.symbol,
              amount: liveTx.valueEth,
              confidenceScore: 80,
              impactScore: 60,
              riskScore: 35,
              aiExplanation: explanation,
              timestamp: liveTx.timestamp
            });

          } catch {
            // Absorb log errors
          }
        }
      }

    } catch {
      // Absorb scan errors
    }

    return signals;
  }

  private static async startHttpFallback(callback: (signals: SmartMoneySignal[]) => void): Promise<void> {
    try {
      this.isUsingWebSocket = false;
      const provider = await this.getProvider();
      provider.on('block', async (blockNumber: number) => {
        try {
          const signals = await this.scanBlock(blockNumber);
          if (signals.length > 0) callback(signals);
        } catch {}
      });
    } catch {}
  }

  public static async startLiveScanner(callback: (signals: SmartMoneySignal[]) => void): Promise<void> {
    if (this.activeTracking) return;
    this.activeTracking = true;

    for (const wss of this.FALLBACK_WSS) {
      try {
        const wsNode = new ethers.WebSocketProvider(wss);
        await wsNode.getNetwork();

        this.wsProvider = wsNode;
        this.isUsingWebSocket = true;
        console.log(`[Tracker] WebSocket connection active: ${wss}`);

        this.wsProvider.on('block', async (blockNumber: number) => {
          try {
            const signals = await this.scanBlock(blockNumber);
            if (signals.length > 0) callback(signals);
          } catch {}
        });

        const websocketConnection = (this.wsProvider.websocket as any);
        if (websocketConnection) {
          websocketConnection.addEventListener('close', () => {
            this.wsProvider?.destroy();
            this.startHttpFallback(callback);
          });
          websocketConnection.addEventListener('error', () => {
            this.wsProvider?.destroy();
            this.startHttpFallback(callback);
          });
        }
        return;
      } catch {
        continue;
      }
    }
    await this.startHttpFallback(callback);
  }
}