import { ModelInfo } from '../types';
import { AiProvider } from './aiClientFactory';

// =============================================================
// DANH SÁCH MODEL GEMINI API — Cập nhật theo api.md v4.1
// Chuỗi ổn định production (Stable/GA, không dùng model đã shutdown)
// =============================================================
export const GEMINI_AVAILABLE_MODELS: ModelInfo[] = [
  {
    id: 'gemini-3.6-flash',
    name: 'Gemini 3.6 Flash',
    badge: 'Mặc định & Khuyên dùng',
    description:
      'Model thế hệ mới nhất Stable/GA (21/07/2026). Mạnh nhất ở tác vụ đa bước, tối ưu hiệu năng và chi phí. Khuyên dùng cho tất cả môn học.',
    supportsMultimodal: true,
    supportsThinking: true,
    recommended: true,
    provider: 'gemini',
  },
  {
    id: 'gemini-3.5-flash',
    name: 'Gemini 3.5 Flash',
    badge: 'Chất lượng cao',
    description:
      'Model Flash thế hệ 3.5 Stable/GA — suy luận mạnh, phân tích đề thi và giáo án sư phạm chuẩn mực.',
    supportsMultimodal: true,
    supportsThinking: true,
    recommended: false,
    provider: 'gemini',
  },
  {
    id: 'gemini-3.5-flash-lite',
    name: 'Gemini 3.5 Flash Lite',
    badge: 'Tiết kiệm & Nhanh',
    description:
      'Model Stable/GA chi phí thấp, độ trễ thấp, phản hồi nhanh. Phù hợp câu hỏi đơn giản và trắc nghiệm.',
    supportsMultimodal: true,
    supportsThinking: false,
    recommended: false,
    provider: 'gemini',
  },
  {
    id: 'gemini-3.1-flash-lite',
    name: 'Gemini 3.1 Flash Lite',
    badge: 'Tương thích ngược',
    description:
      'Model Stable, dự kiến ngừng sớm nhất 07/05/2027. Phù hợp khi cần tương thích ngược.',
    supportsMultimodal: true,
    supportsThinking: false,
    recommended: false,
    provider: 'gemini',
  },
  {
    id: 'gemini-2.5-flash',
    name: 'Gemini 2.5 Flash',
    badge: 'Ổn định kinh điển',
    description:
      'Dự phòng cuối chuỗi, ổn định cao, tương thích toàn diện với mọi cấp học và chương trình phổ thông.',
    supportsMultimodal: true,
    supportsThinking: true,
    recommended: false,
    provider: 'gemini',
  },
  {
    id: 'gemini-2.5-pro',
    name: 'Gemini 2.5 Pro',
    badge: 'Nghiên cứu sư phạm',
    description:
      'Suy luận logic mạnh, đọc hiểu tài liệu dài, trích xuất cấu trúc đề thi chuyên sâu. Phù hợp học sinh giỏi.',
    supportsMultimodal: true,
    supportsThinking: true,
    recommended: false,
    provider: 'gemini',
  },
];

// =============================================================
// DANH SÁCH MODEL AGENT PLATFORM API
// =============================================================
export const AGENT_PLATFORM_MODELS: ModelInfo[] = [
  {
    id: 'gemini-2.5-flash',
    name: 'Gemini 2.5 Flash (Agent Platform)',
    badge: 'Mặc định Enterprise',
    description: 'Model mặc định ổn định cao cho Google Cloud Agent Platform API.',
    supportsMultimodal: true,
    supportsThinking: true,
    recommended: true,
    provider: 'agent-platform',
  },
  {
    id: 'gemini-2.5-flash-lite',
    name: 'Gemini 2.5 Flash Lite',
    badge: 'Tốc độ cao',
    description: 'Model chi phí thấp, phản hồi nhanh trên Agent Platform.',
    supportsMultimodal: true,
    supportsThinking: false,
    recommended: false,
    provider: 'agent-platform',
  },
  {
    id: 'gemini-2.5-pro',
    name: 'Gemini 2.5 Pro',
    badge: 'Tư duy nâng cao',
    description: 'Suy luận logic mạnh mẽ và xử lý ngữ cảnh sâu.',
    supportsMultimodal: true,
    supportsThinking: true,
    recommended: false,
    provider: 'agent-platform',
  },
  {
    id: 'gemini-3.1-pro-preview',
    name: 'Gemini 3.1 Pro (Preview)',
    badge: 'Thế hệ 3.x',
    description: 'Lý luận chuyên sâu và giải bài tập nâng cao trên Agent Platform.',
    supportsMultimodal: true,
    supportsThinking: true,
    recommended: false,
    provider: 'agent-platform',
  },
];

