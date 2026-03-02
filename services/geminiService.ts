
import { GoogleGenAI } from "@google/genai";
import { TrendItem, AnalysisResult, TrendReportItem } from "../types";
import { SocialSignal } from "./tikHubService";
import { KEYWORD_DICTIONARY_PROMPT } from "../constants";

// Use GEMINI_API_KEY as the primary key for Gemini models
const getApiKey = () => {
    const key = process.env.GEMINI_API_KEY || process.env.API_KEY || "";
    if (!key) {
        console.warn("API Key is missing. Please ensure GEMINI_API_KEY is set.");
    }
    return key;
};

const ai = new GoogleGenAI({ apiKey: getApiKey() });

export const checkApiKey = () => !!getApiKey();

const cleanAndParseJSON = (text: string, defaultValue: any) => {
    try {
        let clean = text.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
        const firstBrace = clean.indexOf('{');
        const firstBracket = clean.indexOf('[');
        let startIdx = -1;
        let openChar = '';
        let closeChar = '';

        if (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
            startIdx = firstBrace; openChar = '{'; closeChar = '}';
        } else if (firstBracket !== -1) {
            startIdx = firstBracket; openChar = '['; closeChar = ']';
        } else {
            return defaultValue;
        }

        let balance = 0;
        let endIdx = -1;
        let insideString = false;
        let escape = false;

        for (let i = startIdx; i < clean.length; i++) {
            const char = clean[i];
            if (escape) { escape = false; continue; }
            if (char === '\\') { escape = true; continue; }
            if (char === '"') { insideString = !insideString; continue; }
            if (!insideString) {
                if (char === openChar) balance++;
                else if (char === closeChar) {
                    balance--;
                    if (balance === 0) { endIdx = i; break; }
                }
            }
        }

        if (endIdx !== -1) {
            return JSON.parse(clean.substring(startIdx, endIdx + 1));
        }
        return defaultValue;
    } catch (e) {
        console.error("JSON Parse Error:", e);
        return defaultValue;
    }
}

const ensureString = (val: any): string => {
    if (typeof val === 'string') return val;
    if (val === null || val === undefined) return "";
    if (typeof val === 'object') {
        return Object.entries(val)
            .map(([k, v]) => `${k.toUpperCase()}: ${v}`)
            .join(". ");
    }
    return String(val);
};

export const getSearchSuggestions = async (query: string): Promise<string[]> => {
    const apiKey = getApiKey();
    if (!apiKey || query.length < 2) return [];
    const model = "gemini-flash-lite-latest"; 
    const prompt = `Suggest 5 viral search queries for visual trends based on: "${query}". Return a raw JSON array of strings only.`;
    try {
        const response = await ai.models.generateContent({
            model,
            contents: prompt,
            config: { responseMimeType: "application/json", temperature: 0.3 }
        });
        const data = cleanAndParseJSON(response.text || "[]", []);
        return Array.isArray(data) ? data.slice(0, 5) : [];
    } catch (error) {
        return [];
    }
};

