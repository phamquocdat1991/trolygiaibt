import React, { useRef, useEffect, useState } from 'react';
import {
  Send,
  Paperclip,
  X,
  Square,
  Lightbulb,
  BookOpen,
  CheckCircle2,
  Mic,
  MicOff,
} from 'lucide-react';
import { ChatMode, ImageAttachment } from '../types';

interface ComposerProps {
  onSendMessage: (text: string, attachment?: ImageAttachment, mode?: ChatMode) => void;
  isGenerating: boolean;
  onStopGeneration: () => void;
  currentMode: ChatMode;
  onModeChange: (mode: ChatMode) => void;
  onToast: (msg: string) => void;
}

// Declare SpeechRecognition interfaces for TypeScript
interface IWindow extends Window {
  webkitSpeechRecognition?: any;
  SpeechRecognition?: any;
}

export const Composer: React.FC<ComposerProps> = ({
  onSendMessage,
  isGenerating,
  onStopGeneration,
  currentMode,
  onModeChange,
  onToast,
}) => {
  const [inputText, setInputText] = useState('');
  const [attachment, setAttachment] = useState<ImageAttachment | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  // Auto resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${Math.min(Math.max(scrollHeight, 44), 160)}px`;
    }
  }, [inputText]);

  // Voice Input Speech Recognition setup
  const handleToggleVoiceInput = () => {
    const win = window as unknown as IWindow;
    const SpeechRecognitionClass = win.SpeechRecognition || win.webkitSpeechRecognition;

    if (!SpeechRecognitionClass) {
      onToast('Trình duyệt của bạn chưa hỗ trợ nhận diện giọng nói (khuyên dùng Google Chrome / Edge).');
      return;
    }

    if (isRecording) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsRecording(false);
      return;
    }

    try {
      const recognition = new SpeechRecognitionClass();
      recognition.lang = 'vi-VN';
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => {
        setIsRecording(true);
        onToast('🎙️ Đang nghe em nói bằng tiếng Việt...');
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setInputText((prev) => (prev ? `${prev} ${transcript}` : transcript));
          onToast('Đã nhận diện giọng nói!');
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('Voice error:', event.error);
        setIsRecording(false);
        if (event.error === 'not-allowed') {
          onToast('Vui lòng cấp quyền Microphone cho trình duyệt để nói nhé.');
        } else {
          onToast('Không thể thu âm giọng nói. Em hãy thử lại nhé.');
        }
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error('Failed to start speech recognition:', err);
      setIsRecording(false);
    }
  };

  // Optimize and compress image using HTML Canvas before upload
  const compressImage = (file: File): Promise<{ dataUrl: string; base64: string; mimeType: string }> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const rawDataUrl = e.target?.result as string;
        const img = new Image();
        img.onload = () => {
          const maxDimension = 1600; // Optimal for OCR & Math reading without payload bloat
          let { width, height } = img;

          if (width > maxDimension || height > maxDimension) {
            if (width > height) {
              height = Math.round((height * maxDimension) / width);
              width = maxDimension;
            } else {
              width = Math.round((width * maxDimension) / height);
              height = maxDimension;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            const rawBase64 = rawDataUrl.split(',')[1];
            return resolve({ dataUrl: rawDataUrl, base64: rawBase64, mimeType: file.type || 'image/jpeg' });
          }

          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, width, height);
          ctx.drawImage(img, 0, 0, width, height);

          const outputMime = file.type === 'image/png' && file.size < 500 * 1024 ? 'image/png' : 'image/jpeg';
          const compressedDataUrl = canvas.toDataURL(outputMime, 0.85);
          const compressedBase64 = compressedDataUrl.split(',')[1];

          resolve({
            dataUrl: compressedDataUrl,
            base64: compressedBase64,
            mimeType: outputMime,
          });
        };
        img.onerror = () => {
          const rawBase64 = rawDataUrl.split(',')[1];
          resolve({ dataUrl: rawDataUrl, base64: rawBase64, mimeType: file.type });
        };
        img.src = rawDataUrl;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const processImageFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      onToast('Chỉ hỗ trợ tệp hình ảnh (JPG, PNG, WEBP, GIF).');
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      onToast('Dung lượng ảnh quá lớn (>15MB). Vui lòng chọn ảnh bài tập rõ nét nhỏ hơn.');
      return;
    }

    try {
      const optimized = await compressImage(file);
      setAttachment({
        name: file.name,
        mimeType: optimized.mimeType,
        data: optimized.base64,
        previewUrl: optimized.dataUrl,
      });
      onToast('Đã đính kèm & tối ưu ảnh bài tập!');
    } catch {
      onToast('Không thể xử lý ảnh này. Em hãy thử chọn lại nhé.');
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          processImageFile(file);
          e.preventDefault();
          break;
        }
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processImageFile(e.dataTransfer.files[0]);
    }
  };

  const handleSend = () => {
    const trimmed = inputText.trim();
    if (!trimmed && !attachment) {
      onToast('Em hãy nhập câu hỏi hoặc đính kèm ảnh bài tập nhé.');
      return;
    }

    if (isGenerating) return;

    onSendMessage(trimmed, attachment || undefined, currentMode);
    setInputText('');
    setAttachment(null);

    if (textareaRef.current) {
      textareaRef.current.style.height = '44px';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="no-print relative border-t border-slate-200/80 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-3 sm:px-4 pt-2 pb-3 sm:pb-4 pb-safe transition-colors">
      <div className="max-w-4xl mx-auto flex flex-col gap-2">
        {/* Quick Mode Switcher */}
        <div className="flex items-center justify-between gap-1 sm:gap-2 overflow-x-auto pb-0.5 scrollbar-none text-xs">
          <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-100/90 dark:bg-slate-800/80 border border-slate-200/70 dark:border-slate-700/60">
            <button
              id="mode-btn-hint"
              type="button"
              onClick={() => onModeChange('hint')}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl font-medium transition-all duration-150 cursor-pointer whitespace-nowrap active:scale-95 motion-reduce:transform-none ${
                currentMode === 'hint'
                  ? 'bg-white dark:bg-slate-700 text-amber-800 dark:text-amber-300 shadow-xs ring-1 ring-amber-500/30 font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
              title="Gợi mở manh mối, không đưa đáp án ngay"
            >
              <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
              <span>💡 Gợi ý nhẹ</span>
            </button>

            <button
              id="mode-btn-guided"
              type="button"
              onClick={() => onModeChange('guided')}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl font-medium transition-all duration-150 cursor-pointer whitespace-nowrap active:scale-95 motion-reduce:transform-none ${
                currentMode === 'guided'
                  ? 'bg-white dark:bg-slate-700 text-teal-800 dark:text-teal-300 shadow-xs ring-1 ring-teal-500/30 font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
              title="Chia bước làm, giải thích lý do từng bước"
            >
              <BookOpen className="w-3.5 h-3.5 text-teal-600" />
              <span>📖 Hướng dẫn từng bước</span>
            </button>

            <button
              id="mode-btn-full"
              type="button"
              onClick={() => onModeChange('full')}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl font-medium transition-all duration-150 cursor-pointer whitespace-nowrap active:scale-95 motion-reduce:transform-none ${
                currentMode === 'full'
                  ? 'bg-white dark:bg-slate-700 text-emerald-800 dark:text-emerald-300 shadow-xs ring-1 ring-emerald-500/30 font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
              title="Lời giải hoàn chỉnh, phương pháp và bẫy đề thi"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              <span>✅ Giải / Phân tích</span>
            </button>
          </div>

          <span className="hidden md:inline-flex text-[11px] text-slate-500 dark:text-slate-400 shrink-0">
            Nhấn <kbd className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-[10px] font-mono">Enter</kbd> gửi, <kbd className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-[10px] font-mono">Shift+Enter</kbd> xuống dòng
          </span>
        </div>

        {/* Attachment Preview Box */}
        {attachment && (
          <div className="flex items-center gap-3 p-2 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/80 w-fit max-w-full animate-in fade-in">
            <div className="relative w-12 h-12 rounded-xl overflow-hidden shrink-0 border border-emerald-300/80 dark:border-emerald-700">
              <img
                src={attachment.previewUrl}
                alt="Đính kèm"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="flex flex-col min-w-0 pr-2">
              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[200px] sm:max-w-[300px]">
                {attachment.name || 'Ảnh bài tập'}
              </span>
              <span className="text-[11px] text-emerald-700 dark:text-emerald-300 font-medium">
                Sẵn sàng gửi kèm câu hỏi
              </span>
            </div>
            <button
              id="btn-remove-attachment"
              type="button"
              onClick={() => setAttachment(null)}
              className="min-w-[32px] min-h-[32px] flex items-center justify-center rounded-full text-slate-500 hover:text-red-500 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
              title="Xóa ảnh này"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Input Box Container with Drag and Drop */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`relative flex items-end gap-1.5 sm:gap-2 p-2 rounded-3xl border transition-all duration-200 ${
            isDragging
              ? 'border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/30 ring-2 ring-emerald-500/20'
              : 'border-slate-300/80 dark:border-slate-700/80 bg-white dark:bg-slate-800/70 shadow-xs focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/20'
          }`}
        >
          {/* Hidden File Input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                processImageFile(e.target.files[0]);
              }
              e.target.value = '';
            }}
            className="hidden"
            id="image-file-input"
          />

          {/* Attach Image Button */}
          <button
            id="btn-attach-image"
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="min-w-[40px] min-h-[40px] sm:min-w-[44px] sm:min-h-[44px] flex items-center justify-center rounded-2xl text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all shrink-0 cursor-pointer active:scale-95 motion-reduce:transform-none"
            title="Đính kèm ảnh bài tập (JPG, PNG, WEBP, GIF)"
            aria-label="Attach image"
          >
            <Paperclip className="w-5 h-5" />
          </button>

          {/* Voice Input Mic Button */}
          <button
            id="btn-voice-input"
            type="button"
            onClick={handleToggleVoiceInput}
            className={`min-w-[40px] min-h-[40px] sm:min-w-[44px] sm:min-h-[44px] flex items-center justify-center rounded-2xl transition-all shrink-0 cursor-pointer active:scale-95 motion-reduce:transform-none ${
              isRecording
                ? 'bg-rose-500 text-white animate-pulse'
                : 'text-slate-500 dark:text-slate-400 hover:text-teal-600 dark:hover:text-teal-400 hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
            title={isRecording ? 'Đang nghe... Bấm để dừng' : 'Đọc câu hỏi bằng giọng nói tiếng Việt'}
            aria-label="Voice input"
          >
            {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          {/* Auto-growing Textarea - min 16px on mobile to avoid Safari zoom */}
          <textarea
            ref={textareaRef}
            id="chat-input-textarea"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            rows={1}
            placeholder={
              attachment
                ? 'Nhập câu hỏi hoặc yêu cầu cho ảnh đính kèm...'
                : 'Hỏi bài tập Toán, Văn, Anh, Lý, Hóa, Sinh, Sử, Địa, Tin...'
            }
            className="flex-1 max-h-40 py-2 px-1 bg-transparent text-[16px] sm:text-[15px] text-slate-900 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-400 resize-none focus:outline-hidden leading-snug"
          />

          {/* Send / Stop Button */}
          {isGenerating ? (
            <button
              id="btn-stop-generation"
              type="button"
              onClick={onStopGeneration}
              className="min-w-[40px] min-h-[40px] sm:min-w-[44px] sm:min-h-[44px] flex items-center justify-center rounded-2xl bg-amber-500 hover:bg-amber-600 text-white shadow-xs transition-all shrink-0 cursor-pointer active:scale-95 motion-reduce:transform-none"
              title="Dừng tạo câu trả lời"
              aria-label="Stop generating"
            >
              <Square className="w-4 h-4 fill-current animate-pulse" />
            </button>
          ) : (
            <button
              id="btn-send-message"
              type="button"
              onClick={handleSend}
              disabled={!inputText.trim() && !attachment}
              className={`min-w-[40px] min-h-[40px] sm:min-w-[44px] sm:min-h-[44px] flex items-center justify-center rounded-2xl transition-all duration-150 shrink-0 cursor-pointer ${
                inputText.trim() || attachment
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs shadow-emerald-600/30 active:scale-95 motion-reduce:transform-none'
                  : 'bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500 cursor-not-allowed'
              }`}
              title="Gửi câu hỏi cho Anh Giáo AI"
              aria-label="Send message"
            >
              <Send className="w-4.5 h-4.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