// =============================================================
// FALLBACK CHAIN — Thứ tự đúng theo api.md v4.1
// [model người dùng chọn] → 3.6-flash → 3.5-flash → 3.5-flash-lite → 3.1-flash-lite → 2.5-flash
// =============================================================
export const GEMINI_FALLBACK_MODELS = [
  'gemini-3.6-flash',
  'gemini-3.5-flash',
  'gemini-3.5-flash-lite',
  'gemini-3.1-flash-lite',
  'gemini-2.5-flash',
];

export const AGENT_PLATFORM_FALLBACK_MODELS = [
  'gemini-2.5-flash',
  'gemini-2.5-flash-lite',
];

// Model mặc định theo api.md: gemini-3.6-flash (Stable/GA 21/07/2026)
export const DEFAULT_GEMINI_MODEL = 'gemini-3.6-flash';
export const DEFAULT_AGENT_PLATFORM_MODEL = 'gemini-2.5-flash';
export const DEFAULT_MODEL = DEFAULT_GEMINI_MODEL;

export function getAvailableModels(provider: AiProvider = 'gemini'): ModelInfo[] {
  return provider === 'agent-platform' ? AGENT_PLATFORM_MODELS : GEMINI_AVAILABLE_MODELS;
}

export function getDefaultModelForProvider(provider: AiProvider = 'gemini'): string {
  return provider === 'agent-platform' ? DEFAULT_AGENT_PLATFORM_MODEL : DEFAULT_GEMINI_MODEL;
}

export function getFallbackModels(provider: AiProvider = 'gemini'): string[] {
  return provider === 'agent-platform' ? AGENT_PLATFORM_FALLBACK_MODELS : GEMINI_FALLBACK_MODELS;
}

export function getModelConfig(modelId?: string, provider: AiProvider = 'gemini'): ModelInfo {
  const models = getAvailableModels(provider);
  const found = models.find((m) => m.id === modelId);
  if (found) return found;

  return {
    id: modelId || getDefaultModelForProvider(provider),
    name: modelId || 'Gemini Model',
    badge: 'Tùy biến',
    description: 'Mô hình tùy chọn do người dùng chỉ định.',
    supportsMultimodal: true,
    supportsThinking: true,
    provider,
  };
}

/**
 * Kiểm tra model có hỗ trợ thinkingConfig không
 * Chỉ áp thinkingConfig cho model có supportsThinking = true
 */
export function modelSupportsThinking(modelId: string, provider: AiProvider = 'gemini'): boolean {
  const allModels = [...GEMINI_AVAILABLE_MODELS, ...AGENT_PLATFORM_MODELS];
  const found = allModels.find((m) => m.id === modelId);
  if (found) return found.supportsThinking ?? false;

  // Nếu không tìm thấy trong danh sách: dùng heuristic
  // gemini-3.x với 'flash-lite' hoặc '3.1-flash-lite' không hỗ trợ thinking
  if (modelId.includes('flash-lite')) return false;
  if (modelId.includes('gemini-3.1-flash-lite')) return false;
  // Mặc định: model gemini-3.x (không lite) hỗ trợ thinking
  if (modelId.includes('gemini-3') || modelId.includes('gemini-2.5-flash') || modelId.includes('gemini-2.5-pro')) return true;
  return false;
}
