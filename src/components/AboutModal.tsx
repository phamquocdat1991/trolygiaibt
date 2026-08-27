import React from 'react';
import { X, Heart, Award, GraduationCap, ShieldCheck } from 'lucide-react';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AboutModal: React.FC<AboutModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div className="relative w-full max-w-xl max-h-[85dvh] flex flex-col bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-slate-200 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 via-teal-600 to-sky-600 text-white font-black text-sm flex items-center justify-center shadow-xs ring-2 ring-emerald-500/20">
              AG
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg text-slate-900 dark:text-white leading-tight">
                ANH GIÁO AI
              </h3>
              <p className="text-xs text-teal-700 dark:text-teal-400 font-semibold">
                Phát triển bởi Anh Giáo PHẠM QUỐC ĐẠT
              </p>
            </div>
          </div>
          <button
            id="btn-close-about"
            onClick={onClose}
            className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer active:scale-95"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4 text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
          <div className="p-4 rounded-3xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800">
            <h4 className="font-bold text-slate-900 dark:text-white text-sm mb-1.5 flex items-center gap-1.5">
              <Award className="w-4 h-4 text-teal-600" />
              Sứ mệnh của Anh Giáo AI
            </h4>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
              <strong>ANH GIÁO AI</strong> được ra đời với khát vọng ứng dụng công nghệ trí tuệ nhân tạo tiên tiến nhất (Google Gemini) để đem lại một gia sư thông minh, kiên nhẫn, chuẩn mực sư phạm và hoàn toàn miễn phí cho tất cả học sinh trên khắp mọi miền Tổ quốc Việt Nam.
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5 text-sm">
              <GraduationCap className="w-4 h-4 text-emerald-500" />
              Đặc điểm nổi bật
            </h4>
            <ul className="space-y-1.5 list-disc pl-5 text-slate-600 dark:text-slate-300">
              <li>
                <strong>Toàn diện 12+ môn học:</strong> Toán, Văn, Ngoại ngữ, Lý, Hóa, Sinh, Sử, Địa, Tin học, GDCD... từ Lớp 1 đến Lớp 12 và Luyện thi THPT Quốc gia.
              </li>
              <li>
                <strong>3 Chế độ sư phạm độc quyền:</strong> Gợi ý manh mối kích thích tư duy, Hướng dẫn từng bước và Lời giải mẫu kèm phân tích bẫy đề thi.
              </li>
              <li>
                <strong>Định dạng Toán học chuẩn:</strong> Tích hợp bộ kết xuất công thức LaTeX / KaTeX trực quan và chính xác.
              </li>
              <li>
                <strong>Bảo mật & Tôn trọng quyền riêng tư:</strong> Lưu trữ dữ liệu an toàn trên thiết bị của học sinh.
              </li>
            </ul>
          </div>

          <div className="pt-3 border-t border-slate-200/80 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-1">
              <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
              <span>Dành trọn tâm huyết cho nền Giáo dục Việt Nam</span>
            </div>
            <div className="flex items-center gap-1 font-mono">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>v1.0.0 Production</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 sm:px-6 py-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/90 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="min-h-[40px] px-5 py-2 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-xs shadow-xs cursor-pointer active:scale-95 transition-all"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
