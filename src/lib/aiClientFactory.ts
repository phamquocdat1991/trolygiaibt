import { GoogleGenAI } from '@google/genai';

export type AiProvider = 'gemini' | 'agent-platform';

/**
 * Chuẩn hóa và kiểm tra chất lượng key theo chuẩn api.md v5.0
 * Xử lý key như chuỗi bí mật opaque; không lọc bằng tiền tố cố định AIzaSy/AQ
 */
export function normalizeOpaqueKey(raw: string): string {
  const key = raw?.trim() || '';
  if (!key) throw new Error('KEY_EMPTY');
  if (/\s|[\u0000-\u001F\u007F]/u.test(key)) throw new Error('KEY_WHITESPACE_OR_CONTROL');
  if (key.length < 8) throw new Error('KEY_TOO_SHORT');
  if (key.length > 4096) throw new Error('KEY_TOO_LONG');
  return key;
}

export const isValidGoogleAiApiKey = (key: string): boolean => {
  if (!key) return false;
  try {
    normalizeOpaqueKey(key);
    return true;
  } catch {
    return false;
  }
};

/**
 * Client factory duy nhất khởi tạo GoogleGenAI SDK cho cả Gemini API và Agent Platform API
 * theo đúng quy chuẩn api.md
 */
export const createGoogleAiClient = (
  apiKey: string,
  provider: AiProvider = 'gemini'
): GoogleGenAI => {
  const cleanKey = apiKey.trim();
  if (provider === 'agent-platform') {
    // Cờ kỹ thuật bắt buộc của Google Gen AI SDK để định tuyến tới aiplatform.googleapis.com
    return new GoogleGenAI({
      vertexai: true,
      apiKey: cleanKey,
      httpOptions: {
        headers: {
          'User-Agent': 'anhgiaoai-edu-build',
        },
      },
    });
  }

  return new GoogleGenAI({
    apiKey: cleanKey,
    httpOptions: {
      headers: {
        'User-Agent': 'anhgiaoai-edu-build',
      },
    },
  });
};
