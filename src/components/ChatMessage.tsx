import React, { useState } from 'react';
import {
  Copy,
  Check,
  RotateCcw,
  Sparkles,
  User,
  Volume2,
  VolumeX,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Image as ImageIcon,
} from 'lucide-react';
import { ChatMessage as ChatMessageType, ChatMode } from '../types';
import { MarkdownRenderer } from './MarkdownRenderer';
import { SUBJECT_OPTIONS } from '../lib/prompts';

interface ChatMessageProps {
  message: ChatMessageType;
  onRetry?: () => void;
  onToast: (msg: string) => void;
  onPreviewImage?: (url: string) => void;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({
  message,
  onRetry,
  onToast,
  onPreviewImage,
}) => {
  const [copied, setCopied] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showErrorDetails, setShowErrorDetails] = useState(false);

  const isAssistant = message.role === 'assistant';

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    onToast('Đã sao chép nội dung câu trả lời!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSpeak = () => {
    if (!('speechSynthesis' in window)) {
      onToast('Trình duyệt của em không hỗ trợ đọc văn bản.');
      return;
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    window.speechSynthesis.cancel();

    // Làm sạch ký hiệu markdown cho giọng đọc tự nhiên
    const plainText = message.content
      .replace(/```[\s\S]*?```/g, 'Đoạn mã lập trình.')
      .replace(/\$\$[\s\S]*?\$\$/g, 'Công thức toán học.')
      .replace(/\$[^\$]+\$/g, 'Biểu thức.')
      .replace(/[#*`_~]/g, '');

    const utterance = new SpeechSynthesisUtterance(plainText);
    utterance.lang = 'vi-VN';
    utterance.rate = 1.0;

    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  const formatTime = (ts: number) => {
    return new Date(ts).toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getModeBadge = (mode?: ChatMode) => {
    if (!mode) return null;
    if (mode === 'hint') {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800">
          💡 Gợi ý nhẹ
        </span>
      );
    }
    if (mode === 'guided') {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-sky-50 dark:bg-sky-950/50 text-sky-800 dark:text-sky-300 border border-sky-200/80 dark:border-sky-800">
          📖 Hướng dẫn chi tiết
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800">
        ✅ Giải / Phân tích
      </span>
    );
  };

  const subjectLabel = SUBJECT_OPTIONS.find((s) => s.id === message.subject)?.name;

  return (
    <div
      id={`msg-${message.id}`}
      className={`group w-full max-w-4xl mx-auto flex gap-2.5 sm:gap-4 py-3 sm:py-4 px-1.5 sm:px-4 transition-colors ${
        isAssistant ? '' : 'flex-row-reverse'
      }`}
    >
      {/* Avatar */}
      <div className="shrink-0 pt-0.5">
        {isAssistant ? (
          <div className="flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-600 text-white font-bold text-xs sm:text-sm shadow-xs ring-2 ring-emerald-500/20">
            AG
          </div>
        ) : (
          <div className="flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-2xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs sm:text-sm">
            <User className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
        )}
      </div>

      {/* Message Content Card */}
      <div className={`flex flex-col flex-1 max-w-[92%] sm:max-w-[85%] ${isAssistant ? 'items-start' : 'items-end'}`}>
        {/* Header meta */}
        <div className="flex items-center flex-wrap gap-1.5 sm:gap-2 mb-1.5 px-1 text-xs text-slate-500 dark:text-slate-400">
          <span className="font-bold text-slate-800 dark:text-slate-200">
            {isAssistant ? 'Anh Giáo AI' : 'Em (Học sinh)'}
          </span>
          <span>•</span>
          <span className="text-[11px]">{formatTime(message.timestamp)}</span>
          {isAssistant && message.mode && getModeBadge(message.mode)}
          {isAssistant && subjectLabel && message.subject !== 'auto' && (
            <span className="hidden sm:inline-block text-[11px] font-semibold text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/40 px-2 py-0.5 rounded-full border border-teal-200/60 dark:border-teal-800/60">
              {subjectLabel}
            </span>
          )}
          {isAssistant && message.modelUsed && (
            <span className="hidden md:inline-block text-[10px] text-slate-400 font-mono">
              ({message.modelUsed})
            </span>
          )}
        </div>

        {/* Message Bubble / Card */}
        <div
          className={`relative rounded-3xl p-4 sm:p-5 shadow-xs transition-shadow ${
            isAssistant
              ? message.isError
                ? 'w-full bg-red-50/90 dark:bg-red-950/30 border border-red-200 dark:border-red-900/60 text-red-900 dark:text-red-200'
                : 'w-full bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/90 text-slate-900 dark:text-slate-100 shadow-2xs'
              : 'bg-teal-700 dark:bg-teal-700 text-white rounded-tr-xs shadow-xs'
          }`}
        >
          {/* User Attached Image (Multimodal) */}
          {message.attachment && (
            <div className="mb-3">
              <div
                onClick={() => onPreviewImage && onPreviewImage(message.attachment?.previewUrl || '')}
                className="relative group/img inline-block rounded-2xl overflow-hidden border border-black/10 dark:border-white/10 max-w-xs cursor-pointer hover:opacity-90 transition-opacity shadow-sm"
              >
                <img
                  src={message.attachment.previewUrl}
                  alt={message.attachment.name || 'Ảnh bài tập đính kèm'}
                  className="max-h-60 w-auto object-cover rounded-2xl"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 flex items-center justify-center text-white text-xs font-medium transition-opacity">
                  <ImageIcon className="w-4 h-4 mr-1" />
                  Xem ảnh lớn
                </div>
              </div>
            </div>
          )}

          {/* Main Message Body */}
          {message.isError ? (
            <div className="space-y-2.5">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-sm text-red-800 dark:text-red-300">
                    {message.content}
                  </h4>
                  {message.errorDetails && (
                    <p className="text-xs text-red-700/80 dark:text-red-400/80 mt-1 leading-relaxed">
                      Em có thể bấm nút "Thử lại câu hỏi này" bên dưới hoặc mở Cài đặt để kiểm tra lại API Key.
                    </p>
                  )}
                </div>
              </div>

              {/* Technical Details for Teacher / Developer */}
              {message.errorDetails && (
                <div className="pt-2 border-t border-red-200/60 dark:border-red-900/40">
                  <button
                    onClick={() => setShowErrorDetails(!showErrorDetails)}
                    className="flex items-center gap-1 text-[11px] font-mono text-red-600 dark:text-red-400 hover:underline cursor-pointer"
                  >
                    <span>Chi tiết kỹ thuật</span>
                    {showErrorDetails ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  </button>
                  {showErrorDetails && (
                    <pre className="mt-1.5 p-2.5 rounded-xl bg-red-100/70 dark:bg-red-950/70 text-[11px] font-mono text-red-900 dark:text-red-200 overflow-x-auto whitespace-pre-wrap">
                      {message.errorDetails}
                    </pre>
                  )}
                </div>
              )}
            </div>
          ) : isAssistant ? (
            message.content ? (
              <MarkdownRenderer content={message.content} />
            ) : (
              <div className="flex items-center gap-2 py-1 text-slate-500 dark:text-slate-400 text-sm">
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce [animation-delay:-0.3s]"></span>
                  <span className="w-2 h-2 rounded-full bg-teal-500 animate-bounce [animation-delay:-0.15s]"></span>
                  <span className="w-2 h-2 rounded-full bg-sky-500 animate-bounce"></span>
                </div>
                <span className="text-xs font-medium italic">Anh Giáo đang suy nghĩ và chuẩn bị câu trả lời...</span>
              </div>
            )
          ) : (
            <p className="text-[15px] sm:text-[16px] leading-relaxed whitespace-pre-wrap select-text">
              {message.content}
            </p>
          )}

          {/* Actions for AI Message */}
          {isAssistant && !message.isError && message.content && (
            <div className="no-print mt-3.5 pt-2.5 flex items-center justify-between border-t border-slate-100 dark:border-slate-800/80 text-xs text-slate-500 dark:text-slate-400 flex-wrap gap-2">
              <div className="flex items-center gap-1">
                <button
                  id={`btn-copy-${message.id}`}
                  onClick={handleCopy}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-all duration-150 active:scale-95 motion-reduce:transform-none cursor-pointer"
                  title="Sao chép câu trả lời"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                      <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Đã chép</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Sao chép</span>
                    </>
                  )}
                </button>

                <button
                  id={`btn-tts-${message.id}`}
                  onClick={handleSpeak}
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-150 active:scale-95 motion-reduce:transform-none cursor-pointer ${
                    isSpeaking ? 'text-teal-600 dark:text-teal-400 font-semibold bg-teal-50 dark:bg-teal-950/40' : 'text-slate-600 dark:text-slate-300'
                  }`}
                  title={isSpeaking ? 'Dừng đọc' : 'Nghe Anh Giáo đọc'}
                >
                  {isSpeaking ? (
                    <>
                      <VolumeX className="w-3.5 h-3.5 text-teal-600 animate-pulse" />
                      <span>Dừng</span>
                    </>
                  ) : (
                    <>
                      <Volume2 className="w-3.5 h-3.5" />
                      <span>Nghe đọc</span>
                    </>
                  )}
                </button>
              </div>

              {onRetry && (
                <button
                  id={`btn-retry-${message.id}`}
                  onClick={onRetry}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-all duration-150 active:scale-95 motion-reduce:transform-none cursor-pointer"
                  title="Tạo lại câu trả lời khác"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Tạo lại</span>
                </button>
              )}
            </div>
          )}

          {/* Retry on Error */}
          {isAssistant && message.isError && onRetry && (
            <div className="mt-3 flex justify-end">
              <button
                id={`btn-retry-err-${message.id}`}
                onClick={onRetry}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold shadow-xs cursor-pointer transition-all active:scale-95"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Thử lại câu hỏi này</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
