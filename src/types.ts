import { AiProvider } from './lib/aiClientFactory';

export type ChatRole = 'user' | 'assistant' | 'system';

export type ChatMode = 'hint' | 'guided' | 'full';

export interface ImageAttachment {
  name?: string;
  mimeType: string;
  data: string; // base64 string without data:image/xxx;base64, prefix
  previewUrl: string;
}

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  timestamp: number;
  mode?: ChatMode;
  subject?: string;
  grade?: string;
  modelUsed?: string;
  attachment?: ImageAttachment;
  isError?: boolean;
  errorCode?: string;
  errorDetails?: string;
}

export interface Conversation {
  id: string;
  title: string;
  messages: ChatMessage[];
  subject: string;
  grade: string;
  createdAt: number;
  updatedAt: number;
}

export interface UserSettings {
  provider: AiProvider;
  model: string;
  geminiApiKey: string;
  agentPlatformApiKey: string;
  apiKey: string; // effective active key
  apiKeyList: string[]; // key rotation pool
  defaultSubject: string;
  defaultGrade: string;
  sheetsUrl: string;
  loggingEnabled: boolean;
  theme: 'light' | 'dark' | 'system';
  visitOffset?: number;
}

export interface ModelInfo {
  id: string;
  name: string;
  badge: string;
  description: string;
  supportsMultimodal: boolean;
  supportsThinking?: boolean;
  recommended?: boolean;
  provider?: AiProvider;
}

export type ErrorType =
  | 'EMPTY_INPUT'
  | 'NO_API_KEY'
  | 'INVALID_API_KEY'
  | 'MODEL_OVERLOADED'
  | 'MODEL_NOT_FOUND'
  | 'RATE_LIMIT'
  | 'PERMISSION_DENIED'
  | 'NETWORK_ERROR'
  | 'IMAGE_TOO_LARGE'
  | 'UNSUPPORTED_IMAGE'
  | 'SERVER_ERROR'
  | 'SHEETS_ERROR';

export interface AppError {
  type: ErrorType;
  message: string;
  userHelp: string;
  details?: string;
}
