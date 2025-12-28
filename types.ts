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

export interface ResearchDossier {
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