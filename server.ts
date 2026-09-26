import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

// Body parsers (support larger payloads for base64 image uploads up to 10MB)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    appName: 'ANH GIÁO AI',
    developer: 'Anh Giáo PHẠM QUỐC ĐẠT',
  });
});

// Test API Key endpoint
app.post('/api/test-key', async (req: Request, res: Response) => {
  try {
    const { apiKey, model } = req.body;
    const effectiveKey = apiKey?.trim() || process.env.GEMINI_API_KEY;

    if (!effectiveKey) {
      return res.status(400).json({
        success: false,
        error: 'Chưa có API Key. Vui lòng nhập Gemini API Key trong Cài đặt hoặc cấu hình GEMINI_API_KEY trên máy chủ.',
      });
    }

    const ai = new GoogleGenAI({
      apiKey: effectiveKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    const modelToUse = model || process.env.DEFAULT_GEMINI_MODEL || 'gemini-3.8-flash';

    const response = await ai.models.generateContent({
      model: modelToUse,
      contents: 'Kiểm tra kết nối hệ thống. Trả lời: OK',
    });

    if (response && response.text) {
      return res.json({
        success: true,
        message: `Kết nối thành công đến mô hình ${modelToUse}!`,
      });
    }

    return res.json({
      success: true,
      message: 'Kết nối thành công!',
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error('[API Test Key Error]:', errorMsg);
    return res.status(500).json({
      success: false,
      error: errorMsg,
    });
  }
});

// Chat completion endpoint (standard fallback)
app.post('/api/chat', async (req: Request, res: Response) => {
  try {
    const { messages, systemPrompt, model, apiKey } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Nội dung tin nhắn không được để trống.',
        type: 'EMPTY_INPUT',
      });
    }

    // Determine API Key (BYOK from user request body OR server env)
    const effectiveKey = apiKey?.trim() || process.env.GEMINI_API_KEY;

    if (!effectiveKey) {
      return res.status(400).json({
        success: false,
        error: 'Chưa cấu hình Gemini API Key. Vui lòng mở Cài đặt để nhập khóa của em hoặc liên hệ quản trị viên.',
        type: 'NO_API_KEY',
      });
    }

    const ai = new GoogleGenAI({
      apiKey: effectiveKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    const selectedModel = model || process.env.DEFAULT_GEMINI_MODEL || 'gemini-3.8-flash';

    // Format conversation history for Gemini API contents
    const contents = messages.map((m: { role: string; content: string; attachment?: { data: string; mimeType: string } }) => {
      const role = m.role === 'assistant' ? 'model' : 'user';
      const parts: Array<{ text: string } | { inlineData: { data: string; mimeType: string } }> = [];

      // If user message has image attachment, add it as inlineData
      if (m.attachment && m.attachment.data && m.attachment.mimeType) {
        parts.push({
          inlineData: {
            data: m.attachment.data,
            mimeType: m.attachment.mimeType,
          },
        });
      }

      if (m.content) {
        parts.push({ text: m.content });
      }

      return { role, parts };
    });

    const config: Record<string, unknown> = {};
    if (!selectedModel.startsWith('gemini-3')) {
      config.temperature = 0.4;
    }
    if (systemPrompt) {
      config.systemInstruction = systemPrompt;
    }

    let response;
    try {
      response = await ai.models.generateContent({
        model: selectedModel,
        contents,
        config,
      });
    } catch (primaryErr: unknown) {
      const errMsg = primaryErr instanceof Error ? primaryErr.message : String(primaryErr);
      console.warn(`[Model ${selectedModel} failed]:`, errMsg);

      // Fallback chain theo chuẩn api.md
      const fallbacks = ['gemini-3.8-flash', 'gemini-3.7-flash', 'gemini-3.6-flash', 'gemini-2.5-flash'];
      const nextFallback = fallbacks.find((m) => m !== selectedModel) || 'gemini-3.7-flash';
      console.log(`[Fallback] Trying ${nextFallback} as fallback...`);
      response = await ai.models.generateContent({
        model: nextFallback,
        contents,
        config,
      });
    }

    const textOutput = response?.text || 'Anh Giáo chưa nhận được câu trả lời từ hệ thống. Em vui lòng thử lại nhé!';

    return res.json({
      success: true,
      text: textOutput,
      modelUsed: selectedModel,
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error('[API Chat Server Error]:', errorMsg);

    let errorType = 'SERVER_ERROR';
    const lower = errorMsg.toLowerCase();

    if (lower.includes('api_key') || lower.includes('401') || lower.includes('unauthenticated')) {
      errorType = 'INVALID_API_KEY';
    } else if (lower.includes('not found') || lower.includes('404')) {
      errorType = 'MODEL_NOT_FOUND';
    } else if (lower.includes('quota') || lower.includes('429') || lower.includes('resource_exhausted')) {
      errorType = 'RATE_LIMIT';
    }

    return res.status(500).json({
      success: false,
      error: errorMsg,
      type: errorType,
    });
  }
});

// Streaming chat completion endpoint (Server-Sent Events for lowest latency & smooth typing)
app.post('/api/chat-stream', async (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');

  let isAborted = false;
  req.on('close', () => {
    isAborted = true;
  });

  try {
    const { messages, systemPrompt, model, apiKey } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      res.write(`data: ${JSON.stringify({ error: 'Nội dung tin nhắn không được để trống.', type: 'EMPTY_INPUT', done: true })}\n\n`);
      return res.end();
    }

    const effectiveKey = apiKey?.trim() || process.env.GEMINI_API_KEY;
    if (!effectiveKey) {
      res.write(`data: ${JSON.stringify({ error: 'Chưa cấu hình Gemini API Key. Vui lòng mở Cài đặt để nhập khóa của em hoặc liên hệ quản trị viên.', type: 'NO_API_KEY', done: true })}\n\n`);
      return res.end();
    }

    const ai = new GoogleGenAI({
      apiKey: effectiveKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    const selectedModel = model || process.env.DEFAULT_GEMINI_MODEL || 'gemini-3.8-flash';

    const contents = messages.map((m: { role: string; content: string; attachment?: { data: string; mimeType: string } }) => {
      const role = m.role === 'assistant' ? 'model' : 'user';
      const parts: Array<{ text: string } | { inlineData: { data: string; mimeType: string } }> = [];

      if (m.attachment && m.attachment.data && m.attachment.mimeType) {
        parts.push({
          inlineData: {
            data: m.attachment.data,
            mimeType: m.attachment.mimeType,
          },
        });
      }

      if (m.content) {
        parts.push({ text: m.content });
      }

      return { role, parts };
    });

    const config: Record<string, unknown> = {};
    if (!selectedModel.startsWith('gemini-3')) {
      config.temperature = 0.4;
    }
    if (systemPrompt) {
      config.systemInstruction = systemPrompt;
    }

    let streamResponse;
    try {
      streamResponse = await ai.models.generateContentStream({
        model: selectedModel,
        contents,
        config,
      });
    } catch (primaryErr: unknown) {
      const fallbacks = ['gemini-3.8-flash', 'gemini-3.7-flash', 'gemini-3.6-flash', 'gemini-2.5-flash'];
      const nextFallback = fallbacks.find((m) => m !== selectedModel) || 'gemini-3.7-flash';
      console.warn(`[Stream Model ${selectedModel} failed, trying fallback ${nextFallback}]:`, primaryErr);
      streamResponse = await ai.models.generateContentStream({
        model: nextFallback,
        contents,
        config,
      });
    }

    for await (const chunk of streamResponse) {
      if (isAborted) break;
      const textChunk = chunk.text;
      if (textChunk) {
        res.write(`data: ${JSON.stringify({ text: textChunk })}\n\n`);
      }
    }

    if (!isAborted) {
      res.write(`data: ${JSON.stringify({ done: true, modelUsed: selectedModel })}\n\n`);
    }
    res.end();
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error('[API Chat Stream Server Error]:', errorMsg);

    let errorType = 'SERVER_ERROR';
    const lower = errorMsg.toLowerCase();
    if (lower.includes('api_key') || lower.includes('401') || lower.includes('unauthenticated')) {
      errorType = 'INVALID_API_KEY';
    } else if (lower.includes('not found') || lower.includes('404')) {
      errorType = 'MODEL_NOT_FOUND';
    } else if (lower.includes('quota') || lower.includes('429') || lower.includes('resource_exhausted')) {
      errorType = 'RATE_LIMIT';
    }

    res.write(`data: ${JSON.stringify({ error: errorMsg, type: errorType, done: true })}\n\n`);
    res.end();
  }
});

// Vite middleware in dev / Static files in production
async function startApp() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`ANH GIÁO AI server running on http://0.0.0.0:${PORT}`);
  });
}

startApp();
