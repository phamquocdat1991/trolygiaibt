import React, { useState, useRef, useEffect } from 'react';
import {
  Menu,
  Sparkles,
  Share2,
  Settings,
  Sun,
  Moon,
  Trash2,
  Download,
  History,
  FileText,
  FileCode,
  Printer,
  ChevronDown,
  Key,
  CheckCircle2,
  Atom,
  Brain,
  FileCheck,
  FileEdit,
} from 'lucide-react';
import { Conversation } from '../types';
import { VisitCounter } from './VisitCounter';

interface HeaderProps {
  onToggleSidebar: () => void;
  onOpenSettings: () => void;
  onOpenHistory: () => void;
  onClearChat: () => void;
  isDark: boolean;
  onToggleDark: () => void;
  isGenerating: boolean;
  hasApiKey: boolean;
  currentConversation: Conversation | null;
  onToast: (msg: string) => void;
  onOpenExamGenerator?: () => void;
  onOpenVirtualLab?: () => void;
  onOpenFlashcards?: () => void;
  onExportWord?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onToggleSidebar,
  onOpenSettings,
  onOpenHistory,
  onClearChat,
  isDark,
  onToggleDark,
  isGenerating,
  hasApiKey,
  currentConversation,
  onToast,
  onOpenExamGenerator,
  onOpenVirtualLab,
  onOpenFlashcards,
  onExportWord,
}) => {
  const [downloadMenuOpen, setDownloadMenuOpen] = useState(false);
  const downloadRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (downloadRef.current && !downloadRef.current.contains(event.target as Node)) {
        setDownloadMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleShare = async () => {
    const title = 'ANH GIÁO AI - Trợ lý học tập đa môn';
    const text = 'Học tập thông minh cùng Anh Giáo AI (Phát triển bởi Anh Giáo PHẠM QUỐC ĐẠT)';
    const url = window.location.href;

    if (navigator.share) {
      try {
        await navigator.share({ title, text, url });
        onToast('Đã chia sẻ thành công!');
        return;
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          // Fallback to clipboard
        } else {
          return;
        }
      }
    }

    try {
      await navigator.clipboard.writeText(`${title}\n${text}\n${url}`);
      onToast('Đã sao chép liên kết vào bộ nhớ tạm!');
    } catch {
      onToast('Không thể sao chép liên kết.');
    }
  };

  const handleDownloadMarkdown = () => {
    if (!currentConversation || currentConversation.messages.length === 0) {
      onToast('Chưa có nội dung hội thoại để xuất.');
      return;
    }

    let md = `# ${currentConversation.title || 'Hội thoại Anh Giáo AI'}\n`;
    md += `*Thời gian tạo: ${new Date(currentConversation.createdAt).toLocaleString('vi-VN')}*\n`;
    md += `*Môn học: ${currentConversation.subject || 'Đa môn'} | Cấp học: ${currentConversation.grade || 'Mặc định'}*\n\n---\n\n`;

    currentConversation.messages.forEach((msg) => {
      const roleName = msg.role === 'user' ? '👤 Học sinh' : '🎓 Anh Giáo AI';
      const time = new Date(msg.timestamp).toLocaleTimeString('vi-VN');
      md += `### ${roleName} (${time})\n\n`;
      md += `${msg.content}\n\n`;
      if (msg.attachment?.name) {
        md += `*[Đính kèm: ${msg.attachment.name}]*\n\n`;
      }
      md += `---\n\n`;
    });

    md += `\n*Xuất từ ứng dụng ANH GIÁO AI - Phát triển bởi Anh Giáo PHẠM QUỐC ĐẠT*`;

    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `AnhGiaoAI_${Date.now()}.md`;
    link.click();
    URL.revokeObjectURL(url);
    setDownloadMenuOpen(false);
    onToast('Đã tải xuống tệp Markdown (.md)');
  };

  const handleDownloadTxt = () => {
    if (!currentConversation || currentConversation.messages.length === 0) {
      onToast('Chưa có nội dung hội thoại để xuất.');
      return;
    }

    let txt = `ANH GIÁO AI - TRỢ LÝ HỌC TẬP ĐA MÔN\n`;
    txt += `Phát triển bởi Anh Giáo PHẠM QUỐC ĐẠT\n`;
    txt += `Chủ đề: ${currentConversation.title || 'Hội thoại học tập'}\n`;
    txt += `Thời gian: ${new Date(currentConversation.createdAt).toLocaleString('vi-VN')}\n`;
    txt += `=====================================================\n\n`;

    currentConversation.messages.forEach((msg) => {
      const roleName = msg.role === 'user' ? '[Học sinh]' : '[Anh Giáo AI]';
      const time = new Date(msg.timestamp).toLocaleTimeString('vi-VN');
      txt += `${roleName} - ${time}:\n${msg.content}\n\n`;
      txt += `-----------------------------------------------------\n\n`;
    });

    const blob = new Blob([txt], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `AnhGiaoAI_${Date.now()}.txt`;
    link.click();
    URL.revokeObjectURL(url);
    setDownloadMenuOpen(false);
    onToast('Đã tải xuống tệp văn bản (.txt)');
  };

  const handlePrintPdf = () => {
    setDownloadMenuOpen(false);
    window.print();
  };

  return (
    <header className="no-print sticky top-0 z-30 flex items-center justify-between px-2.5 sm:px-4 py-2 sm:py-2.5 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 transition-colors shadow-2xs">
      {/* Left: Hamburger & Brand */}
      <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0">
        <button
          id="btn-toggle-sidebar"
          onClick={onToggleSidebar}
          className="min-w-[40px] min-h-[40px] flex items-center justify-center p-2 rounded-2xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 focus:outline-hidden cursor-pointer transition-all duration-150 active:scale-95 motion-reduce:transform-none"
          title="Mở danh mục & cài đặt"
          aria-label="Toggle Sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Brand Avatar & Info */}
        <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
          <div className="relative flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 via-teal-600 to-sky-600 text-white font-bold text-sm tracking-tight shadow-xs ring-2 ring-emerald-500/20 shrink-0">
            <span>AG</span>
            {/* Online pulsing indicator */}
            <span
              className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white dark:border-slate-900 ${
                isGenerating ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'
              }`}
              title={isGenerating ? 'AI đang suy nghĩ...' : 'Anh Giáo AI sẵn sàng'}
            />
          </div>

          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-sm sm:text-base tracking-tight text-slate-900 dark:text-white leading-tight truncate">
                ANH GIÁO AI
              </span>
              <span className="hidden lg:inline-flex items-center gap-0.5 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800">
                <Sparkles className="w-2.5 h-2.5" />
                Đa Môn
              </span>
            </div>
            <div className="flex items-center gap-1 text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 font-medium truncate">
              <span className="truncate max-w-[120px] sm:max-w-[220px] md:max-w-none">
                Thầy <strong className="font-semibold text-slate-700 dark:text-slate-300">Phạm Quốc Đạt</strong>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Center: Quick Action Tools & Visit Counter */}
      <div className="hidden lg:flex items-center gap-1.5 shrink-0">
        {onOpenExamGenerator && (
          <button
            id="btn-header-exam-gen"
            onClick={onOpenExamGenerator}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-xs font-bold transition-all cursor-pointer active:scale-95 shadow-xs"
            title="Biên soạn đề thi chuẩn GDPT 2018 (Công văn 7991)"
          >
            <FileEdit className="w-3.5 h-3.5" />
            <span>Tạo đề thi GDPT</span>
          </button>
        )}

        {onOpenVirtualLab && (
          <button
            id="btn-header-virtual-lab"
            onClick={onOpenVirtualLab}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-teal-50 dark:bg-teal-950/60 hover:bg-teal-100 dark:hover:bg-teal-900/60 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800 text-xs font-bold transition-all cursor-pointer active:scale-95 shadow-xs"
            title="Mô phỏng Con lắc đơn, Parabol và Chuẩn độ pH"
          >
            <Atom className="w-3.5 h-3.5" />
            <span>Thí nghiệm ảo</span>
          </button>
        )}

        {onOpenFlashcards && (
          <button
            id="btn-header-flashcards"
            onClick={onOpenFlashcards}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-100 dark:hover:bg-amber-900/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 text-xs font-bold transition-all cursor-pointer active:scale-95 shadow-xs"
            title="Bộ thẻ ghi nhớ Spaced Repetition (SM-2)"
          >
            <Brain className="w-3.5 h-3.5" />
            <span>Flashcard</span>
          </button>
        )}
      </div>

      <div className="hidden md:flex lg:hidden items-center justify-center shrink-0">
        <VisitCounter compact={true} />
      </div>

      {/* Right: Actions & Settings */}
      <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
        {/* Nút API Key LUÔN HIỂN THỊ theo AI_INSTRUCTIONS.md - màu đỏ rõ ràng */}
        <button
          id="btn-header-get-api-key"
          type="button"
          onClick={onOpenSettings}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-2xl text-xs font-bold transition-all cursor-pointer active:scale-95 shadow-xs border ${
            hasApiKey
              ? 'bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 dark:hover:bg-rose-900/80 border-rose-300 dark:border-rose-700'
              : 'bg-red-600 hover:bg-red-700 border-red-700 animate-pulse'
          }`}
          title="Nhấn để thiết lập hoặc thay đổi API Key khi hết quota"
        >
          <Key className={`w-3.5 h-3.5 ${hasApiKey ? 'text-red-600 dark:text-red-400' : 'text-white'}`} />
          <span className={`font-extrabold hidden sm:inline ${hasApiKey ? 'text-red-600 dark:text-red-400' : 'text-white'}`}>
            Lấy API key để sử dụng app
          </span>
          <span className={`sm:hidden font-extrabold ${hasApiKey ? 'text-red-600 dark:text-red-400' : 'text-white'}`}>
            Lấy Key
          </span>
          {hasApiKey && (
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" title="API Key đang hoạt động" />
          )}
        </button>

        {/* History Modal Trigger */}
        <button
          id="btn-header-history"
          onClick={onOpenHistory}
          className="min-w-[38px] min-h-[38px] flex items-center justify-center p-2 rounded-2xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 cursor-pointer transition-all duration-150 active:scale-95 motion-reduce:transform-none"
          title="Lịch sử bài học"
          aria-label="History"
        >
          <History className="w-4.5 h-4.5" />
        </button>

        {/* Share */}
        <button
          id="btn-header-share"
          onClick={handleShare}
          className="min-w-[38px] min-h-[38px] flex items-center justify-center p-2 rounded-2xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 cursor-pointer transition-all duration-150 active:scale-95 motion-reduce:transform-none"
          title="Chia sẻ ứng dụng"
          aria-label="Share"
        >
          <Share2 className="w-4.5 h-4.5" />
        </button>

        {/* Download Menu */}
        <div className="relative" ref={downloadRef}>
          <button
            id="btn-header-download"
            onClick={() => setDownloadMenuOpen(!downloadMenuOpen)}
            className="min-w-[38px] min-h-[38px] flex items-center justify-center gap-0.5 p-2 rounded-2xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 cursor-pointer transition-all duration-150 active:scale-95 motion-reduce:transform-none"
            title="Tải xuống / In bài học"
            aria-label="Download Menu"
          >
            <Download className="w-4.5 h-4.5" />
            <ChevronDown className="w-3 h-3 opacity-60 hidden sm:inline-block" />
          </button>

          {downloadMenuOpen && (
            <div className="absolute right-0 mt-1.5 w-56 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl py-1.5 z-50 animate-in fade-in zoom-in-95">
              <button
                id="btn-export-word"
                onClick={() => {
                  setDownloadMenuOpen(false);
                  if (onExportWord) onExportWord();
                  else handleDownloadMarkdown();
                }}
                className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 cursor-pointer text-left transition-colors"
              >
                <FileText className="w-4 h-4 text-blue-600" />
                <span>Xuất file Word (.doc) chuẩn</span>
              </button>
              <button
                id="btn-export-markdown"
                onClick={handleDownloadMarkdown}
                className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer text-left transition-colors"
              >
                <FileCode className="w-4 h-4 text-sky-600" />
                <span>Xuất file Markdown (.md)</span>
              </button>
              <button
                id="btn-export-txt"
                onClick={handleDownloadTxt}
                className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer text-left transition-colors"
              >
                <FileText className="w-4 h-4 text-emerald-600" />
                <span>Xuất file Text (.txt)</span>
              </button>
              <div className="my-1 border-t border-slate-100 dark:border-slate-800" />
              <button
                id="btn-print-pdf"
                onClick={handlePrintPdf}
                className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer text-left transition-colors"
              >
                <Printer className="w-4 h-4 text-amber-500" />
                <span>In / Lưu thành PDF</span>
              </button>
            </div>
          )}
        </div>

        {/* Clear Chat */}
        <button
          id="btn-header-clear"
          onClick={onClearChat}
          className="min-w-[38px] min-h-[38px] flex items-center justify-center p-2 rounded-2xl text-slate-600 dark:text-slate-300 hover:bg-red-50 dark:hover:bg-red-950/40 hover:text-red-600 dark:hover:text-red-400 cursor-pointer transition-all duration-150 active:scale-95 motion-reduce:transform-none"
          title="Xóa cuộc trò chuyện hiện tại"
          aria-label="Clear Chat"
        >
          <Trash2 className="w-4.5 h-4.5" />
        </button>

        {/* Dark Mode Toggle */}
        <button
          id="btn-header-theme"
          onClick={onToggleDark}
          className="min-w-[38px] min-h-[38px] flex items-center justify-center p-2 rounded-2xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 cursor-pointer transition-all duration-150 active:scale-95 motion-reduce:transform-none"
          title={isDark ? 'Chuyển sang giao diện Sáng' : 'Chuyển sang giao diện Tối'}
          aria-label="Toggle Theme"
        >
          {isDark ? <Sun className="w-4.5 h-4.5 text-amber-400" /> : <Moon className="w-4.5 h-4.5 text-teal-600" />}
        </button>

        {/* Settings */}
        <button
          id="btn-header-settings"
          onClick={onOpenSettings}
          className="min-w-[38px] min-h-[38px] flex items-center justify-center p-2 rounded-2xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 cursor-pointer transition-all duration-150 active:scale-95 motion-reduce:transform-none"
          title="Cài đặt hệ thống"
          aria-label="Settings"
        >
          <Settings className="w-4.5 h-4.5" />
        </button>
      </div>
    </header>
  );
};
