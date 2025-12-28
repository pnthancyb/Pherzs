import { GoogleGenAI, Type, SchemaType } from "@google/genai";
import { AssetData, MarketScanResult, ResearchDossier, Candle, TechnicalIndicators } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// --- SCANNER (Gemini Flash) ---
export async function scanMarket(assets: AssetData[]): Promise<MarketScanResult[]> {
  const prompt = `
    Analyze this crypto market data. Identify the top 3 highest volatility setups that are worth watching for a high-frequency trader.
    Data: ${JSON.stringify(assets)}
    
    Return JSON only.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              symbol: { type: Type.STRING },
              score: { type: Type.NUMBER, description: "0-100 relevance score" },
              volatilityIndex: { type: Type.STRING, description: "e.g., 'EXTREME', 'HIGH', 'MODERATE'" },
              reason: { type: Type.STRING, description: "One concise sentence explaining the technical setup." }
            }
          }
        }
      }
    });

    return JSON.parse(response.text || "[]");
  } catch (e) {
    console.error("Scanner failed", e);
    return [];
  }
}

// --- DEEP DIVE (Gemini Pro + Search) ---
export async function generateDossier(
  symbol: string, 
  candles: Candle[], 
  technicals: TechnicalIndicators,
  onLog: (msg: string) => void
): Promise<ResearchDossier> {
  
  onLog(`Initializing Pherzs Logic Core for ${symbol}...`);

  const lastPrice = candles[candles.length - 1].close;
  const lastRSI = technicals.rsi[technicals.rsi.length - 1];
  const lastATR = technicals.atr[technicals.atr.length - 1];
  
  // Mathematical Context for the AI
  const mathContext = `
    Symbol: ${symbol}
    Current Price: ${lastPrice}
    RSI(14): ${lastRSI.toFixed(2)}
    ATR(14): ${lastATR.toFixed(4)}
    Pivot Point: ${technicals.pivotPoints.pivot.toFixed(2)}
    R1: ${technicals.pivotPoints.r1.toFixed(2)}
    S1: ${technicals.pivotPoints.s1.toFixed(2)}
    Trend: ${candles[candles.length - 1].close > candles[candles.length - 50].close ? 'Up' : 'Down'}
  `;
  
  const prompt = `
    You are 'Pherzs', an elite AI trading assistant. You embody the principles of the 'Trading Bible':
    1. **Discipline:** No emotions. Strictly rule-based.
    2. **Risk Management:** Never risk more than 1-2% of capital per trade. Use tight stops based on volatility (ATR).
    3. **Trend:** The trend is your friend. Don't fight it unless there is a clear reversal pattern (Head & Shoulders, Double Top/Bottom).
    4. **Psychology:** Be a realist. Trading is not gambling.
    
    TASK:
    1. Analyze the provided technical data (${mathContext}).
    2. Search Google for "${symbol} crypto news", "${symbol} regulatory announcements", "market sentiment for ${symbol}".
    3. Determine a concrete TRADE SETUP (Buy, Sell, or Wait).
    4. Calculate precise Entry, Stop Loss (using ATR logic from the Trading Bible: usually 1.5x to 2x ATR from entry), and Take Profit levels.
    
    OUTPUT FORMAT:
    Return strictly JSON.
  `;

  onLog("Dispatching Deep Research Agent...");

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            tradeSetup: {
              type: Type.OBJECT,
              properties: {
                action: { type: Type.STRING, enum: ['BUY', 'SELL', 'WAIT'] },
                entryPrice: { type: Type.STRING, description: "Specific price or 'Market'" },
                stopLoss: { type: Type.STRING, description: "Specific price based on ATR logic" },
                takeProfit: { type: Type.STRING, description: "Specific price based on Resistance/Pivot" },
                riskRewardRatio: { type: Type.STRING, description: "e.g. 1:2.5" },
                confidenceScore: { type: Type.NUMBER, description: "1-100" },
                timeframe: { type: Type.STRING, description: "e.g. Intraday, Swing" },
                patternDetected: { type: Type.STRING, description: "e.g. Bull Flag, Head & Shoulders, Consolidation" }
              }
            },
            summary: { type: Type.STRING, description: "Executive summary of the market situation." },
            sentiment: { type: Type.STRING, enum: ['BULLISH', 'BEARISH', 'NEUTRAL'] },
            news: {
              type: Type.ARRAY,
              description: "Relevant news items found.",
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  source: { type: Type.STRING },
                  url: { type: Type.STRING } 
                }
              }
            },
            technicalAnalysis: { type: Type.STRING },
            priceTarget: { type: Type.STRING }
          }
        }
      }
    });

    onLog("Synthesizing Pherzs Strategy Report...");
    
    const result = JSON.parse(response.text || "{}");
    return result;

  } catch (e) {
    onLog("ERROR: Intelligence gathering failed.");
    console.error(e);
    throw e;
  }
}