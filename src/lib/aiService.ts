import { createGoogleAiClient, AiProvider } from './aiClientFactory';
import { getFallbackModels, modelSupportsThinking } from './models';
import { parseApiError } from './errors';
import { rotateApiKey } from './storage';
import { ImageAttachment } from '../types';

export interface ChatMessagePayload {
  role: 'user' | 'assistant' | 'system';
  content: string;
  attachment?: ImageAttachment;
}

export interface StreamChatOptions {
  apiKey: string;
  provider?: AiProvider;
  model: string;
  messages: ChatMessagePayload[];
  systemPrompt?: string;
  signal?: AbortSignal;
  onChunk: (text: string) => void;
  onModelFallback?: (fromModel: string, toModel: string, reason: string) => void;
}

export interface GenerateTextOptions {
  apiKey: string;
  provider?: AiProvider;
  model: string;
  prompt: string;
  systemPrompt?: string;
  attachment?: ImageAttachment;
  responseMimeType?: string;
  onModelFallback?: (fromModel: string, toModel: string, reason: string) => void;
}

/**
 * Tạo danh sách các model dự phòng theo thứ tự ưu tiên
 */
function getOrderedModels(selectedModel: string, provider: AiProvider = 'gemini'): string[] {
  const fallbacks = getFallbackModels(provider);
  const list = [selectedModel, ...fallbacks];
  // Loại bỏ các model trùng lặp
  return Array.from(new Set(list));
}

/**
 * Chuẩn bị cấu hình gọi Gemini API / Agent Platform API
 * Tuân thủ nghiêm ngặt api.md v4.1:
 * - Không gửi temperature/topP/topK cho Gemini 3.x
 * - Chỉ áp thinkingConfig cho model hỗ trợ (supportsThinking = true)
 * - Gemini 3.6 Flash và 3.5 Flash-Lite: temperature/topP/topK đã deprecated
 */
function buildConfig({
  model,
  provider = 'gemini',
  systemPrompt,
  responseMimeType,
}: {
  model: string;
  provider?: AiProvider;
  systemPrompt?: string;
  responseMimeType?: string;
}): Record<string, unknown> {
  const config: Record<string, unknown> = {};

  if (systemPrompt) {
    config.systemInstruction = systemPrompt;
  }

  if (responseMimeType) {
    config.responseMimeType = responseMimeType;
  }

  // Phân biệt model Gemini 3.x (không gửi sampling params) vs 2.5 (có thể gửi)
  // Mọi model gemini-3.x (3.6-flash, 3.5-flash, 3.5-flash-lite, 3.1-flash-lite,
  // gemini-3-flash-preview cũ) đều thuộc nhóm không gửi temperature/topP/topK
  const isGemini3x = model.startsWith('gemini-3');

  if (isGemini3x) {
    // Theo api.md: Không gửi temperature, topP, topK cho Gemini 3.x
    // Chỉ áp thinkingConfig nếu model thực sự hỗ trợ
    if (modelSupportsThinking(model, provider)) {
      config.thinkingConfig = {
        thinkingLevel: 'HIGH',
      };
    }
    // Không thêm temperature/topP/topK
  } else {
    // Model 2.5 và cũ hơn: có thể thiết lập nhiệt độ vừa phải
    config.temperature = 0.4;
  }

  return config;
}

/**
 * Chuyển đổi payload tin nhắn sang định dạng Contents của Google Gen AI SDK
 */
function formatContents(messages: ChatMessagePayload[]) {
  return messages.map((m) => {
    const role = m.role === 'assistant' ? 'model' : 'user';
    const parts: Array<{ text: string } | { inlineData: { data: string; mimeType: string } }> = [];

    // Nếu tin nhắn có ảnh đính kèm (Multimodal)
    if (m.attachment && m.attachment.data && m.attachment.mimeType) {
      // Đảm bảo data không bị trùng tiền tố data:image/xxx;base64,
      const cleanBase64 = m.attachment.data.includes(',')
        ? m.attachment.data.split(',')[1]
        : m.attachment.data;

      parts.push({
        inlineData: {
          data: cleanBase64,
          mimeType: m.attachment.mimeType,
        },
      });
    }

    if (m.content) {
      parts.push({ text: m.content });
    }

    return { role, parts };
  });
}

/**
 * Gọi AI dạng Streaming trực tiếp từ Client với cơ chế Fallback tự động đa tầng
 * Fix BUG 3: Reset accumulatedText trước mỗi lần thử model mới để tránh ghép response
 */
