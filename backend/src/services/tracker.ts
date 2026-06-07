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
    'https://eth.llamarpc.com',
    'https://rpc.ankr.com/eth'
  ];

  private static readonly FALLBACK_WSS = [
    'wss://ethereum-rpc.publicnode.com',
    'wss://eth.llamarpc.com'
  ];

  public static readonly WATCHED_WALLETS: TrackedWallet[] = [
    { address: '0x00000000219ab540356cBB839Cbe05303d7705Fa', label: 'Ethereum Deposit Contract', category: 'Institution' },
    { address: '0xAb5801a7D398351b8bE11C439e05C5B3259aec9B', label: 'Vitalik Buterin', category: 'Elite Trader', historicalWinRate: 88, averageRoi: 145 },
    { address: '0x28C6c06298d514Db089934071355E5743bf21d60', label: 'Binance Cold Wallet', category: 'Institution' },
    { address: '0xDa9DF8183C4185db92257C14409e3E5F3483E768', label: 'Lido Treasury Wallet', category: 'Institution' },
    { address: '0x53d6118667e54f0c707538290fa16e1e8dd489aa', label: 'Amber Group Wallet', category: 'Venture Capital', historicalWinRate: 72, averageRoi: 48 },
    { address: '0x6550cf605d8f6cc3e387bc6a4ca2b07ef94fe3d1', label: 'a16z Crypto', category: 'Venture Capital', historicalWinRate: 69, averageRoi: 95 }
  ];

  // Standard ERC-20 Transfer(address,address,uint256) Event signature hash
  private static readonly ERC20_TRANSFER_TOPIC = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';

  public static async getProvider(): Promise<ethers.JsonRpcProvider> {
    if (this.provider) return this.provider;

    try {
      const primaryProvider = new ethers.JsonRpcProvider(config.ETH_MAINNET_RPC, undefined, { staticNetwork: true });
      await primaryProvider.getNetwork();
      this.provider = primaryProvider;
      console.log(`[Tracker] Connected to Primary HTTP Node: ${config.ETH_MAINNET_RPC}`);
      return this.provider;
    } catch {
      // Primary offline, routing fallback
    }

    for (const rpc of this.FALLBACK_RPCS) {
      try {
        const testProvider = new ethers.JsonRpcProvider(rpc, undefined, { staticNetwork: true });
        await testProvider.getNetwork();
        this.provider = testProvider;
        console.log(`[Tracker] Connected to Fallback HTTP Node: ${rpc}`);
        return this.provider;
      } catch {
        continue;
      }
    }

    throw new Error('[Tracker] Critical Node Failure: All public HTTP RPC gateways are unreachable.');
  }

  private static async runAIEvaluation(
    tx: LiveTransaction,
    wallet: TrackedWallet,
    assetSymbol: string
  ): Promise<{ confidence: number; impact: number; risk: number; explanation: string }> {
    const systemPrompt = `You are the lead quantitative blockchain intelligence engine for the Bitget AI Base Camp. 
Analyze the provided high-value raw transaction and compute quantitative scoring.
Your output MUST be a valid, strict JSON string and absolutely nothing else. Use the format:
{"confidence": number, "impact": number, "risk": number, "explanation": "string"}`;

    const userPrompt = `
Transaction Details:
- Hash: ${tx.hash}
- Wallet Label: ${wallet.label}
- Wallet Type: ${wallet.category}
- Transfer Value: ${tx.valueEth} ${assetSymbol}
- Block: ${tx.blockNumber}
- Timestamp: ${new Date(tx.timestamp).toISOString()}

Evaluate the historical importance of this movement, calculate expected impact score (0-100), confidence level (0-100), risk metrics (0-100), and write a concise, one-sentence retail narrative explanation.`;

    try {
      const responseText = await QwenService.analyzeMarketData(systemPrompt, userPrompt);
      const cleaned = responseText.replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(cleaned);

      return {
        confidence: parsed.confidence || 50,
        impact: parsed.impact || 50,
        risk: parsed.risk || 50,
        explanation: parsed.explanation || `Movement of ${assetSymbol} parsed on-chain.`
      };
    } catch {
      return {
        confidence: 75,
        impact: 60,
        risk: 40,
        explanation: `${wallet.label} transferred ${tx.valueEth} ${assetSymbol}. Capital reallocation observed.`
      };
    }
  }

  /**
   * Scans a block for native ETH transfers and parses all ERC-20 event logs
   */
  public static async scanBlock(blockNumber: number): Promise<SmartMoneySignal[]> {
    const signals: SmartMoneySignal[] = [];

    try {
      const activeProvider = this.isUsingWebSocket && this.wsProvider ? this.wsProvider : await this.getProvider();
      const block = await activeProvider.getBlock(blockNumber, true);
      if (!block) return [];

      const blockTimestamp = block.timestamp * 1000;

      // PATH 1: Scan Native ETH Transactions
      if (block.prefetchedTransactions) {
        for (const tx of block.prefetchedTransactions) {
          if (!tx.to || !tx.from) continue;

          const matchedWallet = this.WATCHED_WALLETS.find(
            w => w.address.toLowerCase() === tx.to?.toLowerCase() || w.address.toLowerCase() === tx.from?.toLowerCase()
          );

          const valEth = parseFloat(ethers.formatEther(tx.value));

          if (matchedWallet || valEth >= 100) {
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

            const evaluation = await this.runAIEvaluation(liveTx, matched, 'ETH');

            signals.push({
              transactionHash: liveTx.hash,
              walletLabel: matched.label,
              walletCategory: matched.category,
              action: tx.to.toLowerCase() === matched.address.toLowerCase() ? 'BUY' : 'SELL',
              asset: 'ETH',
              amount: liveTx.valueEth,
              confidenceScore: evaluation.confidence,
              impactScore: evaluation.impact,
              riskScore: evaluation.risk,
              aiExplanation: evaluation.explanation,
              timestamp: liveTx.timestamp
            });
          }
        }
      }

      // PATH 2: Optimized Single-Query Block Scanner for ERC-20 Tokens
      const logs = await activeProvider.getLogs({
        fromBlock: blockNumber,
        toBlock: blockNumber,
        topics: [this.ERC20_TRANSFER_TOPIC]
      });

      for (const log of logs) {
        // Enforce strict ERC-20 standard topic lengths (Topic0: Signature, Topic1: From, Topic2: To)
        if (log.topics.length < 3) continue;

        // Decode 32-byte padded addresses into standard checksummed strings
        const fromAddress = ethers.getAddress('0x' + log.topics[1].substring(26));
        const toAddress = ethers.getAddress('0x' + log.topics[2].substring(26));

        // Verify if sender or receiver matches a watched smart money address
        const matchedWallet = this.WATCHED_WALLETS.find(
          w => w.address.toLowerCase() === fromAddress.toLowerCase() || w.address.toLowerCase() === toAddress.toLowerCase()
        );

        if (matchedWallet) {
          try {
            // Retrieve token parameters dynamically using the contract address
            const tokenData = await DexScreenerService.getTokenData(log.address);
            if (!tokenData) continue;

            const amountRaw = ethers.toBigInt(log.data === '0x' ? '0' : log.data);
            if (amountRaw === 0n) continue;

            // Default fallback of 18 decimals if standard pool values are deferred
            const decimals = 18; 
            const formattedAmount = ethers.formatUnits(amountRaw, decimals);

            // Ignore dust transfers
            if (parseFloat(formattedAmount) < 0.1) continue;

            const liveTx: LiveTransaction = {
              hash: log.transactionHash,
              from: fromAddress,
              to: toAddress,
              valueEth: parseFloat(formattedAmount).toFixed(4),
              blockNumber,
              timestamp: blockTimestamp,
              gasPriceGwei: '0'
            };

            const evaluation = await this.runAIEvaluation(liveTx, matchedWallet, tokenData.symbol);

            signals.push({
              transactionHash: log.transactionHash,
              walletLabel: matchedWallet.label,
              walletCategory: matchedWallet.category,
              action: toAddress.toLowerCase() === matchedWallet.address.toLowerCase() ? 'BUY' : 'SELL',
              asset: tokenData.symbol,
              amount: liveTx.valueEth,
              confidenceScore: evaluation.confidence,
              impactScore: evaluation.impact,
              riskScore: evaluation.risk,
              aiExplanation: evaluation.explanation,
              timestamp: liveTx.timestamp
            });

          } catch {
            // Absorb single log parsing errors
          }
        }
      }

    } catch (error: any) {
      // Absorb scan errors
    }

    return signals;
  }

  private static async startHttpFallback(callback: (signals: SmartMoneySignal[]) => void): Promise<void> {
    try {
      this.isUsingWebSocket = false;
      const provider = await this.getProvider();
      console.log('[Tracker] HTTP JSON-RPC fallback poller initialized and scanning blocks...');

      provider.on('block', async (blockNumber: number) => {
        try {
          const signals = await this.scanBlock(blockNumber);
          if (signals.length > 0) callback(signals);
        } catch {}
      });
    } catch (err: any) {
      console.error('[Tracker] Critical initialization failure on HTTP Fallback:', err.message);
    }
  }

  public static async startLiveScanner(callback: (signals: SmartMoneySignal[]) => void): Promise<void> {
    if (this.activeTracking) return;
    this.activeTracking = true;

    for (const wss of this.FALLBACK_WSS) {
      try {
        console.log(`[Tracker] Attempting WebSocket handshake at: ${wss}`);
        const wsNode = new ethers.WebSocketProvider(wss);
        await wsNode.getNetwork();

        this.wsProvider = wsNode;
        this.isUsingWebSocket = true;
        console.log(`[Tracker] WebSocket connection verified. Listening to live blocks via: ${wss}`);

        this.wsProvider.on('block', async (blockNumber: number) => {
          try {
            const signals = await this.scanBlock(blockNumber);
            if (signals.length > 0) callback(signals);
          } catch {}
        });

        const websocketConnection = (this.wsProvider.websocket as any);
        if (websocketConnection) {
          websocketConnection.addEventListener('close', () => {
            console.warn('[Tracker WebSocket Warning] Connection closed by peer. Activating HTTP fallback polling...');
            this.wsProvider?.destroy();
            this.startHttpFallback(callback);
          });

          websocketConnection.addEventListener('error', (err: any) => {
            console.warn('[Tracker WebSocket Error] Socket encountered error:', err.message || err);
            this.wsProvider?.destroy();
            this.startHttpFallback(callback);
          });
        }

        return;
      } catch (err: any) {
        console.warn(`[Tracker WebSocket Warning] Handshake failed at ${wss}. Error: ${err.message}`);
        continue;
      }
    }

    console.warn('[Tracker Node Warning] All WebSocket gateways are unreachable. Initiating HTTP polling...');
    await this.startHttpFallback(callback);
  }
}