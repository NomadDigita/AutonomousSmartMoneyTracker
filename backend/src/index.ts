import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import axios from 'axios';
import { config } from './config/index.js';
import { apiRouter } from './routes/api.js';
import { TelegramBotService } from './services/telegram.js';
import { BlockchainTrackerService } from './services/tracker.js';
import { SignalStateManager } from './services/signalState.js';
import { BitgetService } from './services/bitget.js';
import { AutonomousResearchAgent } from './services/researchAgent.js';

const app = express();

app.use(helmet());

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan(config.NODE_ENV === 'production' ? 'combined' : 'dev'));

app.use('/', apiRouter);

const server = app.listen(config.PORT, () => {
  console.log(`[Server] Core active at http://localhost:${config.PORT} in ${config.NODE_ENV} mode.`);
  
  try {
    // 1. Initialize Telegram bot connection
    TelegramBotService.init();

    // 2. Begin the Live Blockchain Scanner
    BlockchainTrackerService.startLiveScanner(async (signals) => {
      for (const signal of signals) {
        // Push actual live transactions directly to Supabase
        await SignalStateManager.addSignal(signal);

        // Retrieve all registered subscriber Chat IDs
        const subscribers = await SignalStateManager.getSubscribers();

        // Broadcast the live AI transaction alert card to every active subscriber instantly
        for (const sub of subscribers) {
          if (!sub.chat_id) continue;

          const formattedAlert = 
            `🚨 <b>SMART MONEY MOVEMENT DETECTED</b> 🚨\n\n` +
            `• <b>Wallet:</b> <code>${signal.walletLabel}</code>\n` +
            `• <b>Category:</b> <code>${signal.walletCategory}</code>\n` +
            `• <b>Action:</b> <code>${signal.action} ${signal.amount} ${signal.asset}</code>\n` +
            `• <b>Confidence Score:</b> <code>${signal.confidenceScore}%</code>\n` +
            `• <b>Expected Impact:</b> <code>${signal.impactScore}/100</code>\n\n` +
            `🧠 <b>AI Intelligence Analysis:</b>\n` +
            `<i>"${signal.aiExplanation}"</i>\n\n` +
            `🔗 <a href="https://etherscan.io/tx/${signal.transactionHash}">View Transaction on Etherscan</a>`;

          // Explicitly converts dynamic parameters to a strict string to satisfy the compiler
          await TelegramBotService.broadcastAlert(sub.chat_id.toString(), formattedAlert);
        }

        // Executes a matching spot buy order on your real Bitget portfolio automatically on Buy signals
        if (signal.action === 'BUY' && signal.confidenceScore >= 80) {
          console.log(`[Autonomous Agent] High-confidence smart money BUY detected. Initiating Bitget copy-trade for ${signal.asset}...`);
          try {
            const tradeSize = '2.0'; 
            const orderResult = await BitgetService.placeSpotOrder(
              `${signal.asset}USDT`,
              'buy',
              'market',
              tradeSize
            );
            console.log(`[Autonomous Agent] Trade Executed Successfully! Order ID: ${orderResult.orderId}`);
          } catch (tErr: any) {
            console.error('[Autonomous Agent Error] Automatic trading aborted:', tErr.message);
          }
        }

        console.log(`[Scanner Signal] Captured real transaction from ${signal.walletLabel}.`);
      }
    });

    // 3. Real-Time Self-Ping Keep-Alive Loop: Fires every 5 minutes to prevent your Render container from sleeping
    setInterval(async () => {
      try {
        const selfUrl = 'https://autonomoussmartmoneytracker-qy8s.onrender.com/health';
        await axios.get(selfUrl);
        console.log('[Keep-Alive] Self-ping dispatched successfully to Render node.');
      } catch (err: any) {
        console.warn('[Keep-Alive Warning] Self-ping skipped:', err.message);
      }
    }, 10 * 60 * 1000);

    // 4. 6-Hour Autonomous Research Scheduler: Runs every 6 hours to compile and broadcast the daily macro briefing
    setInterval(async () => {
      console.log('[Scheduler] Executing autonomous 6-hour research sweep...');
      try {
        const report = await AutonomousResearchAgent.executeAutonomousResearch();
        if (report) {
          const subscribers = await SignalStateManager.getSubscribers();
          for (const sub of subscribers) {
            if (!sub.chat_id) continue;
            
            const alertMessage = 
              `🔮 <b>6-HOUR AUTONOMOUS SMART MONEY BRIEFING</b> 🔮\n\n` +
              `<b>${report.title}</b>\n` +
              `• Sentiment Rating: <code>${report.sentiment_rating}</code>\n\n` +
              `${report.report_text}\n\n` +
              `🔗 <a href="https://autonomous-smart-money-tracker.vercel.app/">Open Live Web Dashboard</a>`;
            
            await TelegramBotService.broadcastAlert(sub.chat_id.toString(), alertMessage);
          }
        }
      } catch (err: any) {
        console.error('[Scheduler Error] 6-hour autonomous sweep aborted:', err.message);
      }
    }, 6 * 60 * 60 * 1000); // 6 Hours in milliseconds (21,600,000 ms)

  } catch (err: any) {
    console.error('[Initialization Error]:', err.message);
  }
});

export { app, server };