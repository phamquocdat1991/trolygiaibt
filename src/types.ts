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

// ==========================================
// CẤU TRÚC DỮ LIỆU BỘ THẺ FLASHCARD & THUẬT TOÁN SM-2
// ==========================================
export interface Flashcard {
  id: string;
  front: string;
  back: string;
  subject: string;
  grade: string;
  createdAt: number;
  // SM-2 Spaced Repetition Parameters
  repetitions: number;
  interval: number; // số ngày đến lần ôn tập tiếp theo
  easeFactor: number; // hệ số dễ nhớ (mặc định 2.5)
  nextReviewDate: number; // timestamp ms
}

// ==========================================
// CẤU TRÚC DỮ LIỆU ĐỀ THI GDPT 2018 (CV 7991)
// ==========================================
export type ExamType = '15min' | '45min' | 'midterm' | 'semester' | 'national_exam';

export interface ExamConfig {
  grade: string;
  subject: string;
  durationMinutes: number;
  topic: string;
  examType: ExamType;
  cognitiveLevel: 'standard' | 'advanced' | 'olympic';
}

export interface QuizOption {
  key: 'A' | 'B' | 'C' | 'D';
  text: string;
}

export interface QuizSubItem {
  key: 'a' | 'b' | 'c' | 'd';
  text: string;
  correctValue: boolean;
}

export interface QuizQuestion {
  id: string;
  number: number;
  section: 'part1' | 'part2' | 'part3' | 'part4';
  title?: string;
  questionText: string;
  options?: QuizOption[];
  correctAnswer?: string;
  subItems?: QuizSubItem[];
  shortAnswerExpected?: string;
  explanation?: string;
}

export interface ParsedExam {
  title: string;
  grade: string;
  subject: string;
  duration: number;
  rawContent: string;
  matrix?: string;
  questions: QuizQuestion[];
}

export interface UserQuizAnswers {
  part1: Record<string, string>; // questionId -> 'A' | 'B' | 'C' | 'D'
  part2: Record<string, Record<string, boolean>>; // questionId -> subKey -> boolean
  part3: Record<string, string>; // questionId -> text
}

export interface QuizResultSummary {
  totalScore: number; // Thang 10
  totalQuestions: number;
  correctCount: number;
  timeSpentSeconds: number;
}
