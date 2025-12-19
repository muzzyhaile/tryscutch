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

async function readBodyAsText(body: unknown): Promise<string | null> {
  if (body == null) return null;
  if (typeof body === 'string') return body;

  // Browser: Blob returned by fetch.
  if (typeof Blob !== 'undefined' && body instanceof Blob) {
    try {
      return await body.text();
    } catch {
      return null;
    }
  }

  // Browser/Edge: ReadableStream body.
  const maybeStream = body as any;
  if (maybeStream && typeof maybeStream.getReader === 'function') {
    try {
      return await new Response(maybeStream).text();
    } catch {
      return null;
    }
  }

  // ArrayBuffer / Uint8Array.
  if (body instanceof ArrayBuffer) {
    try {
      return new TextDecoder().decode(new Uint8Array(body));
    } catch {
      return null;
    }
  }
  if (body instanceof Uint8Array) {
    try {
      return new TextDecoder().decode(body);
    } catch {
      return null;
    }
  }

  return null;
}

function tryParseJsonFromText(value: string | null): any {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  try {
    return JSON.parse(trimmed);
  } catch {
    return null;
  }
}

function safeJsonStringify(value: unknown): string {
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

async function invokeGeminiFunction<T>(body: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.functions.invoke(FUNCTION_NAME, {
    body,
  });

  if (error) {
    const status = (error as any)?.context?.status as number | undefined;
    const rawBody = (error as any)?.context?.body as unknown;
    const rawText = await readBodyAsText(rawBody);
    const parsedBody =
      rawBody && typeof rawBody === 'object' && rawText == null ? rawBody : tryParseJsonFromText(rawText);

    // Diagnostics: Supabase returns a generic error message for non-2xx.
    // We log the status + body (if present) so we can see the actual Edge Function error.
    // This does not include secrets.
    // eslint-disable-next-line no-console
    console.error('[gemini] Edge Function error (details):', safeJsonStringify({
      status,
      parsedBody,
      rawText: rawText && rawText.length > 2000 ? `${rawText.slice(0, 2000)}…` : rawText,
      rawBodyType: typeof rawBody,
      hasRawBody: rawBody != null,
      supabaseMessage: error.message,
    }));

    if (status === 402 && parsedBody?.code === 'quota_exceeded') {
      throw new QuotaExceededError(parsedBody?.message ?? 'Quota exceeded. Please upgrade your plan.');
    }

    // Prefer richer details when the Edge Function returned a structured error body.
    const bodyMessage =
      (typeof (parsedBody as any)?.error === 'string' && (parsedBody as any).error) ||
      (typeof (parsedBody as any)?.message === 'string' && (parsedBody as any).message) ||
      null;

    const rawBodyMessage = rawText && rawText.trim() ? rawText.trim() : null;

    // If the function returned a structured body but without `message`/`error`, still surface it.
    const structuredFallback =
      parsedBody && typeof parsedBody === 'object' ? safeJsonStringify(parsedBody) : null;

    if (status && bodyMessage) {
      const err = new Error(bodyMessage);
      (err as any).status = status;
      (err as any).code = parsedBody?.code;
      throw err;
    }

    if (status && structuredFallback) {
      const err = new Error(structuredFallback);
      (err as any).status = status;
      (err as any).code = parsedBody?.code;
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