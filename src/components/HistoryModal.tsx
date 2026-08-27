import React, { useState } from 'react';
import {
  X,
  History,
  Trash2,
  MessageSquare,
  Search,
  BookOpen,
} from 'lucide-react';
import { Conversation } from '../types';
import { SUBJECT_OPTIONS, GRADE_OPTIONS } from '../lib/prompts';

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  conversations: Conversation[];
  onSelectConversation: (id: string) => void;
  onDeleteConversation: (id: string, e: React.MouseEvent) => void;
  onClearAllHistory: () => void;
}

export const HistoryModal: React.FC<HistoryModalProps> = ({
  isOpen,
  onClose,
  conversations,
  onSelectConversation,
  onDeleteConversation,
  onClearAllHistory,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [confirmClearAll, setConfirmClearAll] = useState(false);

  if (!isOpen) return null;

  const filteredConversations = conversations.filter((c) => {
    const matchTitle = (c.title || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchMsg = c.messages.some((m) =>
      m.content.toLowerCase().includes(searchTerm.toLowerCase())
    );
    return matchTitle || matchMsg;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div className="relative w-full max-w-2xl max-h-[85dvh] flex flex-col bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-slate-200 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg text-slate-900 dark:text-white leading-tight">
                Lịch sử học tập & bài giải
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Xem lại các bài toán, đề thi và cuộc trao đổi trước đây ({conversations.length} bài)
              </p>
            </div>
          </div>
          <button
            id="btn-close-history"
            onClick={onClose}
            className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer active:scale-95"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 shrink-0">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm kiếm nội dung bài học, công thức, từ khóa..."
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:border-emerald-500 text-xs sm:text-sm"
            />
          </div>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-2.5">
          {filteredConversations.length === 0 ? (
            <div className="text-center py-12 px-4 text-xs text-slate-500 dark:text-slate-400">
              <BookOpen className="w-10 h-10 mx-auto mb-2 opacity-30 text-slate-400" />
              <p className="font-semibold text-sm">Không tìm thấy bài học nào phù hợp.</p>
              <p className="text-xs mt-1">Hãy thử tìm với từ khóa khác hoặc tạo cuộc trò chuyện mới!</p>
            </div>
          ) : (
            filteredConversations.map((conv) => {
              const subObj = SUBJECT_OPTIONS.find((s) => s.id === conv.subject);
              const gradeObj = GRADE_OPTIONS.find((g) => g.id === conv.grade);
              const lastMsg =
                conv.messages.length > 0 ? conv.messages[conv.messages.length - 1] : null;

              return (
                <div
                  key={conv.id}
                  id={`history-item-${conv.id}`}
                  onClick={() => {
                    onSelectConversation(conv.id);
                    onClose();
                  }}
                  className="group flex items-start justify-between p-3.5 sm:p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-800/50 hover:bg-slate-100/90 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 cursor-pointer transition-all duration-150"
                >
                  <div className="flex items-start gap-3 min-w-0 pr-3">
                    <div className="p-2 rounded-xl bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5">
                      <MessageSquare className="w-4 h-4" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white truncate">
                        {conv.title || 'Hội thoại không tên'}
                      </h4>
                      {lastMsg && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                          {lastMsg.content}
                        </p>
                      )}
                      <div className="flex flex-wrap items-center gap-1.5 mt-2 text-[11px]">
                        <span className="text-slate-400">
                          {new Date(conv.updatedAt || conv.createdAt).toLocaleString('vi-VN')}
                        </span>
                        {subObj && conv.subject !== 'auto' && (
                          <span className="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-semibold border border-emerald-200/60 dark:border-emerald-800/60">
                            {subObj.name}
                          </span>
                        )}
                        {gradeObj && conv.grade !== 'all' && (
                          <span className="px-2 py-0.5 rounded-md bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 font-semibold border border-teal-200/60 dark:border-teal-800/60">
                            {gradeObj.name}
                          </span>
                        )}
                        <span className="text-slate-400">({conv.messages.length} tin nhắn)</span>
                      </div>
                    </div>
                  </div>

                  <button
                    id={`btn-del-hist-${conv.id}`}
                    onClick={(e) => onDeleteConversation(conv.id, e)}
                    className="min-w-[32px] min-h-[32px] flex items-center justify-center p-1.5 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer shrink-0 active:scale-95"
                    title="Xóa bài học này"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-5 sm:px-6 py-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/90 flex items-center justify-between shrink-0">
          {confirmClearAll ? (
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-red-600">Chắc chắn xóa hết?</span>
              <button
                id="btn-confirm-clear-all"
                onClick={onClearAllHistory}
                className="px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs cursor-pointer active:scale-95"
              >
                Xóa tất cả
              </button>
              <button
                onClick={() => setConfirmClearAll(false)}
                className="px-2 py-1.5 rounded-xl text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer"
              >
                Hủy
              </button>
            </div>
          ) : (
            <button
              id="btn-trigger-clear-all"
              onClick={() => setConfirmClearAll(true)}
              disabled={conversations.length === 0}
              className="flex items-center gap-1.5 text-xs text-red-600 dark:text-red-400 hover:text-red-700 font-semibold cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Xóa toàn bộ lịch sử</span>
            </button>
          )}

          <button
            onClick={onClose}
            className="min-h-[38px] px-5 py-2 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-xs shadow-xs cursor-pointer active:scale-95 transition-all"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
