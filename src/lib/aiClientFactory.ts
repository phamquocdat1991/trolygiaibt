import { GoogleGenAI } from '@google/genai';

export type AiProvider = 'gemini' | 'agent-platform';

export const GOOGLE_AI_API_KEY_PATTERN = /^(?:AIzaSy|AQ)\S{8,}$/;

export const isValidGoogleAiApiKey = (key: string): boolean => {
  if (!key) return false;
  return GOOGLE_AI_API_KEY_PATTERN.test(key.trim());
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
