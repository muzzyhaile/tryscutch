export interface FeedbackItem {
  id: string;
  content: string;
  source?: string;
  date?: string;
}

export interface Cluster {
  id: string;
  name: string;
  description: string;
  sentimentScore: number; // -1 to 1
  priorityScore: number; // 1 to 10
  itemCount: number;
  itemIndices: number[]; // Indices of the FeedbackItems in the original array
  isEmerging: boolean;
  keyInsights: string[];
  strategicAdvice?: string; // Specialized AI feedback
}

export interface ProductRecommendation {
  id: string;
  title: string;
  description: string;
  category: 'feature' | 'improvement' | 'fix' | 'enhancement';
  priority: 'high' | 'medium' | 'low';
  effort: 'low' | 'medium' | 'high';
  impact: string;
  relatedClusters: string[]; // Cluster IDs
}

export interface AnalysisResult {
  summary: string;
  overallSentiment: number;
  clusters: Cluster[];
  topPriorities: string[];
  totalItemsProcessed: number;
  productRecommendations?: ProductRecommendation[];
}

export interface Project {
  id: string;
  name: string;
  createdAt: string;
  context?: string; // Product/Company background info
  status: 'draft' | 'analyzing' | 'completed';
  items: FeedbackItem[];
  analysis?: AnalysisResult;
}

export enum AnalysisStatus {
  IDLE = 'IDLE',
  PARSING = 'PARSING',
  ANALYZING = 'ANALYZING',
  COMPLETE = 'COMPLETE',
  ERROR = 'ERROR'
}

// Context Management Types
export interface ICP {
  id: string;
  name: string;
  description: string;
  demographics?: string;
  painPoints?: string;
  goals?: string;
  createdAt: string;
}

export interface ProductInfo {
  id: string;
  name: string;
  description: string;
  features?: string;
  targetMarket?: string;
  valueProposition?: string;
  createdAt: string;
}

export interface MarketFeedback {
  id: string;
  name: string;
  source: string;
  content: string;
  date?: string;
  createdAt: string;
}

export interface ContextData {
  icps: ICP[];
  productInfos: ProductInfo[];
  marketFeedbacks: MarketFeedback[];
}