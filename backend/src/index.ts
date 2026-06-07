import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
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

// Mount our clean modular router
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
        SignalStateManager.addSignal(signal);

        console.log(`[Scanner Signal] Captured real transaction from ${signal.walletLabel}.`);
      }
    });

  } catch (err: any) {
    console.error('[Initialization Error]:', err.message);
  }
});

export { app, server };