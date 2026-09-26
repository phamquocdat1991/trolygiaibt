import React from 'react';
import { ArrowUpRight, BookOpen, Camera, History, Mic, Settings, Sparkles, FileEdit, Atom, Brain } from 'lucide-react';
import { Conversation } from '../types';
import { SUBJECT_OPTIONS, GRADE_OPTIONS } from '../lib/prompts';

interface Props {
  conversations: Conversation[];
  subject: string;
  grade: string;
  onSelectConversation: (id: string) => void;
  onOpenHistory: () => void;
  onOpenSettings: () => void;
  onSubjectChange: (value: string) => void;
  onGradeChange: (value: string) => void;
  starters: { subject: string; title: string; prompt: string; icon: React.ElementType }[];
  onStarter: (subject: string, prompt: string) => void;
  onOpenExamGenerator?: () => void;
  onOpenVirtualLab?: () => void;
  onOpenFlashcards?: () => void;
}

export function LearningHome(props: Props) {
  const recent = props.conversations.filter(c => c.messages.length > 0).sort((a, b) => b.updatedAt - a.updatedAt);
  const questions = recent.reduce((total, c) => total + c.messages.filter(m => m.role === 'user').length, 0);
  return (
    <div className="learning-home">
      <section className="dawn-banner">
        <div className="dawn-copy">
          <span className="home-eyebrow"><Sparkles size={15} /> CÙNG ANH GIÁO AI</span>
          <h1>Mỗi câu hỏi,<br /><em>một điều mới!</em></h1>
          <p>Hiểu từng bước nhỏ.<br />Tự tin chinh phục bài học mỗi ngày.</p>
          <button className="home-primary" onClick={() => document.getElementById('chat-input-textarea')?.focus()}>Bắt đầu học <ArrowUpRight size={17} /></button>
        </div>
        <img className="dawn-art" src="/images/dawn-classroom.webp" alt="Thầy giáo cùng sách vở trong sân trường ngập nắng sớm" />
      </section>
      <div className="home-stats">
        <div><span className="stat-icon peach"><BookOpen /></span><p>Môn học hỗ trợ<strong>{SUBJECT_OPTIONS.filter(s => s.id !== 'auto').length}</strong></p></div>
        <div><span className="stat-icon mint"><History /></span><p>Hội thoại đã lưu<strong>{recent.length}</strong></p></div>
        <div><span className="stat-icon butter"><Sparkles /></span><p>Câu hỏi đã gửi<strong>{questions}</strong></p></div>
      </div>

      {/* Featured Educational Tools Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 my-4">
        {props.onOpenExamGenerator && (
          <button
            onClick={props.onOpenExamGenerator}
            className="flex items-center gap-3 p-3.5 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/40 border border-blue-200 dark:border-blue-800/60 hover:shadow-md transition-all text-left group cursor-pointer"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform">
              <FileEdit size={20} />
            </div>
            <div className="flex-1 min-w-0">
              <strong className="block text-xs font-bold text-blue-900 dark:text-blue-200 truncate">Tạo Đề Thi GDPT 2018</strong>
              <small className="block text-[11px] text-blue-700/80 dark:text-blue-300/70 truncate">Chuẩn 4 phần CV 7991</small>
            </div>
            <ArrowUpRight size={16} className="text-blue-500 opacity-60 group-hover:opacity-100 transition-opacity" />
          </button>
        )}

        {props.onOpenVirtualLab && (
          <button
            onClick={props.onOpenVirtualLab}
            className="flex items-center gap-3 p-3.5 rounded-2xl bg-gradient-to-r from-teal-50 to-emerald-50 dark:from-teal-950/40 dark:to-emerald-950/40 border border-teal-200 dark:border-teal-800/60 hover:shadow-md transition-all text-left group cursor-pointer"
          >
            <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform">
              <Atom size={20} />
            </div>
            <div className="flex-1 min-w-0">
              <strong className="block text-xs font-bold text-teal-900 dark:text-teal-200 truncate">Phòng Thí Nghiệm Ảo</strong>
              <small className="block text-[11px] text-teal-700/80 dark:text-teal-300/70 truncate">Con lắc, Parabol & pH</small>
            </div>
            <ArrowUpRight size={16} className="text-teal-500 opacity-60 group-hover:opacity-100 transition-opacity" />
          </button>
        )}

        {props.onOpenFlashcards && (
          <button
            onClick={props.onOpenFlashcards}
            className="flex items-center gap-3 p-3.5 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/40 dark:to-orange-950/40 border border-amber-200 dark:border-amber-800/60 hover:shadow-md transition-all text-left group cursor-pointer"
          >
            <div className="w-10 h-10 rounded-xl bg-amber-600 text-white flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform">
              <Brain size={20} />
            </div>
            <div className="flex-1 min-w-0">
              <strong className="block text-xs font-bold text-amber-900 dark:text-amber-200 truncate">Thẻ Flashcard SM-2</strong>
              <small className="block text-[11px] text-amber-700/80 dark:text-amber-300/70 truncate">Ghi nhớ ngắt quãng</small>
            </div>
            <ArrowUpRight size={16} className="text-amber-500 opacity-60 group-hover:opacity-100 transition-opacity" />
          </button>
        )}
      </div>
      <div className="home-columns">
        <section className="home-panel">
          <div className="home-panel-title"><span><BookOpen size={20} /> Hôm nay mình học gì?</span></div>
          <div className="home-selectors">
            <label>Môn học<select value={props.subject} onChange={e => props.onSubjectChange(e.target.value)}>{SUBJECT_OPTIONS.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></label>
            <label>Cấp / lớp học<select value={props.grade} onChange={e => props.onGradeChange(e.target.value)}>{GRADE_OPTIONS.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}</select></label>
          </div>
          <div className="home-starters">{props.starters.map((s, i) => <button key={s.subject} id={`starter-card-${i}`} onClick={() => props.onStarter(s.subject, s.prompt)}><s.icon size={22} /><span>{s.title}<small>Xem hướng dẫn cùng Anh Giáo AI</small></span><ArrowUpRight size={17} /></button>)}</div>
        </section>
        <div className="home-side">
          <section className="home-panel">
            <div className="home-panel-title"><span><Camera size={20} /> Đưa bài tập vào thật dễ</span></div>
            <div className="home-inputs">
              <button onClick={() => document.getElementById('image-file-input')?.click()}><Camera size={28} /><strong>Nhập ảnh bài tập</strong><small>Chọn ảnh để gửi cùng câu hỏi</small></button>
              <button onClick={() => document.getElementById('btn-voice-input')?.click()}><Mic size={28} /><strong>Đọc câu hỏi</strong><small>Nhập bằng giọng nói</small></button>
            </div>
          </section>
          <section className="home-panel home-recent">
            <div className="home-panel-title"><span><History size={19} /> Học gần đây</span><button onClick={props.onOpenHistory}>Xem tất cả</button></div>
            {recent.length ? recent.slice(0, 3).map(c => <button className="recent-row" key={c.id} onClick={() => props.onSelectConversation(c.id)}><span>{c.title}<small>{new Date(c.updatedAt).toLocaleDateString('vi-VN')}</small></span><ArrowUpRight size={17} /></button>) : <p className="home-empty">Bài học sẽ xuất hiện ở đây sau khi bạn gửi câu hỏi đầu tiên.</p>}
          </section>
          <button className="home-settings" onClick={props.onOpenSettings}><Settings size={17} /> Cài đặt API và kết nối học tập <ArrowUpRight size={16} /></button>
        </div>
      </div>
      <p className="home-credit">Phát triển bởi Thầy PHẠM QUỐC ĐẠT · Hiểu bản chất, nhớ lâu hơn.</p>
    </div>
  );
}
