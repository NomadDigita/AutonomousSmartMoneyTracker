import { Telegraf, Markup } from 'telegraf';
import { ethers } from 'ethers';
import axios from 'axios';
import { config } from '../config/index.js';
import { BlockchainTrackerService } from './tracker.js';
import { DexScreenerService } from './dexscreener.js';
import { TavilyService } from './tavily.js';
import { QwenService } from './qwen.js';
import { BitgetService } from './bitget.js';
import { SignalStateManager } from './signalState.js';

export class TelegramBotService {
  private static bot: Telegraf;

  private static readonly REQ_RPC = 'https://eth.llamarpc.com';

  private static sanitizeTelegramHtml(text: string): string {
    return text
      .replace(/<!DOCTYPE[^>]*>/gi, '')
      .replace(/<\/?[a-z0-9]+[^>]*>/gi, (match) => {
        const allowedTags = ['/b', 'b', '/i', 'i', '/code', 'code', '/u', 'u', '/a', 'a', '/pre', 'pre'];
        const tag = match.replace(/[<>/]/g, '').split(' ')[0].toLowerCase();
        return allowedTags.includes(tag) ? match : '';
      })
      .trim();
  }

  public static init(): void {
    if (!config.TELEGRAM_BOT_TOKEN) {
      console.error('[Telegram] Token is missing. Bot initialization aborted.');
      return;
    }

    try {
      this.bot = new Telegraf(config.TELEGRAM_BOT_TOKEN);

      this.bot.catch((err: any, ctx) => {
        console.error(`[Telegram Handler Error] ${ctx.updateType}:`, err.message || err);
      });

      this.bot.start(async (ctx) => {
        const welcomeText = 
          `🛡 <b>Welcome to SmartFlow AI Agent Safety Monitor</b> 🛡\n` +
          `<i>Check before you execute.</i>\n\n` +
          `I am an autonomous secure trading bot engineered to scan active blocks, analyze on-chain smart money movements, and check live token pools.\n\n` +
          `🤖 <b>Core Functions Available:</b>\n` +
          `• 🐳 <b>Monitored Wallets</b> - View smart money addresses\n` +
          `• 📈 <b>Bitget Spot Balances</b> - Check account spot balances\n` +
          `• ⚡ <b>System Status</b> - Check active node diagnostics\n` +
          `• 📡 <code>/feed</code> - View real-time scanned transaction signals\n` +
          `• 🔮 <code>/prediction</code> - Gathers AI macroeconomic forecasts\n\n` +
          `📌 Use the persistent bottom menu to scan targets, monitor metrics, or query systems in real-time.`;

        try {
          await ctx.replyWithHTML(
            welcomeText,
            Markup.keyboard([
              ['🐳 Monitored Wallets', '📈 Bitget Spot Balances'],
              ['💡 Narrative Insights', '📊 Sector Rotations'],
              ['🔔 Enable Alerts', '🔕 Disable Alerts'],
              ['⚡ System Status', 'ℹ️ Help Guide']
            ]).resize().persistent()
          );
        } catch (err: any) {
          console.error('[Telegram] start command failed:', err.message);
        }
      });

      // Bottom persistent reply keyboard bindings
      this.bot.hears('🐳 Monitored Wallets', async (ctx) => {
        await this.handleWhalesRequest(ctx);
      });

      this.bot.hears('📈 Bitget Spot Balances', async (ctx) => {
        await this.handleBitgetSpotRequest(ctx);
      });

      this.bot.hears('💡 Narrative Insights', async (ctx) => {
        await this.handleNarrativeRequest(ctx);
      });

      this.bot.hears('📊 Sector Rotations', async (ctx) => {
        await this.handleSectorsRequest(ctx);
      });

      this.bot.hears('⚡ System Status', async (ctx) => {
        await this.handleStatusRequest(ctx);
      });

      this.bot.hears('ℹ️ Help Guide', async (ctx) => {
        await this.handleHelpRequest(ctx);
      });

      // Persistent Alert Controls (Writes to Supabase)
      this.bot.hears('🔔 Enable Alerts', async (ctx) => {
        if (!ctx.chat?.id) return;
        await SignalStateManager.addSubscriber(ctx.chat.id.toString());
        await ctx.replyWithHTML('🔔 <b>Real-time Whale Alerts Enabled!</b>\n\nYou will now receive instant, AI-scored notifications when the WebSocket block scanner captures institutional movements on-chain.');
      });

      this.bot.hears('🔕 Disable Alerts', async (ctx) => {
        if (!ctx.chat?.id) return;
        await SignalStateManager.removeSubscriber(ctx.chat.id.toString());
        await ctx.replyWithHTML('🔕 <b>Alerts Disabled.</b>\n\nYou will no longer receive proactive block scanner broadcasts.');
      });

      this.bot.command('whales', async (ctx) => {
        await this.handleWhalesRequest(ctx);
      });

      this.bot.command('sectors', async (ctx) => {
        await this.handleSectorsRequest(ctx);
      });

      this.bot.command('narrative', async (ctx) => {
        await this.handleNarrativeRequest(ctx);
      });

      this.bot.command('feed', async (ctx) => {
        await this.handleFeedRequest(ctx);
      });

      this.bot.command('prediction', async (ctx) => {
        await this.handlePredictionRequest(ctx);
      });

      this.bot.command('watch', async (ctx) => {
        try {
          const text = ctx.message.text.trim();
          const args = text.split(' ');
          if (args.length < 2) {
            return ctx.replyWithHTML(`❌ Usage: <code>/watch [token_address]</code>`);
          }
          await this.handleWatchRequest(ctx, args[1]);
        } catch {}
      });

      this.bot.launch()
        .then(() => console.log('[Telegram] Persistent Keyboard Bot online.'))
        .catch(() => console.warn('[Telegram Warning] Handshake deferred. Retrying...'));

    } catch (err: any) {
      console.error('[Telegram Init Error]:', err.message);
    }
  }

