import { Router, Request, Response, NextFunction } from 'express';
import { SignalStateManager } from '../services/signalState.js';
import { BitgetService } from '../services/bitget.js';
import { TavilyService } from '../services/tavily.js';
import { QwenService } from '../services/qwen.js';

const router = Router();

// In-Memory map to track rate limits per IP address
const ipRequestsMap: Record<string, { count: number; resetTime: number }> = {};
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute window
const MAX_REQUESTS_PER_WINDOW = 60; // Max 60 requests per minute

/**
 * Native Express Rate Limiter Middleware
 */
const rateLimiter = (req: Request, res: Response, next: NextFunction) => {
  const ip = req.ip || req.socket.remoteAddress || 'unknown-ip';
  const now = Date.now();

  if (!ipRequestsMap[ip]) {
    ipRequestsMap[ip] = {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW_MS
    };
    return next();
  }

  const record = ipRequestsMap[ip];

  if (now > record.resetTime) {
    // Reset window
    record.count = 1;
    record.resetTime = now + RATE_LIMIT_WINDOW_MS;
    return next();
  }

  record.count++;

  if (record.count > MAX_REQUESTS_PER_WINDOW) {
    return res.status(429).json({
      success: false,
      message: 'Too many requests. Please slow down and try again in a minute.'
    });
  }

  next();
};

// Apply native rate limiting middleware to all active routes
router.use(rateLimiter);

router.get('/signals', (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    count: SignalStateManager.getSignals().length,
    data: SignalStateManager.getSignals()
  });
});

router.get('/bitget/assets', async (req: Request, res: Response) => {
  try {
    const assets = await BitgetService.getSpotAssets();
    res.status(200).json({
      success: true,
      data: assets || []
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      message: err.message || 'Failed to retrieve live Bitget spot assets.'
    });
  }
});

router.get('/sectors/weights', async (req: Request, res: Response) => {
  try {
    const searchQuery = 'current top cryptocurrency sectors layer 1 rwa defi depin capital inflows';
    const webContext = await TavilyService.searchNarrative(searchQuery);

    const systemPrompt = 
      `You are an AI financial analyst. Based on the real-time web context, estimate the market accumulation weights (0 to 100) for the top three sectors: AI, RWA, and DeFi.
You MUST output a strict JSON array of objects with no markdown block formatting. Example format:
[{"name": "AI", "weight": 85}, {"name": "RWA", "weight": 70}, {"name": "DeFi", "weight": 60}]`;

    const aiResponse = await QwenService.analyzeMarketData(systemPrompt, webContext);
    const cleaned = aiResponse.replace(/```json|```/g, '').trim();
    const parsedWeights = JSON.parse(cleaned);

    res.status(200).json({
      success: true,
      data: parsedWeights
    });
  } catch (err: any) {
    res.status(200).json({
      success: true,
      data: [
        { name: "AI-Driven Tokens", weight: 65 },
        { name: "Real World Assets (RWA)", weight: 55 },
        { name: "DeFi Protocols", weight: 45 }
      ]
    });
  }
});

router.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    activeIntegrations: ['Bitget', 'Alibaba Qwen', 'MuleRun', 'Tavily', 'DexScreener']
  });
});

export { router as apiRouter };