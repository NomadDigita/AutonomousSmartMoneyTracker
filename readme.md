<div align="center">

<!-- Dynamic Typing SVG Banner -->
<a href="https://git.io/typing-svg">
  <img src="https://readme-typing-svg.demolab.com?font=Orbitron&weight=600&size=20&duration=3000&pause=1000&color=00F0FF&center=true&vCenter=true&width=600&lines=INITIALIZING+SMARTFLOW+CORE...;SCANNING+ETHEREUM+MAINNET+BLOCKS...;PARSING+MILLION-DOLLAR+TRANSFERS...;SYSTEM+STATUS:+ACTIVE+AND+SECURE." alt="Typing SVG" />
</a>

<!-- Premium Visual Header -->
<img width="1402" height="1122" alt="SmartFlow AI Terminal Dashboard Mockup" src="https://github.com/user-attachments/assets/ba4ece55-5092-49a4-927f-e931ec841678" />

<br><br>

# 🐳 SMARTFLOW AI TERMINAL
> **Autonomous Smart Money Tracker & Institutional On-Chain Intelligence Core**  
> *Developed for the Bitget AI Base Camp Hackathon S1 — Track 1: Trading Agent*

<br>

![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)
![NodeJS](https://img.shields.io/badge/node.js-6DA55F?style=for-the-badge&logo=node.js&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/tailwindcss-%2338B2AC.svg?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Supabase Cloud](https://img.shields.io/badge/Supabase_PostgreSQL-336791?style=for-the-badge&logo=supabase&logoColor=white)
![Aliyun Qwen](https://img.shields.io/badge/Aliyun_Qwen-FF6A00?style=for-the-badge&logo=alibabacloud&logoColor=white)
![Bitget Spot API](https://img.shields.io/badge/Bitget_Spot_V2-00F0FF?style=for-the-badge&logo=bitcoin&logoColor=black)

</div>

---

<br>

## 🌐 1. Platform Vision & Executive Summary

The cryptocurrency market operates 24/7 across multiple blockchains, where large institutional investors, venture capital funds, and high-performing on-chain traders accumulate positions before news becomes public, rotate capital across emerging sectors, and exit positions before major market corrections. Retail traders usually discover these movements too late because current analytics solutions are often expensive, overly technical, or focused on raw transactional data instead of actionable semantic intelligence.

**SmartFlow AI** bridges this asymmetry by delivering institutional-grade, AI-synthesized on-chain intelligence. The platform:
1. **Listens to Live Blockchains:** Employs real-time WebSocket event listeners to scan Ethereum blocks instantly as they are minted on-chain.
2. **Filters for Million-Dollar Whales:** Enforces a dynamic, real-time USD-valuation filter that eliminates dust spam, only capturing high-conviction transfers exceeding $1,000,000 USD.
3. **Executes AI Semantic Interpretations:** Pairs transaction hashes with live semantic contexts retrieved via Tavily, routing them to the Alibaba Qwen-Plus model over secure international gateways to calculate confidence levels, market impact ratings, and produce natural language analyses.
4. **Persists Cloud History:** Stores all tracked transaction logs in a secure, persistent cloud PostgreSQL database on Supabase.
5. **Autonomously Broadcasts Alerts:** Instantly pushes structured alerts to Telegram users who have enabled live alerts, providing a proactive monitoring network.
6. **Autonomously Publishes Research:** Runs a background scheduler every 6 hours to aggregate transaction data, analyze trend profiles, compile Bloomberg-style macroeconomic newsletters, publish them to the dashboard, and broadcast them to subscribers.

---

<br>

## ⚙️ 2. Platform Core Capabilities

### 1. Hybrid WebSocket & JSON-RPC Block Scanner
* **Sub-Second Block Scanning:** Connects via persistent TCP WebSockets (`wss://`) to mainnet Ethereum nodes to scan transaction blocks instantly as they are minted on-chain.
* **Failover Resilience:** Features an automated fallback connection manager. If the WebSocket stream encounters timeouts or resets, the system seamlessly transitions to standard HTTP JSON-RPC polling across a pool of public nodes (Cloudflare, PublicNode, LlamaRPC), keeping your trackers online 24/7.
* **Multi-Asset Token Scanners:** Tracks native ETH transfers and parses ERC-20 contract event logs (such as USDT, USDC, LINK, ONDO, BGB, and BNB) using single-call block log filtering to prevent RPC rate-limits.

### 2. Aliyun Qwen-Plus Adaptive Model Rotations
* **Model Rotation Gateways:** Automatically bypasses local or regional trial quota limits by rotating requests across `qwen-turbo`, `qwen-plus`, and `qwen-max` completions.
* **95%+ Token Conservation Layer:** Employs an on-chain value gatekeeper. Standard transactions bypass Qwen entirely and are evaluated using clean, static code templates, while Aliyun's LLM completions are strictly reserved for high-impact million-dollar transfers ($\ge \$1,000,000$ USD).
* **Strict Schema Validation:** Binds completions using rigid JSON schemas to guarantee parsed outputs match our TypeScript interfaces, preventing parsing exceptions.

### 3. Persistent Supabase Cloud Database
* **PostgreSQL Schema:** Stores and serves persistent smart money historical logs, subscription registries, and macro research reports.
* **Decoupled REST Queries:** Interfaces with Supabase's native REST Data API over standard HTTP, removing heavy database engine drivers and ensuring zero compile-time dependencies.

### 4. Interactive Telegram Bot & Persistent Menus
* **Collapsible Keyboard Layout:** Renders an organic, collapsible grid reply menu (`🐳 Monitored Wallets`, `📈 Bitget Spot Balances`, `💡 Narrative Insights`, `📊 Sector Rotations`, `🔔 Enable Alerts`, `⚡ System Status`, `ℹ️ Help Guide`), matching premium consumer dApp designs.
* **Parallel-Blockscout Balance Scanner:** Queries current, on-chain balances and live fiat valuations of monitored addresses dynamically using Blockscout's public indexer, bypassing typical cloud RPC datacenter rate-limit blocks.
* **Dynamic Multi-Chain Predictor (`/prediction [coin]`)**: Dispatches autonomous research agents to sweep Tavily search indexes and write custom Aliyun predictions, showing support, resistance, and sentiment forecasts in real-time.
* **Proactive Broadcast Alerts:** Stores user chat IDs upon clicking `🔔 Enable Alerts` and broadcasts scanned million-dollar transactions as rich HTML cards with Etherscan deep-linking.

### 5. Autonomous Bitget Copy-Trading Agent
* **Agentic Execution:** Monitors active on-chain buying spikes. If a watched elite wallet executes a high-confidence asset accumulation on-chain, the backend autonomously triggers a matching Spot market buy order on your Bitget account in sub-second real-time.
* **Dynamic Time-Drift Calibrations:** Regularly syncs local clock offsets against Bitget's central server public clock (`GET /api/v2/public/time`) to compensate for VPS clock drift, preventing access signature expirations.

### 6. 6-Hour Autonomous Research Scheduler
* **AI Research Desk:** Runs a background cron job on the server every 6 hours to fetch your last 50 scanned database logs, calculate capital flows, query Tavily, write a comprehensive market newsletter, update Supabase, and broadcast to subscribers.

---

<br>

## 🏛️ 3. Core Architecture & Data Flow

```text
[ Active Mainnet Block Minted ]
               │
               ▼
[ WebSocket Scanner Parses Block on Render ]
               │
               ▼
[ Filters Transactions >= $1,000,000 USD ]
               │
               ▼
[ Aliyun Qwen-Plus Analyzes & Scores Transaction ]
               │
               ▼
[ Scanned Alert Written Persistently to Supabase PostgreSQL ]
               │
               ▼
[ Server Queries Active Subscriber Chat IDs from Supabase ]
               │
               ▼
[ Telegraf Bot Broadcasts Formatted HTML Alert Card Instantly ]
```

### Key Architectural Integration Layers:
*   **The WebSocket Scanner & HTTP Fallback:** Connects directly to mainnet Ethereum nodes over WebSockets (`wss://`) for sub-second block streaming. If the socket connection drops due to gateway timeouts, the engine catches the event and instantly activates a graceful, multi-node HTTP JSON-RPC polling loop.
*   **Aliyun Model Rotation:** Outgoing LLM requests are processed over secure international Aliyun gateways. If a model encounters technical timeouts, trial quota exhaustion, or rate limits, the service automatically rotates to secondary models (`qwen-turbo` → `qwen-plus` → `qwen-max`), guaranteeing 24/7 completions uptime.
*   **95%+ Token Conservation Layer:** To protect API quotas and limit billing costs, the block scanner runs dynamic on-chain filtering. It generates native, highly optimized templates for standard transactions, and only invokes Aliyun Qwen LLM completions for high-profile whale events.
*   **Parallel-Blockscout REST Indexer:** To query monitored wallet balances on Telegram without triggering datacenter IP rate-limits (common on public JSON-RPC nodes), the bot queries Blockscout's public REST API in parallel. This bypasses rate-limit blocks and fetches live USD balance conversions.
*   **Bitget Time-Drift Sync Calibration:** Private Bitget API endpoints require precise cryptographic access headers. SmartFlow AI actively queries Bitget's central server clock, calculates local clock drift, and applies this offset to all Access-Timestamp headers, ensuring signature validity on virtualized containers:
    $$T_{offset} = T_{server} - T_{local}$$
    $$\text{Signed Header Timestamp} = T_{local} + T_{offset}$$

---

<br>

## 📊 4. Supabase PostgreSQL Schema

To set up your database environment, execute these structural queries inside your **Supabase SQL Editor** to construct the required tables, build performance indexes, and configure security permissions:

```sql
-- Disable Row-Level Security on public tables for real-time tracking
ALTER TABLE IF EXISTS public.signals DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.subscribers DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.research_reports DISABLE ROW LEVEL SECURITY;

-- 1. Create persistent Signals table
CREATE TABLE IF NOT EXISTS public.signals (
    id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    transaction_hash TEXT NOT NULL UNIQUE,
    wallet_label TEXT NOT NULL,
    wallet_category TEXT NOT NULL,
    action TEXT NOT NULL,
    asset TEXT NOT NULL,
    amount TEXT NOT NULL,
    confidence_score INT NOT NULL,
    impact_score INT NOT NULL,
    risk_score INT NOT NULL,
    ai_explanation TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create persistent Subscribers table (Stores user Chat IDs)
CREATE TABLE IF NOT EXISTS public.subscribers (
    chat_id TEXT PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create persistent Research Reports table
CREATE TABLE IF NOT EXISTS public.research_reports (
    id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    title TEXT NOT NULL,
    report_text TEXT NOT NULL,
    sentiment_rating TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index creation timestamps for high-speed dynamic fetches
CREATE INDEX IF NOT EXISTS idx_signals_created ON public.signals(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_signals_hash ON public.signals(transaction_hash);
CREATE INDEX IF NOT EXISTS idx_reports_created ON public.research_reports(created_at DESC);
```

---

<br>

## 📂 5. Monorepo Directory Tree

```text
AutonomousSmartMoneyTracker/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── index.ts          # Environment loading, validation, and sanitization
│   │   ├── routes/
│   │   │   └── api.ts            # Modular router and native Express IP rate-limiter
│   │   ├── services/
│   │   │   ├── bitget.ts         # Base64 HMAC spot trading signer and public clock drift syncer
│   │   │   ├── dexscreener.ts    # Real-time token pool parser
│   │   │   ├── mulerun.ts        # MuleRun agent platform connector
│   │   │   ├── qwen.ts           # Aliyun model completions with automated model rotations
│   │   │   ├── researchAgent.ts  # Autonomous 6-hour macro researcher
│   │   │   ├── signalState.ts    # Supabase cloud database persistent state manager
│   │   │   ├── tavily.ts         # Semantic web searcher with 1-hour cache layer
│   │   │   ├── telegram.ts       # Persistent keyboard bot client and indexer balances
│   │   │   └── tracker.ts        # WebSocket block poller and million-dollar contract log decoders
│   │   ├── types/
│   │   │   └── index.ts          # Shared unified TypeScript types
│   │   └── index.ts              # Express API node entry and scheduler triggers
│   ├── tsconfig.json             # Backend typescript options
│   └── package.json              # Backend dependency registry
└── frontend/
    ├── src/
    │   ├── components/
    │   │   └── GlassLogo.tsx     # Custom CSS-rendered 3D reflective logo
    │   ├── App.tsx               # Apple-standard dark-theme frosted slate client dashboard
    │   ├── main.tsx              # React mounting root and Privy Provider setups
    │   └── index.css             # Tailwind v4 directives and fluid gradient animations
    ├── index.html                # Entry HTML mount with translucent dark themes
    ├── postcss.config.js         # PostCSS compiler parameters
    ├── tailwind.config.js        # Tailwind v4 configuration file
    ├── tsconfig.json             # Client typescript options
    └── package.json              # Client dependency registry
```

---

<br>

## 🔐 6. Environmental Variables Audit

Create a secure `.env` file inside your `/backend` root directory using this template:

```env
PORT=5000
NODE_ENV=development

# Telegram Bot Configurations
TELEGRAM_BOT_TOKEN="your_telegram_bot_token_here"

# Bitget V2 API Access Credentials
BITGET_API_KEY="your_bitget_api_key_here"
BITGET_SECRET_KEY="your_bitget_secret_key_here"
BITGET_PASSPHRASE="your_bitget_passphrase_here"

# Integration Platform API Keys
MULERUN_API_KEY="your_mulerun_api_key_here"
TAVILY_API_KEY="your_tavily_key_here"
QWEN_API_KEY="your_aliyun_qwen_api_key_here"

# Supabase Cloud Database Configurations
SUPABASE_URL="https://your_supabase_project_url.supabase.co"
SUPABASE_KEY="your_supabase_anon_anon_key_here"

# Resilient Node Provider Gateways (Defaults to Cloudflare fallback if left empty)
ETH_MAINNET_RPC="https://cloudflare-eth.com"

# Dynamic Million-Dollar Gatekeeper Filter (Defaults to 1,000,000 USD)
MIN_ALERT_USD=1000000
```

---

<br>

## 💻 7. Local Installation & Development Launch

Execute these commands step-by-step to compile and run the platform on your local machine:

### 1. Compile & Build the Backend Server
Navigate to the `/backend` folder, install the packages using the peer dependencies flag, compile the TypeScript source, and boot up:
```bash
cd backend
npm install --legacy-peer-deps
npm run build
npm run dev
```

### 2. Launch the Client Interface
Open a secondary terminal, navigate to `/frontend`, install packages, and boot the Vite development server:
```bash
cd ../frontend
npm install --legacy-peer-deps
npm run dev
```
Open **`http://localhost:5173/`** in your browser to view the glassmorphic trading dashboard.

---

<br>

## 📡 8. REST API & Bot Commands Reference Manual

### API Routing Manual

| Target Route | HTTP Method | Payload Interface | Operational Utility |
| :--- | :--- | :--- | :--- |
| `/api/signals` | `GET` | `None` | Retrieves historical signals parsed by the block scanner. |
| `/api/health` | `GET` | `None` | Gateway status check. Returns active system parameters. |
| `/api/research` | `GET` | `None` | Returns compiled AI market research newsletters. |
| `/api/trigger-research` | `POST` | `None` | Manually triggers the 6-hour research sequence. |

### Interactive Telegram Commands

| Menu Button | Command | Operational Action |
| :--- | :--- | :--- |
| `🐳 Monitored Wallets` | `/whales` | Queries current on-chain balances and live values of smart wallets via Blockscout's API. |
| `📈 Bitget Spot Balances` | `/balances` | Retrieves and shows your connected Bitget account's spot balances. |
| `💡 Narrative Insights` | `/narrative` | Searches narrative footprints via Tavily to deliver a macro market analysis. |
| `📊 Sector Rotations` | `/sectors` | Audits trading volume across standard sectors to identify capital rotation patterns. |
| `🔔 Enable Alerts` | `/start` | Subscribes the user's active Telegram session to receive real-time whale transaction notifications. |
| `🔕 Disable Alerts` | `/stop` | Removes the user's active session from the real-time broadcast list. |
| `⚡ System Status` | `/status` | Outputs system status including RPC connections, database latency, and runtime diagnostics. |
| `ℹ️ Help Guide` | `/help` | Returns the system documentation and user guide card. |
| *No Button* | `/prediction [coin]` | Evaluates support/resistance structures and generates market trend forecasts. |
| *No Button* | `/watch [address]` | Fetches active liquidity, volume, and fdv parameters for any target contract address. |

---

<br>

## 🚀 9. Production Cloud Deployments

### 1. Backend Web Service Deployment (Render)
1. Go to **Render.com** and set up a new **Web Service** pointed to your repository.
2. Configure the following environment parameters:
    * **Root Directory:** `backend`
    * **Runtime:** `Node`
    * **Build Command:** `npm install --legacy-peer-deps --production=false && npm run build`
    * **Start Command:** `npm run start`
3. Add your environment variables in the settings panel matching your local `.env`.

### 2. Frontend Interface Deployment (Vercel)
1. Import your project repository on **Vercel**.
2. Select the **`frontend`** directory as your project root folder.
3. Keep the default framework preset as **Vite**.
4. Set the following environment variable:
    * `VITE_API_BASE_URL` = *Your deployed backend service URL on Render*
5. Click **Deploy**.

### 3. Continuous Operations Setup
To prevent Render's container runtime from sleeping on free hosting tiers, register your backend health route with a monitoring service (such as **cron-job.org** or **UptimeRobot**):
* **Target Health Route:** `https://your-backend-service.onrender.com/health`
* **Execution Interval:** Every 5 minutes.

---

<br>

## 🛡️ 10. Security & Integration Standards

* **Access Key Protection:** Bitget private API keys are kept entirely within isolated server-side environments and are never transmitted to client dashboards or shared with public AI modules.
* **On-Chain Log Verification:** The system verifies transaction event logs using strict parameter matching, preventing fake log generation attacks or input spoofing.
* **Database Performance:** Row-Level Security (RLS) is disabled solely for our public sandbox endpoints. For enterprise scale-outs, it is recommended to enable RLS with dedicated JWT-based Supabase authentication rules.

---

<br>

## ⚖️ License
This project is open-source software released under the MIT License. Developed for the Bitget AI Base Camp Hackathon S1.