export const searchGlobalTrends = async (
    query: string, 
    lang: 'en' | 'zh' = 'en', 
    timePeriod: '1w' | '1m' | '3m' = '1m',
    region: string = 'Global'
): Promise<TrendItem[]> => {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error("API Key Missing");
  const model = "gemini-3-flash-preview"; 
  const langInstruction = lang === 'zh' ? "Respond ONLY in Simplified Chinese (zh-CN)." : "Respond in English.";
  
  const prompt = `Perform a high-precision Global Trend Scan for: "${query}". 
  Time Period: Last ${timePeriod} (e.g., 1w = 1 week).
  Region: ${region}.
  
  Return exactly 5-8 trending topics. Focus on visual media and social aesthetics.
  ${langInstruction}
  
  Format: JSON array of objects.
  Properties: 
  - topic: string
  - category: string
  - summary: string (max 20 words)
  - trendScore: integer (0-100)
  - riskLevel: low/medium/high
  - platforms: string[]
  - views: string (e.g., "100M", "500K")
  - discussionCount: string (e.g., "50K")
  - searchVolume: string (e.g., "1.2M")
  - type: string (e.g., "photo editing", "lifestyle", "anime", "aesthetic style")
  - relatedPosts: array of { title: string, url: string } (provide 2-3 real links if possible)
  
  Only return JSON. No prose.`;

  const processData = (rawData: any[]) => {
      if (!Array.isArray(rawData)) return [];
      return rawData.map(item => ({
        ...item,
        id: `scan-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        timestamp: Date.now(),
        summary: ensureString(item.summary),
        platforms: Array.isArray(item.platforms) ? item.platforms : ['X', 'TikTok'],
        history: Array.from({ length: 20 }, () => Math.floor(Math.random() * 40) + 60),
        timePeriod,
        region
      }));
  };

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: { tools: [{ googleSearch: {} }] },
    });
    const data = cleanAndParseJSON(response.text || "[]", []);
    if (data.length === 0) throw new Error("No data from search");
    return processData(data);
  } catch (error) {
    console.warn("Search tool failed, falling back to internal knowledge:", error);
    try {
        const response = await ai.models.generateContent({
            model,
            contents: prompt + " (Use your internal knowledge to generate realistic trending topics for the current date: 2026-02-26)",
            config: { 
                responseMimeType: "application/json",
            },
        });
        const data = cleanAndParseJSON(response.text || "[]", []);
        return processData(data);
    } catch (fallbackError) {
        console.error("Fallback failed:", fallbackError);
        // Return mock data so the UI doesn't break completely
        return processData([
            {
                topic: "AI Video Generation",
                category: "Technology",
                summary: "Rapid advancements in AI video generation tools like Sora and Veo.",
                trendScore: 95,
                riskLevel: "medium",
                platforms: ["X", "YouTube", "TikTok"],
                views: "120M",
                discussionCount: "450K",
                searchVolume: "2.5M",
                type: "AI Tech",
                relatedPosts: []
            },
            {
                topic: "Y2K Aesthetic Revival",
                category: "Fashion & Lifestyle",
                summary: "Early 2000s fashion and design trends making a massive comeback on social media.",
                trendScore: 88,
                riskLevel: "low",
                platforms: ["TikTok", "Instagram"],
                views: "85M",
                discussionCount: "210K",
                searchVolume: "1.1M",
                type: "Lifestyle",
                relatedPosts: []
            },
            {
                topic: "Cozy Gaming Setups",
                category: "Gaming",
                summary: "Aesthetic, warm, and comfortable gaming room setups going viral.",
                trendScore: 76,
                riskLevel: "low",
                platforms: ["Instagram", "Pinterest", "TikTok"],
                views: "40M",
                discussionCount: "85K",
                searchVolume: "500K",
                type: "Aesthetic",
                relatedPosts: []
            }
        ]);
    }
  }
};

export const analyzeDeepDive = async (trend: TrendItem, lang: 'en' | 'zh' = 'en'): Promise<AnalysisResult> => {
    const model = "gemini-3-flash-preview"; 
    const langInstruction = lang === 'zh' ? "Respond ONLY in Simplified Chinese (zh-CN). Keep the prompt in English if technical, but explain in Chinese." : "Respond in English.";

    const prompt = `Perform a technical Creator Production Analysis for "${trend.topic}".
    Use the dictionary for classification: ${KEYWORD_DICTIONARY_PROMPT}.
    
    The goal is to provide a technical blueprint for creators to reproduce this trend perfectly.
    ${langInstruction}
    
    Return JSON format:
    {
      "deepDive": "Strategic context on why this aesthetic is trending now.",
      "marketFit": "The core demographic/audience for this trend.",
      "visualPrompt": "A highly detailed, professional Midjourney v6 / Flux.1 prompt including camera settings, lighting, and style keywords. (Keep Prompt in English)",
      "scores": {"monetization": 0-100, "virality": 0-100, "feasibility": 0-100, "competition": 0-100},
      "guideline": {
        "matchedCategory": "Category from dictionary (e.g., 3.1 Anime Filter)",
        "coreKeyword": "The primary aesthetic keyword (e.g., 'Retro PS2 Look')",
        "productionSteps": ["Step-by-step technical instructions for capturing or editing the content."],
        "requiredAssets": ["List of physical props, digital overlays, or specific photo types needed."],
        "recommendedTools": ["Specific professional software or viral apps (e.g., CapCut, Luma AI, Lightroom)."],
        "commercialPotential": "Low/Medium/High"
      }
    }
    
    CRITICAL: Avoid generic advice. Be technical, practical, and focus on visual production techniques.`;
  
    try {
      let response;
      try {
          response = await ai.models.generateContent({
            model,
            contents: prompt,
            config: { tools: [{ googleSearch: {} }] },
          });
      } catch (e) {
          response = await ai.models.generateContent({
              model,
              contents: prompt,
              config: { responseMimeType: "application/json" },
          });
      }
  
      const data = cleanAndParseJSON(response.text || "{}", {});
      
      return {
        trendId: trend.id,
        deepDive: ensureString(data.deepDive),
        marketFit: ensureString(data.marketFit),
        strategies: [],
        visualPrompt: ensureString(data.visualPrompt),
        scores: data.scores || { monetization: 50, virality: 50, feasibility: 50, competition: 50 },
        relatedLinks: [],
        guideline: data.guideline || { 
          matchedCategory: "General Intelligence", 
          coreKeyword: trend.topic, 
          productionSteps: [], 
          requiredAssets: [],
          recommendedTools: [], 
          commercialPotential: "Medium" 
        }
      };
    } catch (error) {
      console.error("Analysis Error:", error);
      throw error;
    }
  };

export const generateTrendImage = async (prompt: string, size: '1K' | '2K' | '4K' = '1K') => {
    // When using gemini-3-pro-image-preview, users MUST select their own API key.
    // @ts-ignore
    if (window.aistudio && !(await window.aistudio.hasSelectedApiKey())) {
        // @ts-ignore
        await window.aistudio.openSelectKey();
    }
    
    // Create fresh GoogleGenAI instance right before the call to ensure updated key usage
    const apiKey = getApiKey();
    const imageAi = new GoogleGenAI({ apiKey });
    try {
        const response = await imageAi.models.generateContent({
            model: "gemini-3-pro-image-preview",
            contents: { parts: [{ text: prompt }] },
            config: { imageConfig: { aspectRatio: "1:1", imageSize: size } }
        });
        const part = response.candidates?.[0]?.content?.parts.find(p => p.inlineData);
        return part ? `data:${part.inlineData?.mimeType};base64,${part.inlineData?.data}` : null;
    } catch (e: any) {
        const errorMsg = e?.message || "";
        const isAuthError = errorMsg.includes("Requested entity was not found.") || 
                           errorMsg.includes("PERMISSION_DENIED") || 
                           errorMsg.includes("403");

        if (isAuthError && (window as any).aistudio) {
            // Prompt user to select a valid paid project API key
            (window as any).aistudio.openSelectKey();
        }
        console.error("Image Generation Error:", e);
        return null;
    }
};

export const runGrowthAnalyticsAgent = async (signals: SocialSignal[]): Promise<TrendReportItem[]> => {
    const model = "gemini-3-pro-preview";
    const prompt = `Analyze these signals: ${JSON.stringify(signals)}. Return JSON array of TrendReportItems.`;
    try {
        const response = await ai.models.generateContent({
            model,
            contents: prompt,
            config: { responseMimeType: "application/json" },
        });
        const parsed = cleanAndParseJSON(response.text || "[]", []);
        return (parsed as any[]).map(item => ({
            ...item,
            keyword: ensureString(item.keyword),
            sample_content: ensureString(item.sample_content)
        }));
    } catch (error) {
        return [];
    }
};
