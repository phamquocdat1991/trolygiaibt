import React, { useState } from 'react';
import { Key, Sparkles, ExternalLink, ShieldCheck, Check, ArrowRight } from 'lucide-react';
import { isValidGoogleAiApiKey } from '../lib/aiClientFactory';

interface OnboardingKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveKey: (key: string) => void;
}

export const OnboardingKeyModal: React.FC<OnboardingKeyModalProps> = ({
  isOpen,
  onClose,
  onSaveKey,
}) => {
  const [apiKey, setApiKey] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanKey = apiKey.trim();
    if (!cleanKey) {
      setErrorMsg('Vui lòng dán API Key của em vào ô bên dưới nhé.');
      return;
    }

    if (!isValidGoogleAiApiKey(cleanKey)) {
      setErrorMsg('Định dạng khóa không đúng. API Key của Google thường bắt đầu bằng "AIzaSy..." hoặc "AQ...".');
      return;
    }

    onSaveKey(cleanKey);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-xs animate-in fade-in">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* Top Header Banner */}
        <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-sky-600 p-6 text-white text-center relative overflow-hidden">
          <div className="relative z-10 flex flex-col items-center space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white shadow-md">
              <Key className="w-7 h-7" />
            </div>
            <h3 className="text-xl sm:text-2xl font-extrabold tracking-tight">
              Chào mừng em đến với ANH GIÁO AI!
            </h3>
            <p className="text-xs sm:text-sm text-emerald-100 max-w-sm">
              Trợ lý học tập đa môn thông minh dành cho học sinh Việt Nam
            </p>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-5 text-xs sm:text-sm">
          <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 space-y-1.5">
            <div className="flex items-center gap-2 font-bold text-sm">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <span>Thiết lập API Key để sử dụng không giới hạn:</span>
            </div>
            <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300">
              Để app hoạt động mượt mà, độc lập và bảo mật 100%, em hãy lấy một <strong>Gemini API Key miễn phí</strong> từ Google theo hướng dẫn dưới đây.
            </p>
          </div>

          {/* Steps to get free key */}
          <div className="space-y-2.5">
            <span className="font-semibold text-slate-800 dark:text-slate-200 block">
              3 bước lấy API Key miễn phí (mất 30 giây):
            </span>
            <div className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold shrink-0 text-emerald-600">
                  1
                </span>
                <span>
                  Truy cập trang{' '}
                  <a
                    href="https://aistudio.google.com/api-keys"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-0.5 text-teal-600 dark:text-teal-400 font-bold underline hover:text-teal-700"
                  >
                    Google AI Studio <ExternalLink className="w-3 h-3" />
                  </a>{' '}
                  (đăng nhập bằng tài khoản Google).
                </span>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold shrink-0 text-emerald-600">
                  2
                </span>
                <span>Bấm nút <strong>"Create API key"</strong> (Tạo khóa API) và sao chép khóa.</span>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold shrink-0 text-emerald-600">
                  3
                </span>
                <span>Dán khóa vào ô bên dưới và bấm <strong>"Bắt đầu học ngay"</strong>!</span>
              </div>
            </div>
          </div>

          {/* Form Input */}
          <form onSubmit={handleSubmit} className="space-y-3 pt-1">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Dán Gemini API Key của em tại đây:
              </label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => {
                  setApiKey(e.target.value);
                  setErrorMsg('');
                }}
                placeholder="AIzaSy... hoặc AQ..."
                className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:border-emerald-500 font-mono text-xs sm:text-sm shadow-inner"
                autoFocus
              />
              {errorMsg && (
                <p className="text-red-500 text-xs mt-1.5 font-medium">{errorMsg}</p>
              )}
            </div>

            <div className="flex items-center justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-2xl text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors cursor-pointer"
              >
                Để sau / Trải nghiệm trước
              </button>

              <button
                type="submit"
                className="flex items-center gap-1.5 px-6 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/30 transition-all cursor-pointer active:scale-95"
              >
                <span>Bắt đầu học ngay</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>

          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-center gap-1 text-[11px] text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>Khóa API được lưu trữ an toàn trong trình duyệt của bạn</span>
          </div>
        </div>
      </div>
    </div>
  );
};