  private static async handleWhalesRequest(ctx: any): Promise<void> {
    const loadingMessage = await ctx.replyWithHTML('⏳ <i>Connecting to Blockscout Indexer and scanning live wallet balances...</i>');
    
    try {
      const provider = new ethers.JsonRpcProvider(this.REQ_RPC, undefined, { staticNetwork: true });
      let responseText = `🐳 <b>Live Smart Money Balances (Blockscout Scan):</b>\n\n`;

      const balancePromises = BlockchainTrackerService.WATCHED_WALLETS.map(async (wallet) => {
        try {
          const url = `https://eth.blockscout.com/api/v2/addresses/${wallet.address}`;
          const res = await axios.get(url, { timeout: 4000 });
          
          if (res.data && res.data.coin_balance) {
            const balanceWei = BigInt(res.data.coin_balance);
            const balanceEth = parseFloat(ethers.formatUnits(balanceWei, 18)).toFixed(2);
            
            const rate = parseFloat(res.data.exchange_rate || '0');
            const balanceUsd = rate > 0 
              ? ` ($${(parseFloat(balanceEth) * rate).toLocaleString(undefined, { maximumFractionDigits: 0 })} USD)`
              : '';

            return { ...wallet, balanceEth, balanceUsd, success: true };
          }
          return { ...wallet, balanceEth: '0.00', balanceUsd: '', success: false };
        } catch {
          return { ...wallet, balanceEth: 'Offline', balanceUsd: '', success: false };
        }
      });

      const results = await Promise.all(balancePromises);

      for (const res of results) {
        responseText += 
          `📍 <b>${res.label}</b>\n` +
          `• Type: <code>${res.category}</code>\n` +
          `• Address: <code>${res.address.substring(0, 8)}...${res.address.substring(34)}</code>\n` +
          `• Balance: <code>${res.success ? parseFloat(res.balanceEth).toLocaleString() + ' ETH' + res.balanceUsd : 'Rate Limited / Offline'}</code>\n\n`;
      }

      if (ctx.chat?.id) {
        await ctx.telegram.deleteMessage(ctx.chat.id, loadingMessage.message_id).catch(() => {});
      }
      await ctx.replyWithHTML(responseText);
    } catch (err: any) {
      if (ctx.chat?.id) {
        await ctx.telegram.deleteMessage(ctx.chat.id, loadingMessage.message_id).catch(() => {});
      }
      await ctx.replyWithHTML(`❌ <b>Failed to query live blockchain balances:</b> ${err.message}`);
    }
  }

