import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult, Cluster, ProductRecommendation } from "../types";

// Initialize Gemini Client
// CRITICAL: process.env.API_KEY must be available in the environment.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const ANALYSIS_MODEL = "gemini-2.5-flash";

export const analyzeFeedbackBatch = async (
  feedbackItems: string[],
  context?: string
): Promise<AnalysisResult> => {
  if (!process.env.API_KEY) {
    throw new Error("API Key is missing. Please check your environment configuration.");
  }

  // Limit items for the demo to prevent context overflow/latency.
  // We'll take the first 500 items effectively.
  const slicedItems = feedbackItems.slice(0, 500);
  
  // Create a numbered list for the AI to reference
  const feedbackText = slicedItems.map((item, i) => `[ID: ${i}] ${item}`).join("\n");

  const prompt = `
    You are a world-class Voice-of-Customer analyst. 
    Analyze the following list of customer feedback items.
    ${context ? `\nPRODUCT/COMPANY CONTEXT:\n${context}\n` : ''}
    
    Tasks:
    1. Group the feedback into stable, distinct taxonomic clusters based on semantic meaning.
    2. IMPORTANT: For each cluster, you MUST list the "itemIds" (the integers provided in the input) of the specific feedback items that belong to it.
    3. Analyze the sentiment of each cluster (-1.0 to 1.0).
    4. Assign a priority score (1-10) based on urgency, severity, and frequency.
    5. Detect if a theme is "emerging" (new, rapid growth, or acute recent pain point).
    6. Provide a high-level executive summary of the entire dataset.
    7. Extract the top 3-5 distinct actionable priorities.

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
            text: `FEEDBACK DATA LIST:\n${feedbackText}`
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
                  itemIds: { 
                    type: Type.ARRAY, 
                    items: { type: Type.NUMBER }, 
                    description: "The list of integer IDs (from the input) that belong to this cluster." 
                  },
                  isEmerging: { type: Type.BOOLEAN, description: "True if this is an emerging trend." },
                  keyInsights: { 
                      type: Type.ARRAY, 
                      items: { type: Type.STRING }, 
                      description: "2-3 key specific points mentioned in this cluster." 
                  }
                },
                required: ["name", "description", "sentimentScore", "priorityScore", "itemIds", "isEmerging", "keyInsights"]
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

    // Map response to our internal types
    const clusters: Cluster[] = data.clusters.map((c: any, index: number) => ({
      id: `cluster-${index}-${Date.now()}`,
      name: c.name,
      description: c.description,
      sentimentScore: c.sentimentScore,
      priorityScore: c.priorityScore,
      itemCount: c.itemIds ? c.itemIds.length : 0,
      itemIndices: c.itemIds || [], // Store the indices
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

export const generateStrategicAdvice = async (
  clusterName: string,
  feedbackItems: string[],
  context?: string
): Promise<string> => {
    if (!process.env.API_KEY) {
        throw new Error("API Key is missing.");
    }

    const itemsText = feedbackItems.slice(0, 50).map(i => `- ${i}`).join("\n");

    const prompt = `
        You are a specialized Product Strategy Consultant.
        Focus Topic: "${clusterName}"
        ${context ? `Product Context: ${context}` : ''}
        
        Analyze the raw feedback items below related to this topic.
        Provide a concise, high-impact strategic implementation plan.
        
        Structure your response in Markdown:
        1. **Root Cause Diagnosis**: What is really happening?
        2. **Strategic Recommendation**: What should be done? (Short term & Long term)
        3. **Expected Impact**: Why does this matter?
        
        Keep it professional, direct, and actionable. No fluff.
        
        Feedback Items:
        ${itemsText}
    `;

    try {
        const response = await ai.models.generateContent({
            model: ANALYSIS_MODEL,
            contents: [{ text: prompt }]
        });
        return response.text || "Could not generate advice.";
    } catch (e) {
        console.error("Strategy Gen Error", e);
        return "Failed to generate strategic advice. Please try again.";
    }
};

export const generateProductRecommendations = async (
  clusters: Cluster[],
  feedbackItems: string[],
  context?: string
): Promise<ProductRecommendation[]> => {
    if (!process.env.API_KEY) {
        throw new Error("API Key is missing.");
    }

    const clustersText = clusters.map(c => 
        `- ${c.name} (Priority: ${c.priorityScore}/10, Sentiment: ${c.sentimentScore.toFixed(2)}, Volume: ${c.itemCount})\n  ${c.description}`
    ).join("\n");

    const prompt = `
        You are a Product Manager analyzing customer feedback to generate actionable product recommendations.
        ${context ? `Product Context: ${context}` : ''}
        
        Based on the following feedback themes and clusters, generate 5-8 specific, actionable product recommendations.
        Each recommendation should address real pain points or opportunities identified in the feedback.
        
        Clusters:
        ${clustersText}
        
        For each recommendation, provide:
        - A clear, specific title
        - A detailed description of what should be built/changed/fixed
        - Category: feature, improvement, fix, or enhancement
        - Priority: high, medium, or low (based on impact and urgency)
        - Effort estimate: low, medium, or high
        - Expected impact on users
        - Which cluster IDs this addresses (use the cluster names to identify)
        
        Return as structured JSON.
    `;

    try {
        const response = await ai.models.generateContent({
            model: ANALYSIS_MODEL,
            contents: [{ text: prompt }],
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        recommendations: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    title: { type: Type.STRING },
                                    description: { type: Type.STRING },
                                    category: { type: Type.STRING, enum: ["feature", "improvement", "fix", "enhancement"] },
                                    priority: { type: Type.STRING, enum: ["high", "medium", "low"] },
                                    effort: { type: Type.STRING, enum: ["low", "medium", "high"] },
                                    impact: { type: Type.STRING },
                                    relatedClusterNames: { type: Type.ARRAY, items: { type: Type.STRING } }
                                },
                                required: ["title", "description", "category", "priority", "effort", "impact", "relatedClusterNames"]
                            }
                        }
                    },
                    required: ["recommendations"]
                }
            }
        });

        const data = JSON.parse(response.text);
        
        // Map cluster names back to IDs
        return data.recommendations.map((rec: any, index: number) => ({
            id: `rec-${index}-${Date.now()}`,
            title: rec.title,
            description: rec.description,
            category: rec.category,
            priority: rec.priority,
            effort: rec.effort,
            impact: rec.impact,
            relatedClusters: rec.relatedClusterNames
                .map((name: string) => clusters.find(c => c.name.toLowerCase().includes(name.toLowerCase()))?.id)
                .filter(Boolean)
        }));
    } catch (e) {
        console.error("Product Recommendations Error", e);
        return [];
    }
};