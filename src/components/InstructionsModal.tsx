import React from 'react';
import { X, BookOpen, Sparkles, HelpCircle } from 'lucide-react';

interface InstructionsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InstructionsModal: React.FC<InstructionsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div className="relative w-full max-w-2xl max-h-[85dvh] flex flex-col bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-slate-200 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg text-slate-900 dark:text-white leading-tight">
                Bí quyết học giỏi cùng Anh Giáo AI
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Phương pháp rèn luyện tư duy và tự học hiệu quả
              </p>
            </div>
          </div>
          <button
            id="btn-close-instructions"
            onClick={onClose}
            className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer active:scale-95"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5 text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
          {/* Section 1: 3 Chế độ */}
          <div className="p-4 rounded-3xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 space-y-3">
            <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 text-sm">
              <Sparkles className="w-4 h-4 text-emerald-500" />
              1. Chọn chế độ học tập phù hợp (Rất quan trọng!)
            </h4>
            <div className="space-y-2 text-xs">
              <div className="p-3 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <span className="font-bold text-amber-800 dark:text-amber-300">💡 Chế độ "Gợi ý nhẹ":</span>
                <p className="mt-0.5 text-slate-600 dark:text-slate-300 leading-relaxed">
                  Dùng khi em muốn tự mình giải bài tập. Anh Giáo sẽ chỉ gợi mở công thức cốt lõi và hướng đi, không đưa đáp số để em rèn luyện não bộ.
                </p>
              </div>
              <div className="p-3 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <span className="font-bold text-teal-800 dark:text-teal-300">📖 Chế độ "Hướng dẫn từng bước":</span>
                <p className="mt-0.5 text-slate-600 dark:text-slate-300 leading-relaxed">
                  Chia bài toán thành Bước 1, Bước 2, Bước 3... và giải thích "Tại sao lại áp dụng công thức này" để em hiểu sâu bản chất.
                </p>
              </div>
              <div className="p-3 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <span className="font-bold text-emerald-800 dark:text-emerald-300">✅ Chế độ "Giải / Phân tích chi tiết":</span>
                <p className="mt-0.5 text-slate-600 dark:text-slate-300 leading-relaxed">
                  Trình bày bài mẫu chuẩn mực, phân tích các bẫy đề thi dễ mất điểm và phương pháp giải nhanh trắc nghiệm/tự luận.
                </p>
              </div>
            </div>
          </div>

          {/* Section 2: Cách hỏi bài */}
          <div className="space-y-2.5">
            <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 text-sm">
              <HelpCircle className="w-4 h-4 text-teal-600" />
              2. Cách đặt câu hỏi để nhận câu trả lời tốt nhất
            </h4>
            <ul className="space-y-2 list-disc pl-5 text-xs text-slate-600 dark:text-slate-300">
              <li>
                <strong>Chụp ảnh bài tập rõ nét:</strong> Bấm biểu tượng chiếc kẹp giấy 📎 ở thanh nhập để tải ảnh đề bài từ sách hoặc bài kiểm tra.
              </li>
              <li>
                <strong>Nêu rõ chỗ em chưa hiểu:</strong> Thay vì chỉ gửi đề bài, em có thể nói: <em>"Anh Giáo ơi, em chưa hiểu đoạn biến đổi lượng giác này..."</em>.
              </li>
              <li>
                <strong>Chọn đúng môn học:</strong> Giúp AI áp dụng đúng chuẩn thuật ngữ, công thức và văn phong của môn đó.
              </li>
            </ul>
          </div>

          {/* Section 3: Lời khuyên */}
          <div className="p-4 rounded-3xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/40 text-xs text-amber-900 dark:text-amber-200">
            <p className="font-bold mb-1">🎓 Lời nhắn từ Anh Giáo PHẠM QUỐC ĐẠT:</p>
            <p className="italic leading-relaxed">
              "AI là người bạn đồng hành hỗ trợ đắc lực, nhưng sự nỗ lực tự suy nghĩ và tự tay đặt bút tính toán mới là chìa khóa giúp em làm chủ tri thức. Hãy kiên trì mỗi ngày nhé!"
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 sm:px-6 py-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/90 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="min-h-[40px] px-5 py-2 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs shadow-emerald-600/30 cursor-pointer active:scale-95 transition-all"
          >
            Đã hiểu, bắt đầu học!
          </button>
        </div>
      </div>
    </div>
  );
};