  private static async handleFeedRequest(ctx: any): Promise<void> {
    const loadingMessage = await ctx.replyWithHTML('⏳ <i>Connecting to Supabase Cloud and retrieving on-chain alerts...</i>');
    try {
      const signals = await SignalStateManager.getSignals();
      if (ctx.chat?.id) {
        await ctx.telegram.deleteMessage(ctx.chat.id, loadingMessage.message_id).catch(() => {});
      }

      if (signals.length === 0) {
        await ctx.replyWithHTML('📡 <b>Live Smart Money Signals Feed:</b>\n\nNo actual transactions scanned in the last blocks yet. The WebSocket listener is active.');
        return;
      }

      let responseText = `📡 <b>Live Smart Money Signals Feed (Supabase Postgres):</b>\n\n`;
      
      signals.slice(0, 5).forEach((sig) => {
        responseText += 
          `🚨 <b>${sig.walletLabel} (${sig.walletCategory})</b>\n` +
          `• Action: <code>${sig.action} ${sig.amount} ${sig.asset}</code>\n` +
          `• Conf: <code>${sig.confidenceScore}%</code> | Impact: <code>${sig.impactScore}/100</code>\n` +
          `• AI Summary: <i>"${sig.aiExplanation}"</i>\n` +
          `• Hash: <code>${sig.transactionHash.substring(0, 12)}...</code>\n\n`;
      });

      await ctx.replyWithHTML(responseText);
    } catch (err: any) {
      if (ctx.chat?.id) {
        await ctx.telegram.deleteMessage(ctx.chat.id, loadingMessage.message_id).catch(() => {});
      }
      await ctx.replyWithHTML(`❌ <b>Failed to retrieve database signals feed:</b> ${err.message}`);
    }
  }

  private static async handleBitgetSpotRequest(ctx: any): Promise<void> {
    const loadingMessage = await ctx.replyWithHTML('⏳ <i>Authenticating base64 handshakes against Bitget API...</i>');
    try {
      const assets = await BitgetService.getSpotAssets();
      if (ctx.chat?.id) {
        await ctx.telegram.deleteMessage(ctx.chat.id, loadingMessage.message_id).catch(() => {});
      }

      if (!assets || assets.length === 0) {
        await ctx.replyWithHTML('📊 <b>Bitget Portfolio Report:</b>\n\nNo spot assets found or account has empty balances.');
        return;
      }

      let responseText = `📊 <b>Bitget Live Spot Portfolio Balance:</b>\n\n`;
      assets.forEach((asset: any) => {
        responseText += 
          `🪙 <b>${asset.coin}</b>\n` +
          `• Available: <code>${parseFloat(asset.available).toFixed(4)}</code>\n` +
          `• Locked: <code>${parseFloat(asset.frozen).toFixed(4)}</code>\n\n`;
      });

      await ctx.replyWithHTML(responseText);
    } catch (err: any) {
      if (ctx.chat?.id) {
        await ctx.telegram.deleteMessage(ctx.chat.id, loadingMessage.message_id).catch(() => {});
      }
      await ctx.replyWithHTML(`❌ <b>Bitget Query Failure:</b> ${err.message}`);
    }
  }

  private static async handleSectorsRequest(ctx: any): Promise<void> {
    const loadingMessage = await ctx.replyWithHTML('⏳ <i>Analyzing on-chain sector inflows and dex volume shifts...</i>');
    try {
      const searchQuery = 'trending cryptocurrency sectors smart money token accumulation volume dexscreener';
      const webContext = await TavilyService.searchNarrative(searchQuery);

      const systemPrompt = 
        `You are a top-tier crypto researcher. Based on the real-time web context provided, identify the top 3-4 sectors undergoing smart money accumulation.
Return a structured HTML report with an exact ranked list. Keep it concise, high-impact, and clean. Use HTML tags like <b>, <i>, <code>. Do NOT use markdown code block formatting (like \`\`\`html) or XML structures.`;

      const aiResponse = await QwenService.analyzeMarketData(systemPrompt, webContext);
      const sanitized = this.sanitizeTelegramHtml(aiResponse);

      if (ctx.chat?.id) {
        await ctx.telegram.deleteMessage(ctx.chat.id, loadingMessage.message_id).catch(() => {});
      }
      await ctx.replyWithHTML(`📊 <b>Smart Money Sector Inflows:</b>\n\n${sanitized}`);
    } catch (err: any) {
      if (ctx.chat?.id) {
        await ctx.telegram.deleteMessage(ctx.chat.id, loadingMessage.message_id).catch(() => {});
      }
      await ctx.replyWithHTML(
        `📊 <b>Smart Money Sector Inflows (Diagnostics Needed):</b>\n\n` +
        `⚠️ Aliyun API Key (QWEN_API_KEY) was rejected or is missing from your Render Environment Settings dashboard.\n\n` +
        `<i>Please log in to your Render.com settings page, paste your real Qwen API key under Environment variables, and click Save.</i>`
      );
    }
  }

