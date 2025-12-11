/**
 * AI Service abstraction layer using Strategy pattern
 * Allows swapping AI providers without changing application code
 */

import { AnalysisResult, ProductRecommendation, Cluster } from '../types';

export interface AIProvider {
  analyzeFeedback(items: string[], context?: string): Promise<AnalysisResult>;
  generateStrategicAdvice(cluster: Cluster, context: string, allFeedback: string[]): Promise<string>;
  generateRecommendations(clusters: Cluster[], feedback: string[], context?: string): Promise<ProductRecommendation[]>;
  translateText(text: string, targetLanguage: string): Promise<string>;
}

/**
 * Configuration for AI service
 */
export interface AIServiceConfig {
  apiKey: string;
  model?: string;
  maxRetries?: number;
  timeout?: number;
}

/**
 * AI Service using strategy pattern
 * Delegates to the configured provider
 */
export class AIService {
  private provider: AIProvider;

  constructor(provider: AIProvider) {
    this.provider = provider;
  }

  /**
   * Switch to a different AI provider at runtime
   */
  setProvider(provider: AIProvider): void {
    this.provider = provider;
  }

  async analyzeFeedback(items: string[], context?: string): Promise<AnalysisResult> {
    return this.provider.analyzeFeedback(items, context);
  }

  async generateStrategicAdvice(
    cluster: Cluster,
    context: string,
    allFeedback: string[]
  ): Promise<string> {
    return this.provider.generateStrategicAdvice(cluster, context, allFeedback);
  }

  async generateRecommendations(
    clusters: Cluster[],
    feedback: string[],
    context?: string
  ): Promise<ProductRecommendation[]> {
    return this.provider.generateRecommendations(clusters, feedback, context);
  }

  async translateText(text: string, targetLanguage: string): Promise<string> {
    return this.provider.translateText(text, targetLanguage);
  }
}

/**
 * Mock provider for testing
 */
export class MockAIProvider implements AIProvider {
  async analyzeFeedback(items: string[], context?: string): Promise<AnalysisResult> {
    return {
      summary: 'Mock analysis summary',
      overallSentiment: 0.5,
      clusters: [
        {
          id: 'cluster-1',
          name: 'Mock Cluster',
          description: 'Test cluster description',
          sentimentScore: 0.5,
          priorityScore: 7,
          itemCount: items.length,
          itemIndices: items.map((_, i) => i),
          isEmerging: false,
          keyInsights: ['Mock insight 1', 'Mock insight 2'],
        },
      ],
      topPriorities: ['Priority 1', 'Priority 2'],
      totalItemsProcessed: items.length,
    };
  }

  async generateStrategicAdvice(): Promise<string> {
    return 'Mock strategic advice';
  }

  async generateRecommendations(): Promise<ProductRecommendation[]> {
    return [
      {
        id: 'rec-1',
        title: 'Mock Recommendation',
        description: 'Mock recommendation description',
        category: 'feature',
        priority: 'high',
        effort: 'medium',
        impact: 'High impact on user satisfaction',
        relatedClusters: [],
      },
    ];
  }

  async translateText(text: string): Promise<string> {
    return `Translated: ${text}`;
  }
}
