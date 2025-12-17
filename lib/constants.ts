/**
 * Application Constants
 * Centralized constants following DRY principle
 */

/**
 * View States - Using const object instead of string literals
 * Provides type safety and prevents typos
 */
export const VIEW_STATES = {
  LANDING: 'landing',
  LIST: 'list',
  NEW: 'new',
  ANALYSIS: 'analysis',
  SETTINGS: 'settings',
  BILLING: 'billing',
  CONTEXT: 'context',
  FORMS: 'forms',
  FEEDBACK: 'feedback',
  RESPONSES: 'responses',
  PRIVACY: 'privacy',
  TERMS: 'terms',
  IMPRESSUM: 'impressum',
} as const;

export type ViewState = typeof VIEW_STATES[keyof typeof VIEW_STATES];

/**
 * Project Status Constants
 */
export const PROJECT_STATUS = {
  DRAFT: 'draft',
  ANALYZING: 'analyzing',
  COMPLETED: 'completed',
} as const;

export type ProjectStatus = typeof PROJECT_STATUS[keyof typeof PROJECT_STATUS];

/**
 * Routes
 */
export const ROUTES = {
  FORM: '/f/:formId',
  HOME: '/',
  PRIVACY: '/privacy',
  TERMS: '/terms',
  IMPRESSUM: '/impressum',
} as const;

/**
 * Error Messages
 */
export const ERROR_MESSAGES = {
  PROJECT_NAME_REQUIRED: 'Please give your project a name.',
  PROJECT_LIMIT_REACHED: (planName: string, limit: number) =>
    `You have reached the ${planName} project limit (${limit.toLocaleString()}). Upgrade your plan to create more projects.`,
  ITEMS_LIMIT_EXCEEDED: (limit: number, actual: number) =>
    `This plan allows up to ${limit.toLocaleString()} feedback items per analysis. You tried ${actual.toLocaleString()}. Split the file or upgrade your plan.`,
  ANALYSIS_TOO_LARGE: 'This analysis is too large for your plan. Reduce the amount of text or upgrade your plan.',
  ANALYSIS_FAILED: 'Analysis failed. Please try again later or check your API key.',
  AUTH_FAILED: 'Authentication failed.',
  SIGN_OUT_FAILED: 'Failed to sign out.',
  IMPORT_FAILED: 'Failed to import file.',
  TRANSLATION_FAILED: 'Translation failed. Please try again.',
  RESEARCH_GENERATION_FAILED: 'Failed to generate research. Please check your API key and try again.',
  PDF_EXPORT_FAILED: 'Could not generate PDF. Please try again.',
  CHECKOUT_FAILED: 'Failed to start checkout',
  BILLING_PORTAL_FAILED: 'Failed to open billing portal',
  NO_ROWS_IMPORTED: 'No rows could be imported from that file. If this is a CSV/XLSX table, make sure it has a column with the feedback text.',
  SINGLE_FILE_ONLY: 'Please upload one file at a time.',
} as const;

/**
 * Success Messages
 */
export const SUCCESS_MESSAGES = {
  PROJECT_CREATED: 'Project created successfully',
  PROJECT_DELETED: 'Project deleted successfully',
  FORM_CREATED: 'Form created successfully',
  FORM_DELETED: 'Form deleted successfully',
  RESPONSE_DELETED: 'Response deleted successfully',
  SETTINGS_SAVED: 'Settings saved successfully',
} as const;

/**
 * Confirmation Messages
 */
export const CONFIRM_MESSAGES = {
  DELETE_PROJECT: 'Are you sure you want to delete this project?',
  DELETE_FORM: 'Delete this form? All responses will be kept but the form will no longer accept submissions.',
  DELETE_RESPONSE: 'Delete this response?',
  DELETE_FEEDBACK_ENTRY: 'Delete this entry?',
  DELETE_ICP: 'Delete this ICP?',
  DELETE_PRODUCT_INFO: 'Delete this product info?',
  DELETE_MARKET_FEEDBACK: 'Delete this market feedback?',
  DELETE_PRODUCT_PRINCIPLE: 'Delete this product principle?',
  REMOVE_IMPORTED_DATASET: 'Remove the imported dataset from this entry?',
} as const;