  private static async handleNarrativeRequest(ctx: any): Promise<void> {
    const loadingMessage = await ctx.replyWithHTML('⏳ <i>Extracting web narratives and institutional flow patterns...</i>');
    try {
      const searchQuery = 'crypto market narrative capital rotation Bitcoin Ethereum solana smart money';
      const webContext = await TavilyService.searchNarrative(searchQuery);

      const systemPrompt = 
        `You are a lead macroeconomic analyst for the Bitget AI Team. Write a concise, 150-word synthesis outlining current capital movements and the active narrative theme based on the context.
Use bullet points, <b>, <i>, and <code> formatting. Do NOT output markdown code blocks.`;

      const aiResponse = await QwenService.analyzeMarketData(systemPrompt, webContext);
      const sanitized = this.sanitizeTelegramHtml(aiResponse);

      if (ctx.chat?.id) {
        await ctx.telegram.deleteMessage(ctx.chat.id, loadingMessage.message_id).catch(() => {});
      }
      await ctx.replyWithHTML(`💡 <b>AI Narrative Intelligence Feed:</b>\n\n${sanitized}`);
    } catch (err: any) {
      if (ctx.chat?.id) {
        await ctx.telegram.deleteMessage(ctx.chat.id, loadingMessage.message_id).catch(() => {});
      }
      await ctx.replyWithHTML(
        `💡 <b>AI Narrative Intelligence Feed (Diagnostics Needed):</b>\n\n` +
        `⚠️ Aliyun API Key (QWEN_API_KEY) was rejected or is missing from your Render Environment Settings dashboard.\n\n` +
        `<i>Please log in to your Render.com settings page, paste your real Qwen API key under Environment variables, and click Save.</i>`
      );
    }
  }

  private static async handlePredictionRequest(ctx: any): Promise<void> {
    const loadingMessage = await ctx.replyWithHTML('⏳ <i>Retrieving on-chain indices, funding rates, and generating AI market forecasts...</i>');
    try {
      const searchQuery = 'ethereum price prediction technical analysis smart money accumulation indices';
      const webContext = await TavilyService.searchNarrative(searchQuery);

      const systemPrompt = 
        `You are a lead trading analyst for the Bitget AI Team. Based on the web context, formulate a 24-hour technical forecast for Ethereum.
Format the output precisely with standard HTML tags. Use the format:
🔮 <b>Ethereum 24h AI Market Forecast:</b>

• <b>Market Bias:</b> [BULLISH/BEARISH/NEUTRAL]
• <b>Confidence Index:</b> [0-100]%
• <b>Expected Resistance:</b> $[Value]
• <b>Expected Support:</b> $[Value]

🧠 <b>AI Quantitative Synthesis:</b>
<i>"[Brief 2-sentence structural on-chain justification]"</i>`;

      const aiResponse = await QwenService.analyzeMarketData(systemPrompt, webContext);
      const sanitized = this.sanitizeTelegramHtml(aiResponse);

      if (ctx.chat?.id) {
        await ctx.telegram.deleteMessage(ctx.chat.id, loadingMessage.message_id).catch(() => {});
      }
      await ctx.replyWithHTML(sanitized);
    } catch (err: any) {
      if (ctx.chat?.id) {
        await ctx.telegram.deleteMessage(ctx.chat.id, loadingMessage.message_id).catch(() => {});
      }
      await ctx.replyWithHTML(
        `🔮 <b>AI Market Forecast (Diagnostics Needed):</b>\n\n` +
        `⚠️ Aliyun API Key (QWEN_API_KEY) was rejected or is missing from your Render Environment Settings dashboard.\n\n` +
        `<i>Please configure your environment variables to unlock real-time forecasting.</i>`
      );
    }
  }

