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
  
  onLog(`Initializing Gemini Deep Research Agent for ${symbol}...`);

  const lastPrice = candles[candles.length - 1].close;
  const lastRSI = technicals.rsi[technicals.rsi.length - 1];
  
  const techSummary = `Price: ${lastPrice}, RSI(14): ${lastRSI.toFixed(2)}. Latest trend: ${candles[candles.length - 1].close > candles[candles.length - 50].close ? 'Up' : 'Down'}`;
  
  const prompt = `
    Act as a "Deep Research Agent" specialized in financial markets.
    Target Asset: ${symbol}
    Technical Context: ${techSummary}
    
    MISSION CRITICAL INSTRUCTIONS:
    1. UTILIZE the Google Search Tool to perform a massive, deep-sweep information gathering operation. Search for: "${symbol} latest news", "${symbol} regulatory filings", "${symbol} partnership rumors", "${symbol} reddit sentiment", "${symbol} protocol upgrades".
    2. MANDATORY: You must identify and summarize at least 15-20 DISTINCT, reputable news sources or forum discussions from the last 7 days. Do not settle for 3-4 items. Dig deeper.
    3. FOCUS on factual reporting (hacks, earnings, mainnet launches) over idle speculation.
    4. SYNTHESIZE a "Technical Outlook" based on the provided technical indicators.
    
    OUTPUT FORMAT:
    Return strictly JSON with the schema defined below. Do not include markdown formatting like \`\`\`json.
  `;

  onLog("Dispatching Google Search spiders (Target: 15+ Sources)...");

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
            summary: { type: Type.STRING, description: "Executive summary of the current market situation." },
            sentiment: { type: Type.STRING, enum: ['BULLISH', 'BEARISH', 'NEUTRAL'] },
            news: {
              type: Type.ARRAY,
              description: "A list of at least 15 found news items.",
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

    onLog("Parsing intelligence data...");
    
    const result = JSON.parse(response.text || "{}");
    return result;

  } catch (e) {
    onLog("ERROR: Intelligence gathering failed.");
    console.error(e);
    throw e;
  }
}