export interface Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  dateStr: string;
}

export interface TechnicalIndicators {
  rsi: number[];
  upperBand: number[];
  lowerBand: number[];
  macd: number[];
  signal: number[];
  atr: number[]; // Added ATR for volatility-based stops
  pivotPoints: { // Added Pivot Points for support/resistance
    r1: number;
    r2: number;
    s1: number;
    s2: number;
    pivot: number;
  };
}

export interface AssetData {
  symbol: string;
  price: number;
  change24h: number;
  volume: number;
}

export interface MarketScanResult {
  symbol: string;
  score: number;
  volatilityIndex: string;
  reason: string;
}

export interface TradeSetup {
  action: 'BUY' | 'SELL' | 'WAIT';
  entryPrice: string;
  stopLoss: string;
  takeProfit: string;
  riskRewardRatio: string;
  confidenceScore: number;
  timeframe: string;
  patternDetected: string;
}

export interface ResearchDossier {
  tradeSetup: TradeSetup; // New structured signal
  summary: string;
  sentiment: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  news: Array<{ title: string; source: string; url?: string }>;
  technicalAnalysis: string;
  priceTarget: string;
}

export interface MindstreamLog {
  id: string;
  timestamp: string;
  message: string;
  type: 'info' | 'search' | 'calc' | 'success' | 'error';
}