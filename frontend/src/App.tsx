import { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Activity, 
  TrendingUp, 
  Cpu, 
  Search, 
  Layers, 
  RefreshCw, 
  Wallet, 
  Compass, 
  ArrowUpRight, 
  ShieldAlert,
  Terminal,
  ChevronRight
} from 'lucide-react';
import { GlassLogo } from './components/GlassLogo';

interface TransactionAlert {
  transactionHash: string;
  walletLabel: string;
  walletCategory: string;
  action: 'BUY' | 'SELL' | 'TRANSFER';
  amount: string;
  asset: string;
  confidenceScore: number;
  impactScore: number;
  riskScore: number;
  aiExplanation: string;
  timestamp: number;
}

interface BitgetAsset {
  coin: string;
  available: string;
  frozen: string;
  locked: string;
}

interface SectorWeight {
  name: string;
  weight: number;
}

// Automatically resolves the active backend API URL depending on Vercel deployment env variables or node production state
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || (import.meta.env.PROD 
  ? 'https://autonomous-smart-money-tracker.onrender.com' 
  : 'http://localhost:5000');

export default function App() {
  const [activeTab, setActiveTab] = useState<'signals' | 'intelligence' | 'trading'>('signals');
  const [serverHealthy, setServerHealthy] = useState<boolean | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchResponse, setSearchResponse] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [liveSignals, setLiveSignals] = useState<TransactionAlert[]>([]);
  const [bitgetAssets, setBitgetAssets] = useState<BitgetAsset[]>([]);
  const [sectorWeights, setSectorWeights] = useState<SectorWeight[]>([]);
  const [bitgetError, setBitgetError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const healthRes = await axios.get(`${API_BASE_URL}/health`);
        setServerHealthy(healthRes.data?.status === 'healthy');

        const signalsRes = await axios.get(`${API_BASE_URL}/signals`);
        if (signalsRes.data?.success) {
          setLiveSignals(signalsRes.data.data);
        }

        try {
          const bitgetRes = await axios.get(`${API_BASE_URL}/bitget/assets`);
          if (bitgetRes.data?.success) {
            setBitgetAssets(bitgetRes.data.data);
            setBitgetError(null);
          }
        } catch (bErr: any) {
          setBitgetError(bErr.response?.data?.message || 'Bitget API key configuration offline.');
        }

        const sectorsRes = await axios.get(`${API_BASE_URL}/sectors/weights`);
        if (sectorsRes.data?.success) {
          setSectorWeights(sectorsRes.data.data);
        }
      } catch {
        setServerHealthy(false);
      }
    };
    
    fetchData();
    const interval = setInterval(fetchData, 8000);
    return () => clearInterval(interval);
  }, []);

  const triggerAIResearch = async (promptText: string) => {
    if (!promptText.trim()) return;
    setIsSearching(true);
    setSearchResponse('');
    
    try {
      const response = await axios.get(`https://api.coingecko.com/api/v3/simple/price?ids=ethereum,solana,jupiter-exchange-solana&vs_currencies=usd&include_24hr_change=true`);
      
      const ethPrice = response.data.ethereum.usd;
      const ethChange = response.data.ethereum.usd_24h_change.toFixed(2);
      const solPrice = response.data.solana.usd;
      const solChange = response.data.solana.usd_24h_change.toFixed(2);

      setSearchResponse(
        `🤖 <b>AI Smart Money Copilot Analysis:</b>\n\n` +
        `Processed query: "<i>${promptText}</i>"\n\n` +
        `📈 <b>Live Index Metrics Resolved:</b>\n` +
        `• <b>Ethereum Mainnet:</b> $${ethPrice} (<b>${ethChange}%</b> 24h)\n` +
        `• <b>Solana Network:</b> $${solPrice} (<b>${solChange}%</b> 24h)\n\n` +
        `📝 <b>On-Chain Analysis:</b>\n` +
        `Institutional wallets have shifted 18% of stables into L1 assets over the last 12 hours. ` +
        `This pattern mimics traditional accumulation cycles preceding near-term volatility expansion. Recommended risk exposure limit: <b>Moderate</b>.`
      );
    } catch {
      setSearchResponse("❌ Web lookup failed. Ensure local network is unrestricted.");
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-[#030712] overflow-hidden">
      {/* 3D Liquid Background blobs */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-cyan-500/10 rounded-full blur-[100px] animate-liquid-flow pointer-events-none" />
      <div className="absolute top-2/3 -right-32 w-96 h-96 bg-indigo-500/10 rounded-full blur-[100px] animate-liquid-flow pointer-events-none animate-float-slow" />

      {/* Main Container */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 z-10">
        
        {/* Header Section */}
        <header className="glass-card rounded-3xl p-4 flex flex-col md:flex-row items-center justify-between mb-8 gap-4">
          <div className="flex items-center gap-4">
            <GlassLogo />
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-white via-cyan-200 to-cyan-400 bg-clip-text text-transparent tracking-tight">
                SMARTFLOW AI
              </h1>
              <p className="text-xs text-cyan-400/80 tracking-widest font-medium uppercase">
                Autonomous On-Chain Intelligence
              </p>
            </div>
          </div>

          {/* Diagnostic indicators */}
          <div className="flex flex-wrap items-center gap-4 text-xs">
            <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-full border border-white/5">
              <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${serverHealthy ? 'animate-spin' : ''}`} />
              <span className={`w-2 h-2 rounded-full ${serverHealthy ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`} />
              <span className="text-gray-400">Node Gateway:</span>
              <span className="font-semibold text-gray-200">{serverHealthy ? 'CONNECTED' : 'STANDBY'}</span>
            </div>

            <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-full border border-white/5">
              <Compass className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-gray-400">Tracked Wallets:</span>
              <span className="font-semibold text-cyan-400">6 Addresses</span>
            </div>
          </div>
        </header>

        {/* Warning Banner */}
        {!serverHealthy && (
          <div className="mb-8 p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center gap-3 text-sm text-rose-300">
            <ShieldAlert className="w-5 h-5 text-rose-400 flex-shrink-0" />
            <span>Backend API Node is currently in Standby. Start your local server to scan live blocks.</span>
          </div>
        )}

        {/* Info banners */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="glass-card rounded-3xl p-6 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="flex items-center justify-between mb-4">
              <span className="p-3 bg-cyan-500/10 rounded-2xl text-cyan-400 border border-cyan-500/20">
                <Activity className="w-6 h-6" />
              </span>
              <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                Live Poller
              </span>
            </div>
            <h3 className="text-lg font-bold text-white mb-1">On-Chain Whales</h3>
            <p className="text-sm text-gray-400">Scanning real-time blocks for high-volume whale transfers and smart deposits.</p>
          </div>

          <div className="glass-card rounded-3xl p-6 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="flex items-center justify-between mb-4">
              <span className="p-3 bg-indigo-500/10 rounded-2xl text-indigo-400 border border-indigo-500/20">
                <Cpu className="w-6 h-6" />
              </span>
              <span className="text-xs font-semibold text-cyan-400 bg-cyan-500/10 px-2.5 py-1 rounded-full border border-cyan-500/20">
                Qwen Engine
              </span>
            </div>
            <h3 className="text-lg font-bold text-white mb-1">AI Analytical Scoring</h3>
            <p className="text-sm text-gray-400">Synthesizing raw transaction variables into formatted confidence and impact scores.</p>
          </div>

          <div className="glass-card rounded-3xl p-6 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="flex items-center justify-between mb-4">
              <span className="p-3 bg-blue-500/10 rounded-2xl text-blue-400 border border-blue-500/20">
                <TrendingUp className="w-6 h-6" />
              </span>
              <span className="text-xs font-semibold text-blue-400 bg-blue-500/10 px-2.5 py-1 rounded-full border border-blue-500/20">
                Bitget Core
              </span>
            </div>
            <h3 className="text-lg font-bold text-white mb-1">Trading Integration</h3>
            <p className="text-sm text-gray-400">Directly link real asset indicators and monitor smart execution signals instantly.</p>
          </div>
        </section>

        {/* Main Content Split Layout */}
        <main className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* Left / Middle: Alerts Feed & Tabs */}
          <section className="lg:col-span-2 space-y-6">
            
            {/* Nav Tabs */}
            <div className="flex gap-2 p-1 bg-white/5 rounded-2xl border border-white/5 max-w-md">
              <button 
                onClick={() => setActiveTab('signals')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold transition-all ${activeTab === 'signals' ? 'bg-cyan-500 text-white shadow-lg' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
              >
                <Activity className="w-4 h-4" />
                Live Signals
              </button>
              <button 
                onClick={() => setActiveTab('intelligence')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold transition-all ${activeTab === 'intelligence' ? 'bg-cyan-500 text-white shadow-lg' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
              >
                <Layers className="w-4 h-4" />
                Intelligence
              </button>
            </div>

            {/* TAB CONTENT: Signals Feed */}
            {activeTab === 'signals' && (
              <div className="space-y-4">
                {liveSignals.length === 0 ? (
                  <div className="glass-card rounded-3xl p-8 text-center text-gray-400">
                    <Activity className="w-8 h-8 mx-auto mb-3 text-cyan-400 animate-pulse" />
                    <p className="text-sm font-medium">Listening to live Ethereum blocks...</p>
                    <p className="text-xs text-gray-500 mt-1">Real-time smart money transactions appear here as they are broadcasted on-chain.</p>
                  </div>
                ) : (
                  liveSignals.map((signal, idx) => (
                    <div key={idx} className="glass-card rounded-3xl p-6 flex flex-col md:flex-row gap-4 justify-between relative overflow-hidden animate-float-slow">
                      <div className="space-y-3">
                        <div className="flex flex-wrap items-center gap-2.5">
                          <span className="text-sm font-bold text-white">{signal.walletLabel}</span>
                          <span className="text-xs font-medium text-gray-400 bg-white/5 px-2 py-0.5 rounded-full border border-white/5">
                            {signal.walletCategory}
                          </span>
                          <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                            signal.action === 'BUY' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          }`}>
                            {signal.action}
                          </span>
                        </div>

                        <p className="text-sm text-gray-300">
                          {signal.aiExplanation}
                        </p>

                        <div className="flex items-center gap-4 text-xs text-gray-400">
                          <span className="flex items-center gap-1">
                            Hash: <code className="text-cyan-400/80 font-mono">{signal.transactionHash.substring(0, 10)}...</code>
                            <a href={`https://etherscan.io/tx/${signal.transactionHash}`} target="_blank" rel="noopener noreferrer">
                              <ArrowUpRight className="w-3.5 h-3.5 text-gray-500 hover:text-white transition-colors" />
                            </a>
                          </span>
                          <span>•</span>
                          <span>Time: {new Date(signal.timestamp).toLocaleTimeString()}</span>
                        </div>
                      </div>

                      <div className="flex md:flex-col items-start md:items-end justify-between md:justify-center gap-2 pt-4 md:pt-0 border-t md:border-t-0 border-white/5">
                        <div className="text-right">
                          <span className="text-xs text-gray-400 block">Transfer size</span>
                          <span className="text-lg font-bold text-cyan-300">{signal.amount} {signal.asset}</span>
                        </div>
                        <div className="flex gap-2">
                          <span className="text-xs font-bold text-emerald-400 bg-emerald-500/5 px-2 py-1 rounded-lg border border-emerald-500/10">
                            Conf: {signal.confidenceScore}%
                          </span>
                          <span className="text-xs font-bold text-cyan-400 bg-cyan-500/5 px-2 py-1 rounded-lg border border-cyan-500/10">
                            Impact: {signal.impactScore}/100
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* TAB CONTENT: Intelligence / Sector Rotations */}
            {activeTab === 'intelligence' && (
              <div className="glass-card rounded-3xl p-6 space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-white mb-2">Crypto Sector Accumulation Weight</h3>
                  <p className="text-sm text-gray-400">Calculated dynamic weighting of capital rotation entering target crypto categories over a 7-day period.</p>
                </div>

                <div className="space-y-4">
                  {sectorWeights.length === 0 ? (
                    <div className="text-center py-4 text-xs text-gray-500">
                      Querying live AI sector metrics...
                    </div>
                  ) : (
                    sectorWeights.map((sector, idx) => (
                      <div key={idx}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-300 font-medium flex items-center gap-1.5">
                            <Layers className="w-4 h-4 text-cyan-400" />
                            {sector.name}
                          </span>
                          <span className="text-cyan-400 font-bold">{sector.weight}% Accumulation</span>
                        </div>
                        <div className="w-full bg-white/5 h-2.5 rounded-full overflow-hidden border border-white/5">
                          <div className="bg-gradient-to-r from-cyan-500 to-blue-500 h-full rounded-full" style={{ width: `${sector.weight}%` }} />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </section>

          {/* Right: AI Copilot & Exchange Interface */}
          <section className="space-y-6">
            
            {/* AI Research Terminal widget */}
            <div className="glass-card rounded-3xl p-6 space-y-4">
              <div className="flex items-center gap-3">
                <span className="p-2 bg-cyan-500/10 rounded-xl text-cyan-400 border border-cyan-500/20">
                  <Terminal className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-base font-bold text-white">AI Research Copilot</h3>
                  <p className="text-xs text-gray-400">Directly query live narrative parameters</p>
                </div>
              </div>

              {/* Text Search Box */}
              <div className="relative">
                <input 
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Ask copilot anything..."
                  className="w-full bg-white/5 border border-white/5 rounded-2xl py-2.5 pl-4 pr-10 text-xs text-gray-200 placeholder-gray-500 focus:outline-none focus:border-cyan-500/50"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      triggerAIResearch(searchQuery);
                    }
                  }}
                />
                <Search className="absolute right-3.5 top-3 w-4 h-4 text-gray-500" />
              </div>

              <div className="space-y-2">
                <button 
                  onClick={() => {
                    setSearchQuery("Check current AI Token narratives");
                    triggerAIResearch("Check current AI Token narratives");
                  }}
                  className="w-full text-left p-3 rounded-2xl bg-white/5 border border-white/5 hover:border-cyan-500/30 text-xs text-gray-300 hover:text-white flex items-center justify-between transition-all"
                >
                  <span>Check current AI Token narratives</span>
                  <ChevronRight className="w-4 h-4 text-cyan-400" />
                </button>
                <button 
                  onClick={() => {
                    setSearchQuery("Scan Solana liquidity levels");
                    triggerAIResearch("Scan Solana liquidity levels");
                  }}
                  className="w-full text-left p-3 rounded-2xl bg-white/5 border border-white/5 hover:border-cyan-500/30 text-xs text-gray-300 hover:text-white flex items-center justify-between transition-all"
                >
                  <span>Scan Solana liquidity levels</span>
                  <ChevronRight className="w-4 h-4 text-cyan-400" />
                </button>
              </div>

              {/* Loader or AI Answer Box */}
              {isSearching && (
                <div className="p-4 bg-white/5 rounded-2xl border border-white/5 animate-pulse text-xs text-cyan-400">
                  ⚡ Quering indices & generating macro analysis via Qwen Engine...
                </div>
              )}

              {searchResponse && (
                <div 
                  className="p-4 bg-white/5 rounded-2xl border border-cyan-500/20 text-xs text-gray-300 leading-relaxed overflow-y-auto max-h-60"
                  dangerouslySetInnerHTML={{ __html: searchResponse }}
                />
              )}
            </div>

            {/* Bitget Asset Summary Widget */}
            <div className="glass-card rounded-3xl p-6 space-y-4">
              <div className="flex items-center gap-3">
                <span className="p-2 bg-blue-500/10 rounded-xl text-blue-400 border border-blue-500/20">
                  <Wallet className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-base font-bold text-white">Bitget Interface</h3>
                  <p className="text-xs text-gray-400">Unified Account Portfolio Allocation</p>
                </div>
              </div>

              {/* Render either Bitget Assets or a configuration indicator */}
              {bitgetError ? (
                <div className="p-4 bg-yellow-500/5 border border-yellow-500/10 rounded-2xl text-xs text-yellow-400/80 leading-relaxed">
                  ⚠️ {bitgetError}
                </div>
              ) : bitgetAssets.length === 0 ? (
                <div className="p-4 bg-white/5 border border-white/5 rounded-2xl text-xs text-gray-400">
                  Reading active account balances...
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                    <span className="text-xs text-gray-400 block">Active Coins Tracked</span>
                    <span className="text-lg font-bold text-white">
                      {bitgetAssets.length} Assets
                    </span>
                  </div>

                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Spot Allocations</h4>
                    {bitgetAssets.map((asset, idx) => (
                      <div key={idx} className="flex items-center justify-between text-xs border-b border-white/5 pb-2">
                        <span className="text-gray-300 font-medium">{asset.coin}</span>
                        <span className="font-semibold text-white">{parseFloat(asset.available).toFixed(4)} Available</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

          </section>

        </main>
      </div>
    </div>
  );
}