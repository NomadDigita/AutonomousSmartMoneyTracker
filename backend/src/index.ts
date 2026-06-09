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
        // Push actual live transactions directly to the decoupled State Manager
        await SignalStateManager.addSignal(signal);

        // Retrieve all registered subscriber Chat IDs from Supabase database
        const subscribers = await SignalStateManager.getSubscribers();

        // Broadcast the live AI transaction alert card to every active subscriber instantly
        for (const sub of subscribers) {
          if (!sub.chat_id) continue;

          // Safe, verified HTML tags matching Telegram standard rules
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

          // Explicitly converts any dynamic parameter to a strict string to satisfy the compiler
          await TelegramBotService.broadcastAlert(sub.chat_id.toString(), formattedAlert);
        }

        console.log(`[Scanner Signal] Captured real transaction from ${signal.walletLabel}.`);
      }
    });

    // 3. Real-Time Self-Ping Keep-Alive Loop: Fires every 5 minutes to prevent Render's free tier container from sleeping
    setInterval(async () => {
      try {
        const selfUrl = 'https://autonomoussmartmoneytracker-qycg.onrender.com/health';
        await axios.get(selfUrl);
        console.log('[Keep-Alive] Self-ping dispatched successfully to Render node.');
      } catch (err: any) {
        console.warn('[Keep-Alive Warning] Self-ping skipped:', err.message);
      }
    }, 5 * 60 * 1000); // 5 minutes

  } catch (err: any) {
    console.error('[Initialization Error]:', err.message);
  }
});

export { app, server };