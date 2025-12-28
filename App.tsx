import React, { useState, useEffect, useCallback } from 'react';
import { Search, Printer, AlertTriangle, Terminal } from 'lucide-react';
import { fetchMarketOverview, fetchCandles, calculateIndicators } from './services/api';
import { scanMarket, generateDossier } from './services/gemini';
import { Chart } from './components/Chart';
import { Scanner } from './components/Scanner';
import { Mindstream } from './components/Mindstream';
import { AssetData, MarketScanResult, Candle, TechnicalIndicators, ResearchDossier, MindstreamLog } from './types';

function App() {
  // State
  const [ticker, setTicker] = useState('BTCUSDT');
  const [inputTicker, setInputTicker] = useState('BTCUSDT');
  const [marketData, setMarketData] = useState<AssetData[]>([]);
  const [scanResults, setScanResults] = useState<MarketScanResult[]>([]);
  const [candles, setCandles] = useState<Candle[]>([]);
  const [technicals, setTechnicals] = useState<TechnicalIndicators | null>(null);
  const [dossier, setDossier] = useState<ResearchDossier | null>(null);
  const [logs, setLogs] = useState<MindstreamLog[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Helper to add logs
  const addLog = useCallback((message: string, type: MindstreamLog['type'] = 'info') => {
    setLogs(prev => [...prev, {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toLocaleTimeString(),
      message,
      type
    }]);
  }, []);

  // Initial Load: Market Scan
  useEffect(() => {
    const init = async () => {
      setIsScanning(true);
      addLog('Connecting to Binance Global Data Stream...', 'info');
      
      const assets = await fetchMarketOverview();
      if (assets.length > 0) {
        setMarketData(assets);
        addLog(`Retrieved ${assets.length} high-volume tickers.`, 'success');
        
        addLog('Sending data to Gemini Flash for volatility scanning...', 'calc');
        const results = await scanMarket(assets);
        setScanResults(results);
        addLog('Market Scan Complete. Top opportunities identified.', 'success');
      } else {
        addLog('Failed to fetch market data. Check connection.', 'error');
      }
      setIsScanning(false);
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Deep Dive Logic
  const handleDeepDive = async (symbol: string) => {
    setTicker(symbol);
    setIsAnalyzing(true);
    setDossier(null);
    setLogs([]); // Clear logs for new focus
    
    try {
      addLog(`Initializing Deep Dive Protocol for ${symbol}...`, 'info');
      
      // 1. Fetch Data
      addLog(`Fetching 500H of OHLCV data for ${symbol}...`, 'search');
      const data = await fetchCandles(symbol, '1h');
      setCandles(data);
      addLog('Data acquired successfully.', 'success');

      // 2. Local Math
      addLog('Calculating RSI, Bollinger Bands, MACD...', 'calc');
      const indicators = calculateIndicators(data);
      setTechnicals(indicators);

      // 3. Gemini Pro
      await generateDossier(symbol, data, indicators, (msg) => addLog(msg, 'search'))
        .then(d => {
          setDossier(d);
          addLog('Intelligence Dossier Compiled.', 'success');
        });

    } catch (e) {
      addLog(`Analysis failed: ${e}`, 'error');
      console.error(e);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-[#f7f7f5] text-black flex flex-col font-sans selection:bg-black selection:text-white">
      
      {/* Header */}
      <header className="border-b border-neutral-300 bg-white p-4 flex justify-between items-center sticky top-0 z-50 no-print">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-black flex items-center justify-center text-white">
            <Terminal size={18} />
          </div>
          <div>
            <h1 className="font-serif font-bold text-lg tracking-tight">NeuroTrade AI <span className="text-neutral-400 font-normal">v3.0</span></h1>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="relative group">
            <input 
              type="text" 
              value={inputTicker}
              onChange={(e) => setInputTicker(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === 'Enter' && handleDeepDive(inputTicker)}
              className="bg-neutral-100 border border-neutral-200 pl-10 pr-4 py-1.5 w-64 font-mono text-sm focus:outline-none focus:border-black transition-colors"
              placeholder="ENTER TICKER..."
            />
            <Search className="absolute left-3 top-2 text-neutral-400" size={16} />
          </div>
          <button 
            onClick={handlePrint}
            className="flex items-center gap-2 px-3 py-1.5 border border-neutral-300 hover:bg-neutral-100 text-sm font-serif"
          >
            <Printer size={16} />
            <span className="hidden md:inline">Print Memo</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-6 max-w-[1600px] mx-auto w-full flex flex-col gap-6">
        
        {/* Section 1: Scanner (Top Band) */}
        <section className="no-print">
          <div className="flex justify-between items-end mb-3">
            <h2 className="font-serif text-xl font-bold">Market Surveillance</h2>
            <div className="flex gap-2">
              <span className="text-xs font-mono text-neutral-500 uppercase">
                Status: {isScanning ? 'Scanning...' : 'Active'}
              </span>
              <span className="text-xs font-mono text-neutral-500 uppercase">
                Model: Gemini 3 Flash
              </span>
            </div>
          </div>
          <Scanner 
            results={scanResults} 
            isLoading={isScanning} 
            onSelect={handleDeepDive} 
          />
        </section>

        {/* Section 2: Deep Terminal */}
        <section className="flex-1 flex flex-col md:flex-row gap-6 h-auto min-h-[600px]">
          
          {/* Left Column: Chart & Logs */}
          <div className="w-full md:w-2/3 flex flex-col gap-4">
            <div className="border border-neutral-300 bg-white h-[500px] shadow-sm relative group">
              {candles.length > 0 && technicals ? (
                <Chart data={candles} indicators={technicals} />
              ) : (
                <div className="flex items-center justify-center h-full text-neutral-400 font-serif italic">
                  Awaiting Target Selection...
                </div>
              )}
            </div>
            
            {/* Mindstream Terminal */}
            <div className="h-48 border border-neutral-800 bg-black shadow-lg no-print">
              <Mindstream logs={logs} />
            </div>
          </div>

          {/* Right Column: Intelligence Dossier */}
          <div className="w-full md:w-1/3 border border-neutral-300 bg-white p-6 shadow-sm overflow-y-auto max-h-[710px]">
             {dossier ? (
               <div className="space-y-6 animate-in fade-in duration-500">
                 <div className="border-b border-black pb-4">
                   <div className="flex justify-between items-start">
                    <h2 className="font-serif text-2xl font-bold">{ticker} DOSSIER</h2>
                    <span className={`px-2 py-1 text-xs font-mono font-bold text-white ${
                      dossier.sentiment === 'BULLISH' ? 'bg-green-600' : 
                      dossier.sentiment === 'BEARISH' ? 'bg-red-600' : 'bg-neutral-600'
                    }`}>
                      {dossier.sentiment}
                    </span>
                   </div>
                   <p className="mt-2 font-serif text-sm leading-relaxed text-neutral-700">
                     {dossier.summary}
                   </p>
                 </div>

                 <div>
                   <h3 className="font-mono text-xs font-bold uppercase tracking-wider mb-3 text-neutral-500">Technical Outlook</h3>
                   <div className="p-3 bg-neutral-50 border-l-2 border-black font-serif text-sm">
                     {dossier.technicalAnalysis}
                   </div>
                   <div className="mt-2 flex justify-between font-mono text-xs">
                     <span>TARGET: {dossier.priceTarget}</span>
                   </div>
                 </div>

                 <div>
                   <h3 className="font-mono text-xs font-bold uppercase tracking-wider mb-3 text-neutral-500">Intelligence Sources ({dossier.news.length})</h3>
                   <ul className="space-y-3">
                     {dossier.news.map((news, idx) => (
                       <li key={idx} className="border-b border-neutral-100 pb-2 last:border-0">
                         <a href={news.url || '#'} target="_blank" rel="noopener noreferrer" className="hover:underline group">
                           <h4 className="font-serif text-sm font-semibold text-neutral-900 group-hover:text-blue-700">{news.title}</h4>
                           <div className="flex justify-between mt-1">
                             <span className="text-[10px] font-mono text-neutral-500 uppercase">{news.source}</span>
                           </div>
                         </a>
                       </li>
                     ))}
                   </ul>
                 </div>
               </div>
             ) : (
               <div className="h-full flex flex-col items-center justify-center text-center p-8 opacity-50">
                 <Search size={48} className="mb-4 text-neutral-300" />
                 <h3 className="font-serif text-lg text-neutral-500">Intelligence Module Idle</h3>
                 <p className="font-mono text-xs text-neutral-400 mt-2">Select a ticker to begin deep research.</p>
               </div>
             )}
          </div>
        </section>

      </main>

      {/* API Key Warning (if missing) */}
      {!process.env.API_KEY && (
        <div className="fixed bottom-0 left-0 right-0 bg-red-600 text-white p-2 text-center font-mono text-sm z-[100]">
          <AlertTriangle className="inline mr-2" size={16} />
          SYSTEM ERROR: API_KEY is missing from environment. Gemini services offline.
        </div>
      )}
    </div>
  );
}

export default App;