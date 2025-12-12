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

// Feedback Library Types
export type FeedbackSourceType = 'interview' | 'social' | 'support' | 'note';

export interface FeedbackBulkImport {
  sourceFileName: string;
  importedAt: string;
  kind: 'text' | 'table';
  rowCount: number;
  /** Extracted feedback items (1 per row/line) */
  items: string[];
  /** Optional hint for how items were extracted */
  selectedTextColumn?: string;
  detectedTextColumn?: string | null;
}

export interface FeedbackEntry {
  id: string;
  title: string;
  sourceType: FeedbackSourceType;
  app?: string;
  source?: string; // e.g. "Zoom", "Reddit", "Zendesk"
  url?: string;
  date?: string; // ISO or yyyy-mm-dd
  content: string; // transcript / raw feedback
  entryContext?: string; // per-entry context/instructions
  /** Optional grouping label to reference this entry/dataset as a single topic */
  topic?: string;
  /** Optional tags for quick reference/search (UI use) */
  tags?: string[];
  /** Optional bulk-imported dataset attached to this entry */
  bulkImport?: FeedbackBulkImport;
  createdAt: string;
}

export interface ProductPrinciple {
  id: string;
  title: string;
  description: string;
  category: 'design' | 'technical' | 'business' | 'user-experience' | 'other';
  priority: 'high' | 'medium' | 'low';
  createdAt: string;
}

// Pre-defined Product Principles Templates
export const DEFAULT_PRODUCT_PRINCIPLES: Omit<ProductPrinciple, 'id' | 'createdAt'>[] = [
  {
    title: 'User-Centric Design',
    description: 'Always prioritize user needs and pain points in every decision',
    category: 'user-experience',
    priority: 'high'
  },
  {
    title: 'Simplicity First',
    description: 'Keep interfaces clean and intuitive - reduce cognitive load',
    category: 'design',
    priority: 'high'
  },
  {
    title: 'Data-Driven Decisions',
    description: 'Base product decisions on user data and metrics, not assumptions',
    category: 'business',
    priority: 'high'
  },
  {
    title: 'Fast Iteration',
    description: 'Ship quickly, learn from users, and iterate based on feedback',
    category: 'business',
    priority: 'medium'
  },
  {
    title: 'Performance Matters',
    description: 'Optimize for speed and responsiveness - users notice delays',
    category: 'technical',
    priority: 'high'
  },
  {
    title: 'Accessibility by Default',
    description: 'Build inclusive products that work for everyone',
    category: 'user-experience',
    priority: 'high'
  },
  {
    title: 'Mobile-First Approach',
    description: 'Design for mobile devices first, then scale up',
    category: 'design',
    priority: 'medium'
  },
  {
    title: 'Security & Privacy',
    description: 'Protect user data and maintain trust through strong security practices',
    category: 'technical',
    priority: 'high'
  },
  {
    title: 'Clear Value Proposition',
    description: 'Users should immediately understand what problem you solve',
    category: 'business',
    priority: 'high'
  },
  {
    title: 'Consistent Experience',
    description: 'Maintain design consistency across all touchpoints',
    category: 'design',
    priority: 'medium'
  },
  {
    title: 'Reduce Friction',
    description: 'Remove unnecessary steps and barriers to user success',
    category: 'user-experience',
    priority: 'high'
  },
  {
    title: 'Scalable Architecture',
    description: 'Build systems that can grow with your user base',
    category: 'technical',
    priority: 'medium'
  }
];

export interface ContextData {
  icps: ICP[];
  productInfos: ProductInfo[];
  marketFeedbacks: MarketFeedback[];
  productPrinciples: ProductPrinciple[];
}