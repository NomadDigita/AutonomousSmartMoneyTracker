export interface TrackedWallet {
  address: string;
  label: string;
  category: 'Whale' | 'Elite Trader' | 'Venture Capital' | 'Institution';
  historicalWinRate?: number;
  averageRoi?: number;
}

export interface LiveTransaction {
  hash: string;
  from: string;
  to: string;
  valueEth: string;
  blockNumber: number;
  timestamp: number;
  gasPriceGwei: string;
}

export interface TokenMarketData {
  address: string;
  name: string;
  symbol: string;
  priceUsd: string;
  volume24h: string;
  liquidityUsd: string;
  fdv: string;
  priceChange24h: string;
}

export interface SmartMoneySignal {
  transactionHash: string;
  walletLabel: string;
  walletCategory: string;
  action: 'BUY' | 'SELL' | 'TRANSFER';
  asset: string;
  amount: string;
  confidenceScore: number;
  impactScore: number;
  riskScore: number;
  aiExplanation: string;
  timestamp: number;
}