// Feedback Form Types

export type QuestionType = 
  | 'short-text'
  | 'long-text'
  | 'rating'
  | 'nps'
  | 'scale'
  | 'multiple-choice'
  | 'checkbox'
  | 'email';

export interface FormQuestion {
  id: string;
  type: QuestionType;
  question: string;
  required: boolean;
  placeholder?: string;
  options?: string[]; // For multiple-choice, checkbox
  min?: number; // For rating, scale
  max?: number; // For rating, scale
  order: number;
}

export interface FeedbackForm {
  id: string;
  name: string;
  description?: string;
  questions: FormQuestion[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  shareableLink: string;
  responseCount: number;
  settings: FormSettings;
}

export interface FormSettings {
  allowAnonymous: boolean;
  requireEmail: boolean;
  showBranding: boolean;
  redirectUrl?: string;
  autoImportToAnalysis: boolean;
  theme: 'light' | 'dark';
}

export interface FormResponse {
  id: string;
  formId: string;
  submittedAt: string;
  respondentEmail?: string;
  answers: FormAnswer[];
  imported: boolean;
}

export interface FormAnswer {
  questionId: string;
  value: string | number | string[];
}

export interface FormTemplate {
  id: string;
  name: string;
  description: string;
  category: 'nps' | 'csat' | 'feedback' | 'survey' | 'research';
  questions: Omit<FormQuestion, 'id'>[];
}

export const FORM_TEMPLATES: FormTemplate[] = [
  {
    id: 'nps-basic',
    name: 'Net Promoter Score (NPS)',
    description: 'Measure customer loyalty with the standard NPS question',
    category: 'nps',
    questions: [
      {
        type: 'nps',
        question: 'How likely are you to recommend our product to a friend or colleague?',
        required: true,
        min: 0,
        max: 10,
        order: 1
      },
      {
        type: 'long-text',
        question: 'What is the primary reason for your score?',
        required: false,
        placeholder: 'Tell us more...',
        order: 2
      }
    ]
  },
  {
    id: 'csat-basic',
    name: 'Customer Satisfaction (CSAT)',
    description: 'Quick satisfaction survey',
    category: 'csat',
    questions: [
      {
        type: 'rating',
        question: 'How satisfied are you with our product?',
        required: true,
        min: 1,
        max: 5,
        order: 1
      },
      {
        type: 'long-text',
        question: 'What could we do to improve your experience?',
        required: false,
        placeholder: 'Share your thoughts...',
        order: 2
      }
    ]
  },
  {
    id: 'open-feedback',
    name: 'Open Feedback',
    description: 'Collect detailed qualitative feedback',
    category: 'feedback',
    questions: [
      {
        type: 'long-text',
        question: 'What do you love most about our product?',
        required: true,
        placeholder: 'Tell us what works well...',
        order: 1
      },
      {
        type: 'long-text',
        question: 'What frustrates you or could be improved?',
        required: true,
        placeholder: 'Help us understand your pain points...',
        order: 2
      },
      {
        type: 'long-text',
        question: 'If you could add one feature, what would it be?',
        required: false,
        placeholder: 'Dream feature...',
        order: 3
      }
    ]
  },
  {
    id: 'feature-request',
    name: 'Feature Request',
    description: 'Gather feature ideas from users',
    category: 'feedback',
    questions: [
      {
        type: 'short-text',
        question: 'What feature would you like to see?',
        required: true,
        placeholder: 'Feature name or description',
        order: 1
      },
      {
        type: 'long-text',
        question: 'Why is this feature important to you?',
        required: true,
        placeholder: 'Describe the problem it solves...',
        order: 2
      },
      {
        type: 'scale',
        question: 'How critical is this feature to your workflow?',
        required: true,
        min: 1,
        max: 10,
        order: 3
      }
    ]
  },
  {
    id: 'bug-report',
    name: 'Bug Report',
    description: 'Collect detailed bug reports',
    category: 'feedback',
    questions: [
      {
        type: 'short-text',
        question: 'What went wrong?',
        required: true,
        placeholder: 'Brief description of the issue',
        order: 1
      },
      {
        type: 'long-text',
        question: 'Steps to reproduce',
        required: true,
        placeholder: '1. Go to...\n2. Click on...\n3. See error',
        order: 2
      },
      {
        type: 'long-text',
        question: 'What did you expect to happen?',
        required: false,
        placeholder: 'Expected behavior',
        order: 3
      }
    ]
  }
];
