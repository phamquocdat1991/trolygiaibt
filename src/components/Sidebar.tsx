import React from 'react';
import {
  Plus,
  MessageSquare,
  Trash2,
  BookOpen,
  Settings,
  Info,
  X,
  Sparkles,
} from 'lucide-react';
import { Conversation } from '../types';
import { SUBJECT_OPTIONS, GRADE_OPTIONS } from '../lib/prompts';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  conversations: Conversation[];
  currentConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onNewChat: () => void;
  onDeleteConversation: (id: string, e: React.MouseEvent) => void;
  currentSubject: string;
  onSubjectChange: (sub: string) => void;
  currentGrade: string;
  onGradeChange: (grade: string) => void;
  onOpenSettings: () => void;
  onOpenInstructions: () => void;
  onOpenAbout: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  conversations,
  currentConversationId,
  onSelectConversation,
  onNewChat,
  onDeleteConversation,
  currentSubject,
  onSubjectChange,
  currentGrade,
  onGradeChange,
  onOpenSettings,
  onOpenInstructions,
  onOpenAbout,
}) => {
  return (
    <>
      {/* Mobile Backdrop with smooth transition */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs md:hidden transition-opacity duration-300 animate-in fade-in"
          aria-hidden="true"
        />
      )}

      {/* Sidebar Drawer / Container (Xanh Slate 30%) */}
      <aside
        id="app-sidebar"
        className={`fixed md:static inset-y-0 left-0 z-40 w-72 sm:w-80 flex flex-col bg-slate-900 text-slate-100 border-r border-slate-800 transition-transform duration-300 ease-in-out shrink-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Header / Brand info */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800/90 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-600 flex items-center justify-center font-bold text-white text-xs ring-2 ring-emerald-500/20 shadow-xs">
              AG
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-sm tracking-tight text-white">Anh Giáo AI</span>
              <span className="text-[10px] text-slate-400">Trợ lý học tập đa môn</span>
            </div>
          </div>

          <button
            id="btn-close-sidebar"
            onClick={onClose}
            className="min-w-[36px] min-h-[36px] flex items-center justify-center p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 md:hidden cursor-pointer active:scale-95 transition-all"
            aria-label="Close Sidebar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* New Chat Button */}
        <div className="p-3 shrink-0">
          <button
            id="btn-new-chat"
            onClick={() => {
              onNewChat();
              if (window.innerWidth < 768) onClose();
            }}
            className="w-full min-h-[44px] flex items-center justify-center gap-2 py-2.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-xs shadow-emerald-600/30 active:scale-95 transition-all duration-150 cursor-pointer motion-reduce:transform-none"
          >
            <Plus className="w-4 h-4" />
            <span>Tạo cuộc trò chuyện mới</span>
          </button>
        </div>

        {/* Quick Subject & Grade Pickers */}
        <div className="px-3 py-2 space-y-2.5 border-b border-slate-800/80 shrink-0">
          <div>
            <label className="block text-[11px] font-medium text-slate-400 mb-1">
              Môn học đang chọn:
            </label>
            <select
              id="sidebar-select-subject"
              value={currentSubject}
              onChange={(e) => onSubjectChange(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-slate-200 focus:outline-hidden focus:border-emerald-500"
            >
              {SUBJECT_OPTIONS.map((sub) => (
                <option key={sub.id} value={sub.id}>
                  {sub.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-400 mb-1">
              Khối / Cấp học:
            </label>
            <select
              id="sidebar-select-grade"
              value={currentGrade}
              onChange={(e) => onGradeChange(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-slate-200 focus:outline-hidden focus:border-emerald-500"
            >
              {GRADE_OPTIONS.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Conversation History List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
          <div className="flex items-center justify-between px-2 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            <span>Lịch sử hội thoại</span>
            <span className="text-[10px] font-normal text-slate-400">{conversations.length} bài</span>
          </div>

          {conversations.length === 0 ? (
            <div className="text-center py-8 px-4 text-xs text-slate-400">
              <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p>Chưa có hội thoại nào.</p>
              <p className="text-[10px] mt-1 text-slate-500">Hãy đặt câu hỏi đầu tiên để lưu bài học!</p>
            </div>
          ) : (
            conversations.map((conv) => {
              const isSelected = conv.id === currentConversationId;
              return (
                <div
                  key={conv.id}
                  id={`conv-item-${conv.id}`}
                  onClick={() => {
                    onSelectConversation(conv.id);
                    if (window.innerWidth < 768) onClose();
                  }}
                  className={`group relative flex items-center justify-between p-2.5 rounded-2xl text-xs cursor-pointer transition-all duration-150 ${
                    isSelected
                      ? 'bg-slate-800 text-white font-medium border border-emerald-500/50 shadow-xs'
                      : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0 pr-2">
                    <MessageSquare className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
                    <div className="flex flex-col min-w-0">
                      <span className="truncate">{conv.title || 'Hội thoại không tên'}</span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(conv.updatedAt || conv.createdAt).toLocaleDateString('vi-VN')}
                      </span>
                    </div>
                  </div>

                  <button
                    id={`btn-del-conv-${conv.id}`}
                    onClick={(e) => onDeleteConversation(conv.id, e)}
                    className="min-w-[28px] min-h-[28px] flex items-center justify-center p-1 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-950/60 hover:text-red-400 text-slate-400 transition-all cursor-pointer active:scale-95"
                    title="Xóa hội thoại này"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Navigation items */}
        <div className="p-3 border-t border-slate-800 space-y-1 shrink-0 text-xs">
          <button
            id="btn-sidebar-instructions"
            onClick={() => {
              onOpenInstructions();
              if (window.innerWidth < 768) onClose();
            }}
            className="w-full min-h-[38px] flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-300 hover:bg-slate-800 hover:text-white transition-all active:scale-95 motion-reduce:transform-none cursor-pointer text-left"
          >
            <BookOpen className="w-4 h-4 text-emerald-400" />
            <span>Phương pháp học tốt với AI</span>
          </button>

          <button
            id="btn-sidebar-settings"
            onClick={() => {
              onOpenSettings();
              if (window.innerWidth < 768) onClose();
            }}
            className="w-full min-h-[38px] flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-300 hover:bg-slate-800 hover:text-white transition-all active:scale-95 motion-reduce:transform-none cursor-pointer text-left"
          >
            <Settings className="w-4 h-4 text-teal-400" />
            <span>Cài đặt hệ thống</span>
          </button>

          <button
            id="btn-sidebar-about"
            onClick={() => {
              onOpenAbout();
              if (window.innerWidth < 768) onClose();
            }}
            className="w-full min-h-[38px] flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-300 hover:bg-slate-800 hover:text-white transition-all active:scale-95 motion-reduce:transform-none cursor-pointer text-left"
          >
            <Info className="w-4 h-4 text-amber-400" />
            <span>Về Anh Giáo PHẠM QUỐC ĐẠT</span>
          </button>

          <div className="pt-2 px-2 text-[10px] text-slate-400 leading-tight">
            © 2026 ANH GIÁO AI. Phiên bản Giáo Dục Việt Nam.
          </div>
        </div>
      </aside>
    </>
  );
};