export async function streamChatCompletion({
  apiKey,
  provider = 'gemini',
  model,
  messages,
  systemPrompt,
  signal,
  onChunk,
  onModelFallback,
}: StreamChatOptions): Promise<{ fullText: string; modelUsed: string }> {
  let effectiveKey = apiKey?.trim();
  if (!effectiveKey) {
    throw new Error('Chưa cấu hình API Key. Vui lòng mở Cài đặt để nhập Gemini API Key hoặc Agent Platform Key.');
  }

  const modelsToTry = getOrderedModels(model, provider);
  let lastError: unknown = null;

  for (let i = 0; i < modelsToTry.length; i++) {
    const currentModel = modelsToTry[i];

    if (signal?.aborted) {
      throw new DOMException('Yêu cầu đã bị hủy bởi người dùng.', 'AbortError');
    }

    // BUG 3 FIX: Reset accumulated text trước mỗi lần thử model mới
    // Tránh trường hợp partial text từ model trước bị ghép vào response model sau
    let accumulatedText = '';

    const attemptTimeout = currentModel.includes('lite') ? 6000 : currentModel.includes('3.8') ? 10000 : 8000;
    const attemptController = new AbortController();
    let hasReceivedFirstChunk = false;
    const firstChunkTimer = setTimeout(() => {
      if (!hasReceivedFirstChunk) {
        attemptController.abort(new Error(`Timeout sau ${attemptTimeout}ms khi chờ phản hồi đầu tiên`));
      }
    }, attemptTimeout);

    try {
      const ai = createGoogleAiClient(effectiveKey, provider);
      const contents = formatContents(messages);
      const config = buildConfig({ model: currentModel, provider, systemPrompt });
      (config as any).abortSignal = attemptController.signal;

      const streamResponse = await ai.models.generateContentStream({
        model: currentModel,
        contents,
        config,
      });

      for await (const chunk of streamResponse) {
        hasReceivedFirstChunk = true;
        clearTimeout(firstChunkTimer);
        if (signal?.aborted) {
          throw new DOMException('Yêu cầu đã bị hủy bởi người dùng.', 'AbortError');
        }
        const text = chunk.text;
        if (text) {
          accumulatedText += text;
          onChunk(text);
        }
      }

      clearTimeout(firstChunkTimer);

      // Hoàn thành thành công
      return {
        fullText: accumulatedText,
        modelUsed: currentModel,
      };
    } catch (err: unknown) {
      if ((err as Error).name === 'AbortError') {
        throw err;
      }

      lastError = err;
      const errorParsed = parseApiError(err);

      // Nếu là lỗi Auth/Key Invalid → Dừng ngay, không thử fallback model khác
      if (errorParsed.type === 'INVALID_API_KEY') {
        throw err;
      }

      // Nếu là lỗi Quota 429 → Thử xoay API Key nếu có
      if (errorParsed.type === 'RATE_LIMIT') {
        const rotatedKey = rotateApiKey();
        if (rotatedKey) {
          effectiveKey = rotatedKey;
          // Thử lại ngay với key mới cho model hiện tại
          i--;
          continue;
        }
        // Không có key dự phòng → dừng (không fallback model cho quota)
        throw err;
      }

      // MODEL_OVERLOADED, MODEL_NOT_FOUND, SERVER_ERROR (500) → Fallback model tiếp theo
      if (i < modelsToTry.length - 1) {
        const nextModel = modelsToTry[i + 1];
        if (onModelFallback) {
          onModelFallback(currentModel, nextModel, errorParsed.message);
        }
        console.warn(`[AI Fallback] Model ${currentModel} gặp sự cố (${errorParsed.type}), tự động chuyển sang ${nextModel}...`);
        continue;
      }
    }
  }

  throw lastError || new Error('Tất cả mô hình AI đều không thể phản hồi. Vui lòng thử lại sau.');
}

/**
 * Gọi AI sinh nội dung Non-Streaming (dùng cho tạo đề thi, flashcard, phân tích)
 * Có đầy đủ fallback tự động và thông báo khi chuyển model
 */
export async function generateTextContent({
  apiKey,
  provider = 'gemini',
  model,
  prompt,
  systemPrompt,
  attachment,
  responseMimeType,
  onModelFallback,
}: GenerateTextOptions): Promise<{ text: string; modelUsed: string }> {
  let effectiveKey = apiKey?.trim();
  if (!effectiveKey) {
    throw new Error('Chưa cấu hình API Key.');
  }

  const modelsToTry = getOrderedModels(model, provider);
  let lastError: unknown = null;

  for (let i = 0; i < modelsToTry.length; i++) {
    const currentModel = modelsToTry[i];

    try {
      const ai = createGoogleAiClient(effectiveKey, provider);
      const parts: Array<{ text: string } | { inlineData: { data: string; mimeType: string } }> = [];

      if (attachment && attachment.data && attachment.mimeType) {
        const cleanBase64 = attachment.data.includes(',')
          ? attachment.data.split(',')[1]
          : attachment.data;
        parts.push({
          inlineData: {
            data: cleanBase64,
            mimeType: attachment.mimeType,
          },
        });
      }

      parts.push({ text: prompt });

      const contents = [{ role: 'user', parts }];
      const config = buildConfig({ model: currentModel, provider, systemPrompt, responseMimeType });

      const attemptTimeout = currentModel.includes('lite') ? 6000 : currentModel.includes('3.8') ? 10000 : 8000;
      const attemptController = new AbortController();
      const timer = setTimeout(() => attemptController.abort(new Error(`Timeout sau ${attemptTimeout}ms`)), attemptTimeout);
      (config as any).abortSignal = attemptController.signal;

      let response: any;
      try {
        response = await ai.models.generateContent({
          model: currentModel,
          contents,
          config,
        });
      } finally {
        clearTimeout(timer);
      }

      return {
        text: response.text || '',
        modelUsed: currentModel,
      };
    } catch (err: unknown) {
      lastError = err;
      const errorParsed = parseApiError(err);

      // Lỗi auth → dừng ngay
      if (errorParsed.type === 'INVALID_API_KEY') {
        throw err;
      }

      // Quota → xoay key trước khi fallback model
      if (errorParsed.type === 'RATE_LIMIT') {
        const rotatedKey = rotateApiKey();
        if (rotatedKey) {
          effectiveKey = rotatedKey;
          i--;
          continue;
        }
        throw err;
      }

      // MODEL_OVERLOADED, MODEL_NOT_FOUND, SERVER_ERROR → Fallback
      if (i < modelsToTry.length - 1) {
        const nextModel = modelsToTry[i + 1];
        if (onModelFallback) {
          onModelFallback(currentModel, nextModel, errorParsed.message);
        }
        console.warn(`[AI Fallback - Non-stream] Model ${currentModel} gặp lỗi (${errorParsed.type}), chuyển sang ${nextModel}...`);
        continue;
      }
    }
  }

  throw lastError || new Error('Tất cả mô hình AI đều gặp lỗi.');
}
