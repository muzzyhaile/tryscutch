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
  isEmerging: boolean;
  keyInsights: string[];
}

export interface AnalysisResult {
  summary: string;
  overallSentiment: number;
  clusters: Cluster[];
  topPriorities: string[];
  totalItemsProcessed: number;
}

export interface Project {
  id: string;
  name: string;
  createdAt: string;
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