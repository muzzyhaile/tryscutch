import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult, Cluster } from "../types";

// Initialize Gemini Client
// CRITICAL: process.env.API_KEY must be available in the environment.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const ANALYSIS_MODEL = "gemini-2.5-flash";

export const analyzeFeedbackBatch = async (
  feedbackItems: string[]
): Promise<AnalysisResult> => {
  if (!process.env.API_KEY) {
    throw new Error("API Key is missing. Please check your environment configuration.");
  }

  // Limit items for the demo to prevent context overflow/latency, though Flash handles 1M tokens.
  // We'll take the first 500 items effectively.
  const slicedItems = feedbackItems.slice(0, 500);
  const feedbackText = slicedItems.map((item, i) => `[${i + 1}] ${item}`).join("\n");

  const prompt = `
    You are a world-class Voice-of-Customer analyst. 
    Analyze the following list of customer feedback items. 
    
    Tasks:
    1. Group them into stable, distinct taxonomic clusters based on semantic meaning.
    2. Analyze the sentiment of each cluster (-1.0 to 1.0).
    3. Assign a priority score (1-10) based on urgency, severity, and frequency.
    4. Detect if a theme is "emerging" (new, rapid growth, or acute recent pain point).
    5. Provide a high-level executive summary of the entire dataset.
    6. Extract the top 3-5 distinct actionable priorities.

    Return the result in strictly structured JSON format.
  `;

  try {
    const response = await ai.models.generateContent({
      model: ANALYSIS_MODEL,
      contents: [
        {
            text: prompt
        },
        {
            text: `FEEDBACK DATA:\n${feedbackText}`
        }
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING, description: "Executive summary of all feedback." },
            overallSentiment: { type: Type.NUMBER, description: "Average sentiment across all feedback (-1 to 1)." },
            topPriorities: { 
                type: Type.ARRAY, 
                items: { type: Type.STRING },
                description: "List of top 3-5 actionable priorities."
            },
            clusters: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING, description: "Short, clear name for the cluster." },
                  description: { type: Type.STRING, description: "1-2 sentence description of the theme." },
                  sentimentScore: { type: Type.NUMBER, description: "Sentiment score for this cluster (-1 to 1)." },
                  priorityScore: { type: Type.NUMBER, description: "Priority score (1-10)." },
                  itemCount: { type: Type.NUMBER, description: "Estimated number of items in this cluster from the provided list." },
                  isEmerging: { type: Type.BOOLEAN, description: "True if this is an emerging trend." },
                  keyInsights: { 
                      type: Type.ARRAY, 
                      items: { type: Type.STRING }, 
                      description: "2-3 key specific points mentioned in this cluster." 
                  }
                },
                required: ["name", "description", "sentimentScore", "priorityScore", "itemCount", "isEmerging", "keyInsights"]
              }
            }
          },
          required: ["summary", "overallSentiment", "topPriorities", "clusters"]
        }
      }
    });

    const jsonText = response.text;
    if (!jsonText) {
        throw new Error("Empty response from Gemini.");
    }

    const data = JSON.parse(jsonText);

    // Map response to our internal types, adding IDs
    const clusters: Cluster[] = data.clusters.map((c: any, index: number) => ({
      id: `cluster-${index}-${Date.now()}`,
      name: c.name,
      description: c.description,
      sentimentScore: c.sentimentScore,
      priorityScore: c.priorityScore,
      itemCount: c.itemCount,
      isEmerging: c.isEmerging,
      keyInsights: c.keyInsights || []
    }));

    return {
      summary: data.summary,
      overallSentiment: data.overallSentiment,
      clusters,
      topPriorities: data.topPriorities,
      totalItemsProcessed: slicedItems.length
    };

  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    throw error;
  }
};
