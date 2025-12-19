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
    const rawBody = (error as any)?.context?.body as unknown;
    const parsedBody = tryParseJson(rawBody);
    if (status === 402 && parsedBody?.code === 'quota_exceeded') {
      throw new QuotaExceededError(parsedBody?.message ?? 'Quota exceeded. Please upgrade your plan.');
    }

    // Prefer richer details when the Edge Function returned a structured error body.
    const bodyMessage =
      (typeof parsedBody?.error === 'string' && parsedBody.error) ||
      (typeof parsedBody?.message === 'string' && parsedBody.message) ||
      null;

    const rawBodyMessage = typeof rawBody === 'string' && rawBody.trim() ? rawBody.trim() : null;

    if (status && bodyMessage) {
      const err = new Error(bodyMessage);
      (err as any).status = status;
      throw err;
    }

    if (status && rawBodyMessage) {
      const err = new Error(rawBodyMessage);
      (err as any).status = status;
      throw err;
    }

    if (status) {
      const err = new Error(error.message);
      (err as any).status = status;
      throw err;
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
  const result = await invokeGeminiFunction<{ advice: string }>({
    action: "generateStrategicAdvice",
    model: DEFAULT_MODEL,
    clusterName,
    feedbackItems,
    context,
  });

  return result.advice;
};

export const generateProductRecommendations = async (
  clusters: Cluster[],
  feedbackItems: string[],
  context?: string
): Promise<ProductRecommendation[]> => {
  const result = await invokeGeminiFunction<{ recommendations: ProductRecommendation[] }>({
    action: "generateProductRecommendations",
    model: DEFAULT_MODEL,
    clusters,
    feedbackItems,
    context,
  });
  return result.recommendations;
};

export const generateMarketResearch = async (
  category: 'competitors' | 'pricing' | 'market' | 'other',
  query: string,
  context?: string
): Promise<string> => {
  const result = await invokeGeminiFunction<{ markdown: string }>({
    action: "generateMarketResearch",
    model: DEFAULT_MODEL,
    category,
    query,
    context,
  });

  return result.markdown;
};

// Translate text to target language
export const translateText = async (
  text: string, 
  targetLanguage: string
): Promise<string> => {
  const result = await invokeGeminiFunction<{ translation: string }>({
    action: "translateText",
    model: DEFAULT_MODEL,
    text,
    targetLanguage,
  });

  return result.translation || text;
};