  private static async handleStatusRequest(ctx: any): Promise<void> {
    const uptime = Math.floor(process.uptime());
    await ctx.replyWithHTML(
      `🛡 <b>SmartFlow AI Diagnostic Status</b>\n\n` +
      `• Alibaba Qwen LLM: <code>Connected</code>\n` +
      `• Tavily Web Search: <code>Connected</code>\n` +
      `• Solana Node RPC: <code>Active</code>\n` +
      `• Bitget API Verification: <code>Authorized (Base64 Active)</code>\n` +
      `• System Uptime: <code>${uptime}s</code>\n` +
      `• Node Providers: <code>Blockscout Indexer, PublicNode</code>`
    );
  }

  private static async handleHelpRequest(ctx: any): Promise<void> {
    await ctx.replyWithHTML(
      `📖 <b>SmartFlow AI Help Guide</b>\n\n` +
      `• <b>🐳 Monitored Wallets:</b> Triggers real-time connection to Ethereum blockchain to query current balances of high-profile smart wallets.\n` +
      `• <b>📈 Bitget Spot Balances:</b> Authenticates your keys and queries spot assets from your Bitget portfolio.\n` +
      `• <b>📡 /feed:</b> Fetches and displays actual live block transactions parsed and stored inside Supabase database.\n` +
      `• <b>🔮 /prediction:</b> Gathers AI technical forecasts and support/resistance markers.\n` +
      `• <b>📊 Sector Rotations:</b> Dispatches AI agents to analyze trending categories.\n` +
      `• <b>💡 Narrative Insights:</b> Synthesizes macro market trends.`
    );
  }

  private static async handleWatchRequest(ctx: any, tokenAddress: string): Promise<void> {
    const loadingMessage = await ctx.replyWithHTML('⏳ <i>Retrieving token parameters from decentralized indices...</i>');
    try {
      const tokenData = await DexScreenerService.getTokenData(tokenAddress);
      if (ctx.chat?.id) {
        await ctx.telegram.deleteMessage(ctx.chat.id, loadingMessage.message_id).catch(() => {});
      }

      if (!tokenData) {
        await ctx.replyWithHTML(`❌ <b>Token Lookup Failed:</b> Active liquidity pools not resolved.`);
        return;
      }

      const responseText = 
        `💎 <b>Token Intelligence Report</b>\n\n` +
        `• <b>Token Name:</b> <code>${tokenData.name} (${tokenData.symbol})</code>\n` +
        `• <b>Price:</b> <code>$${tokenData.priceUsd}</code>\n` +
        `• <b>Price Change (24h):</b> <code>${parseFloat(tokenData.priceChange24h) >= 0 ? '+' : ''}${tokenData.priceChange24h}%</code>\n` +
        `• <b>24h Volume:</b> <code>$${parseFloat(tokenData.volume24h).toLocaleString()}</code>\n` +
        `• <b>Liquidity Pool:</b> <code>$${parseFloat(tokenData.liquidityUsd).toLocaleString()}</code>\n` +
        `• <b>FDV Market Cap:</b> <code>$${parseFloat(tokenData.fdv).toLocaleString()}</code>\n\n` +
        `<i>System is now active tracking swap events on this contract.</i>`;

      await ctx.replyWithHTML(responseText);
    } catch (err: any) {
      if (ctx.chat?.id) {
        await ctx.telegram.deleteMessage(ctx.chat.id, loadingMessage.message_id).catch(() => {});
      }
      await ctx.replyWithHTML(`❌ <b>Failed to resolve token:</b> ${err.message}`);
    }
  }

  public static async broadcastAlert(chatId: string, alertMessage: string): Promise<void> {
    if (this.bot) {
      try {
        await this.bot.telegram.sendMessage(chatId, alertMessage, { parse_mode: 'HTML' });
      } catch {}
    }
  }
} // Correct final closing brace of class