/**
 * Gemini AI Provider implementation
 * Implements the AIProvider interface using Google's Gemini API
 */

import { GoogleGenAI, Type } from "@google/genai";
import type { AIProvider, AIServiceConfig } from './aiService';
import { AnalysisResult, ProductRecommendation, Cluster } from '../types';

export class GeminiProvider implements AIProvider {
  private ai: GoogleGenAI;
  private model: string;

  constructor(config: AIServiceConfig) {
    if (!config.apiKey) {
      throw new Error("API Key is required for Gemini provider");
    }
    this.ai = new GoogleGenAI({ apiKey: config.apiKey });
    this.model = config.model || "gemini-2.5-flash";
  }

  async analyzeFeedback(items: string[], context?: string): Promise<AnalysisResult> {
    const slicedItems = items.slice(0, 500);
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

    const response = await this.ai.models.generateContent({
      model: this.model,
      contents: [
        { text: prompt },
        { text: `FEEDBACK DATA LIST:\n${feedbackText}` }
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

    const clustersWithMetadata: Cluster[] = data.clusters.map((c: any, idx: number) => ({
      id: `cluster-${idx + 1}`,
      name: c.name,
      description: c.description,
      sentimentScore: c.sentimentScore,
      priorityScore: c.priorityScore,
      itemCount: c.itemIds?.length || 0,
      itemIndices: c.itemIds || [],
      isEmerging: c.isEmerging || false,
      keyInsights: c.keyInsights || []
    }));

    return {
      summary: data.summary,
      overallSentiment: data.overallSentiment,
      clusters: clustersWithMetadata,
      topPriorities: data.topPriorities,
      totalItemsProcessed: slicedItems.length
    };
  }

  async generateStrategicAdvice(
    cluster: Cluster,
    context: string,
    allFeedback: string[]
  ): Promise<string> {
    const relevantFeedback = cluster.itemIndices
      .map(idx => allFeedback[idx])
      .filter(Boolean)
      .join("\n");

    const prompt = `You are an expert product strategist. Given the following feedback cluster and context, provide strategic recommendations.

CONTEXT: ${context}

CLUSTER NAME: ${cluster.name}
CLUSTER DESCRIPTION: ${cluster.description}
KEY INSIGHTS: ${cluster.keyInsights.join(", ")}

RELEVANT FEEDBACK:
${relevantFeedback}

Provide detailed strategic advice on how to address this theme. Consider:
- Root cause analysis
- Short-term vs long-term solutions
- Trade-offs and implementation challenges
- Success metrics

Be specific and actionable.`;

    const response = await this.ai.models.generateContent({
      model: this.model,
      contents: [{ text: prompt }]
    });

    return response.text || "No advice generated.";
  }

  async generateRecommendations(
    clusters: Cluster[],
    feedback: string[],
    context?: string
  ): Promise<ProductRecommendation[]> {
    const clusterSummaries = clusters.map(c => ({
      name: c.name,
      description: c.description,
      priority: c.priorityScore,
      sentiment: c.sentimentScore
    }));

    const prompt = `You are a product strategist. Based on these feedback clusters, generate 3-5 specific product recommendations.

${context ? `CONTEXT: ${context}\n` : ''}

CLUSTERS:
${JSON.stringify(clusterSummaries, null, 2)}

For each recommendation, provide:
- Title
- Description
- Category (feature/improvement/fix/enhancement)
- Priority (high/medium/low)
- Effort estimate (low/medium/high)
- Expected impact
- Related cluster names`;

    const response = await this.ai.models.generateContent({
      model: this.model,
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
                  category: { type: Type.STRING },
                  priority: { type: Type.STRING },
                  effort: { type: Type.STRING },
                  impact: { type: Type.STRING },
                  relatedClusters: { type: Type.ARRAY, items: { type: Type.STRING } }
                }
              }
            }
          }
        }
      }
    });

    const data = JSON.parse(response.text || '{"recommendations":[]}');

    return data.recommendations.map((rec: any, idx: number) => ({
      id: `rec-${idx + 1}`,
      title: rec.title,
      description: rec.description,
      category: rec.category,
      priority: rec.priority,
      effort: rec.effort,
      impact: rec.impact,
      relatedClusters: rec.relatedClusters?.map((name: string) => 
        clusters.find(c => c.name.toLowerCase() === name.toLowerCase())?.id || ''
      ).filter(Boolean) || []
    }));
  }

  async translateText(text: string, targetLanguage: string): Promise<string> {
    const prompt = `Translate the following text to ${targetLanguage}. Maintain formatting and structure. Only provide the translation, no explanations.

TEXT TO TRANSLATE:
${text}`;

    const response = await this.ai.models.generateContent({
      model: this.model,
      contents: [{ text: prompt }]
    });

    return response.text || text;
  }
}
