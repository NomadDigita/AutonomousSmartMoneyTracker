import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

interface Config {
  PORT: number;
  NODE_ENV: string;
  TELEGRAM_BOT_TOKEN: string;
  BITGET_API_KEY: string;
  BITGET_SECRET_KEY: string;
  BITGET_PASSPHRASE: string;
  MULERUN_API_KEY: string;
  TAVILY_API_KEY: string;
  QWEN_API_KEY: string;
  ETH_MAINNET_RPC: string;
  SOLANA_MAINNET_RPC: string;
}

const requiredEnv = [
  'TELEGRAM_BOT_TOKEN',
  'BITGET_API_KEY',
  'BITGET_SECRET_KEY',
  'BITGET_PASSPHRASE',
  'MULERUN_API_KEY',
  'TAVILY_API_KEY',
  'QWEN_API_KEY'
];

for (const key of requiredEnv) {
  if (!process.env[key]) {
    throw new Error(`Critical Environment Setup Missing: ${key} is not defined in backend configuration.`);
  }
}

// Automatically sanitizes and trims hidden carriage returns (\r) or spaces from Windows environments
const sanitize = (val: string | undefined): string => {
  if (!val) return '';
  return val.replace(/[\r\n]/g, '').trim();
};

export const config: Config = {
  PORT: parseInt(process.env.PORT || '5000', 10),
  NODE_ENV: sanitize(process.env.NODE_ENV) || 'development',
  TELEGRAM_BOT_TOKEN: sanitize(process.env.TELEGRAM_BOT_TOKEN),
  BITGET_API_KEY: sanitize(process.env.BITGET_API_KEY),
  BITGET_SECRET_KEY: sanitize(process.env.BITGET_SECRET_KEY),
  BITGET_PASSPHRASE: sanitize(process.env.BITGET_PASSPHRASE),
  MULERUN_API_KEY: sanitize(process.env.MULERUN_API_KEY),
  TAVILY_API_KEY: sanitize(process.env.TAVILY_API_KEY),
  QWEN_API_KEY: sanitize(process.env.QWEN_API_KEY),
  ETH_MAINNET_RPC: sanitize(process.env.ETH_MAINNET_RPC) || 'https://cloudflare-eth.com',
  SOLANA_MAINNET_RPC: sanitize(process.env.SOLANA_MAINNET_RPC) || 'https://api.mainnet-beta.solana.com'
};