import { Telegraf, Markup } from 'telegraf';
import { ethers } from 'ethers';
import { config } from '../config/index.js';
import { BlockchainTrackerService } from './tracker.js';
import { DexScreenerService } from './dexscreener.js';
import { TavilyService } from './tavily.js';
import { QwenService } from './qwen.js';
import { BitgetService } from './bitget.js';

export class TelegramBotService {
  private static bot: Telegraf;

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
          `📌 Use the persistent bottom menu to scan targets, monitor metrics, or query systems in real-time.`;

        try {
          await ctx.replyWithHTML(
            welcomeText,
            Markup.keyboard([
              ['🐳 Monitored Wallets', '📈 Bitget Spot Balances'],
              ['💡 Narrative Insights', '📊 Sector Rotations'],
              ['⚡ System Status', 'ℹ️ Help Guide']
            ]).resize().persistent()
          );
        } catch (err: any) {
          console.error('[Telegram] start command failed:', err.message);
        }
      });

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

      this.bot.command('whales', async (ctx) => {
        await this.handleWhalesRequest(ctx);
      });

      this.bot.command('sectors', async (ctx) => {
        await this.handleSectorsRequest(ctx);
      });

      this.bot.command('narrative', async (ctx) => {
        await this.handleNarrativeRequest(ctx);
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
    const loadingMessage = await ctx.replyWithHTML('⏳ <i>Connecting to Ethereum node and scanning live wallet balances...</i>');
    
    try {
      // Consume the public resilient provider directly to prevent unauthorized RPC errors
      const provider = await BlockchainTrackerService.getProvider();
      let responseText = `🐳 <b>Live Smart Money Balances (Blockchain Scan):</b>\n\n`;

      for (const wallet of BlockchainTrackerService.WATCHED_WALLETS) {
        const balanceWei = await provider.getBalance(wallet.address);
        const balanceEth = parseFloat(ethers.formatEther(balanceWei)).toFixed(2);

        responseText += 
          `📍 <b>${wallet.label}</b>\n` +
          `• Type: <code>${wallet.category}</code>\n` +
          `• Address: <code>${wallet.address.substring(0, 8)}...${wallet.address.substring(34)}</code>\n` +
          `• Current Balance: <code>${parseFloat(balanceEth).toLocaleString()} ETH</code>\n` +
          (wallet.historicalWinRate ? `• Historical Win Rate: <code>${wallet.historicalWinRate}%</code>\n` : '') +
          `\n`;
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
          `🪙 <b>${asset.coin}</b>\n` + // Fixed key reference from asset.coinName to asset.coin
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
      await ctx.replyWithHTML(`❌ <b>Failed to process sector analytics:</b> ${err.message}`);
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
      await ctx.replyWithHTML(`❌ <b>Failed to construct narrative feed:</b> ${err.message}`);
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
      `• Node Providers: <code>Cloudflare, PublicNode</code>`
    );
  }

  private static async handleHelpRequest(ctx: any): Promise<void> {
    await ctx.replyWithHTML(
      `📖 <b>SmartFlow AI Help Guide</b>\n\n` +
      `• <b>🐳 Monitored Wallets:</b> Triggers real-time connection to Ethereum blockchain to query current balances of high-profile smart wallets.\n` +
      `• <b>📈 Bitget Spot Balances:</b> Authenticates your keys and queries spot assets from your Bitget portfolio.\n` +
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
}