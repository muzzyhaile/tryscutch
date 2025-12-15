import { supabase } from "../lib/supabaseClient";
import { AnalysisResult, Cluster, ProductRecommendation } from "../types";

const FUNCTION_NAME = "gemini";
const DEFAULT_MODEL = "gemini-2.5-flash";

export class QuotaExceededError extends Error {
  readonly code = 'quota_exceeded';
  readonly status = 402;

  constructor(message: string) {
    super(message);
    this.name = 'QuotaExceededError';
  }
}

function tryParseJson(value: unknown): any {
  if (value == null) return null;
  if (typeof value === 'object') return value;
  if (typeof value !== 'string') return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

async function invokeGeminiFunction<T>(body: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.functions.invoke(FUNCTION_NAME, {
    body,
  });

  if (error) {
    const status = (error as any)?.context?.status as number | undefined;
    const parsedBody = tryParseJson((error as any)?.context?.body);
    if (status === 402 && parsedBody?.code === 'quota_exceeded') {
      throw new QuotaExceededError(parsedBody?.message ?? 'Quota exceeded. Please upgrade your plan.');
    }
    throw new Error(error.message);
  }

  return data as T;
}

export const analyzeFeedbackBatch = async (
  feedbackItems: string[],
  context?: string
): Promise<AnalysisResult> => {
  try {
    return await invokeGeminiFunction<AnalysisResult>({
      action: "analyzeFeedbackBatch",
      model: DEFAULT_MODEL,
      feedbackItems,
      context,
    });
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
  try {
    const result = await invokeGeminiFunction<{ advice: string }>({
      action: "generateStrategicAdvice",
      model: DEFAULT_MODEL,
      clusterName,
      feedbackItems,
      context,
    });

    return result.advice;
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
  try {
  const result = await invokeGeminiFunction<{ recommendations: ProductRecommendation[] }>({
    action: "generateProductRecommendations",
    model: DEFAULT_MODEL,
    clusters,
    feedbackItems,
    context,
  });
  return result.recommendations;
  } catch (e) {
  console.error("Product Recommendations Error", e);
  return [];
  }
};

export const generateMarketResearch = async (
  category: 'competitors' | 'pricing' | 'market' | 'other',
  query: string,
  context?: string
): Promise<string> => {
  try {
    const result = await invokeGeminiFunction<{ markdown: string }>({
      action: "generateMarketResearch",
      model: DEFAULT_MODEL,
      category,
      query,
      context,
    });

    return result.markdown;
  } catch (e) {
    console.error('Market Research Error', e);
    return 'Failed to generate market research. Please try again.';
  }
};

// Translate text to target language
export const translateText = async (
  text: string, 
  targetLanguage: string
): Promise<string> => {
  try {
    const result = await invokeGeminiFunction<{ translation: string }>({
      action: "translateText",
      model: DEFAULT_MODEL,
      text,
      targetLanguage,
    });

    return result.translation || text;
  } catch (e) {
    console.error("Translation Error", e);
    return text;
  }
};