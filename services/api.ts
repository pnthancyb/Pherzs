import { Candle, TechnicalIndicators, AssetData } from '../types';

// Fallback strategy for robust fetching
// Strategy: Direct (Binance) -> Alternative (Vision) -> Proxy (AllOrigins)
const ENDPOINTS = [
  'https://api.binance.com/api/v3',
  'https://data-api.binance.vision/api/v3',
  (path: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(`https://api.binance.com/api/v3${path}`)}`
];

async function fetchWithFallback(path: string): Promise<any> {
  let lastError;

  for (const [index, endpoint] of ENDPOINTS.entries()) {
    try {
      const url = typeof endpoint === 'function' ? endpoint(path) : `${endpoint}${path}`;
      const strategyName = typeof endpoint === 'function' ? 'CORS Proxy (AllOrigins)' : `Direct Endpoint (${index + 1})`;
      
      console.log(`[Data Grid] Attempting fetch via ${strategyName}...`);
      
      const res = await fetch(url);
      
      if (!res.ok) {
        throw new Error(`HTTP Error: ${res.status} ${res.statusText}`);
      }
      
      const data = await res.json();
      return data; // Return immediately on success

    } catch (e) {
      console.warn(`[Data Grid] Strategy ${index + 1} failed for ${path}:`, e);
      lastError = e;
      // Loop continues to next strategy
    }
  }

  console.error(`[Data Grid] CRITICAL FAILURE. All ${ENDPOINTS.length} strategies exhausted for ${path}.`);
  throw lastError;
}

export async function fetchMarketOverview(): Promise<AssetData[]> {
  try {
    const data = await fetchWithFallback('/ticker/24hr');
    // Filter for top USDT pairs to simulate "Top Volume"
    return data
      .filter((d: any) => d.symbol.endsWith('USDT'))
      .sort((a: any, b: any) => parseFloat(b.quoteVolume) - parseFloat(a.quoteVolume))
      .slice(0, 20)
      .map((d: any) => ({
        symbol: d.symbol,
        price: parseFloat(d.lastPrice),
        change24h: parseFloat(d.priceChangePercent),
        volume: parseFloat(d.quoteVolume)
      }));
  } catch (error) {
    console.error("Market fetch failed", error);
    return [];
  }
}

export async function fetchCandles(symbol: string, interval: string = '1h'): Promise<Candle[]> {
  // STRICT REQUIREMENT: Fetch at least 500 candles for chart density
  const raw = await fetchWithFallback(`/klines?symbol=${symbol}&interval=${interval}&limit=500`);
  return raw.map((k: any) => ({
    time: k[0],
    open: parseFloat(k[1]),
    high: parseFloat(k[2]),
    low: parseFloat(k[3]),
    close: parseFloat(k[4]),
    volume: parseFloat(k[5]),
    dateStr: new Date(k[0]).toLocaleDateString()
  }));
}

// --- Technical Analysis Math ---

export function calculateIndicators(candles: Candle[]): TechnicalIndicators {
  const closes = candles.map(c => c.close);
  const period = 14;

  // RSI
  const rsi = [];
  let avgGain = 0;
  let avgLoss = 0;

  for (let i = 1; i < closes.length; i++) {
    const change = closes[i] - closes[i - 1];
    if (i <= period) {
      if (change > 0) avgGain += change;
      else avgLoss += Math.abs(change);
      if (i === period) {
        avgGain /= period;
        avgLoss /= period;
        rsi.push(100 - (100 / (1 + avgGain / avgLoss)));
      } else {
        rsi.push(50); // filler
      }
    } else {
      if (change > 0) {
        avgGain = (avgGain * (period - 1) + change) / period;
        avgLoss = (avgLoss * (period - 1)) / period;
      } else {
        avgGain = (avgGain * (period - 1)) / period;
        avgLoss = (avgLoss * (period - 1) + Math.abs(change)) / period;
      }
      rsi.push(100 - (100 / (1 + avgGain / avgLoss)));
    }
  }

  // Bollinger Bands (SMA 20)
  const bbPeriod = 20;
  const upper = [];
  const lower = [];
  
  for (let i = 0; i < closes.length; i++) {
    if (i < bbPeriod - 1) {
      upper.push(closes[i]);
      lower.push(closes[i]);
      continue;
    }
    const slice = closes.slice(i - bbPeriod + 1, i + 1);
    const mean = slice.reduce((a, b) => a + b, 0) / bbPeriod;
    const stdDev = Math.sqrt(slice.map(x => Math.pow(x - mean, 2)).reduce((a, b) => a + b, 0) / bbPeriod);
    upper.push(mean + (stdDev * 2));
    lower.push(mean - (stdDev * 2));
  }

  // MACD (12, 26, 9) - Simplified EMA
  const calcEMA = (data: number[], p: number) => {
    const k = 2 / (p + 1);
    const ema = [data[0]];
    for(let i=1; i<data.length; i++) {
      ema.push(data[i] * k + ema[i-1] * (1-k));
    }
    return ema;
  };

  const ema12 = calcEMA(closes, 12);
  const ema26 = calcEMA(closes, 26);
  const macdLine = ema12.map((v, i) => v - ema26[i]);
  const signalLine = calcEMA(macdLine, 9);

  return { rsi, upperBand: upper, lowerBand: lower, macd: macdLine, signal: signalLine };
}