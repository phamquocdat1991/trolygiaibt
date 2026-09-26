import React, { useState, useEffect } from 'react';
import { X, Plus, RotateCw, Trash2, CheckCircle2, AlertCircle, BookOpen, Sparkles, Brain, ArrowLeft, ArrowRight } from 'lucide-react';
import { Flashcard } from '../types';
import { loadFlashcards, saveFlashcards, updateFlashcardReview, addFlashcard, deleteFlashcard } from '../lib/flashcardService';
import { MarkdownRenderer } from './MarkdownRenderer';
import { SUBJECT_OPTIONS } from '../lib/prompts';

interface FlashcardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onToast: (msg: string) => void;
}

export const FlashcardModal: React.FC<FlashcardModalProps> = ({ isOpen, onClose, onToast }) => {
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isFlipped, setIsFlipped] = useState<boolean>(false);
  const [isAddingNew, setIsAddingNew] = useState<boolean>(false);

  // New Card Form
  const [newFront, setNewFront] = useState('');
  const [newBack, setNewBack] = useState('');
  const [newSubject, setNewSubject] = useState('Toán học');

  useEffect(() => {
    if (isOpen) {
      setCards(loadFlashcards());
      setCurrentIndex(0);
      setIsFlipped(false);
      setIsAddingNew(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const filteredCards = selectedSubject === 'all'
    ? cards
    : cards.filter((c) => c.subject.toLowerCase().includes(selectedSubject.toLowerCase()));

  const currentCard = filteredCards[currentIndex];

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const handleNext = () => {
    if (currentIndex < filteredCards.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setIsFlipped(false);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setIsFlipped(false);
    }
  };

  const handleRate = (quality: 1 | 3 | 4 | 5) => {
    if (!currentCard) return;
    const updated = updateFlashcardReview(currentCard.id, quality);
    setCards(updated);
    setIsFlipped(false);

    const labels = {
      1: 'Đã lưu: Cần ôn lại ngay',
      3: 'Đã lưu: Đánh giá Khó',
      4: 'Đã lưu: Đánh giá Tốt (Hẹn 3 ngày)',
      5: 'Đã lưu: Đánh giá Dễ (Hẹn 5 ngày)',
    };
    onToast(labels[quality]);

    if (currentIndex < filteredCards.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      onToast('🎉 Chúc mừng em đã hoàn thành toàn bộ thẻ cần ôn tập!');
    }
  };

  const handleCreateCard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFront.trim() || !newBack.trim()) {
      onToast('Vui lòng nhập cả mặt trước (câu hỏi/công thức) và mặt sau (lời giải).');
      return;
    }

    const created = addFlashcard(newFront, newBack, newSubject);
    setCards(loadFlashcards());
    setNewFront('');
    setNewBack('');
    setIsAddingNew(false);
    onToast('Đã thêm thẻ ghi nhớ mới thành công!');
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Em có chắc chắn muốn xóa thẻ ghi nhớ này không?')) {
      const updated = deleteFlashcard(id);
      setCards(updated);
      if (currentIndex >= updated.length) {
        setCurrentIndex(Math.max(0, updated.length - 1));
      }
      onToast('Đã xóa thẻ ghi nhớ.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl max-h-[92vh] flex flex-col bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden text-slate-800 dark:text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center text-white shadow-md shadow-amber-500/20">
              <Brain className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
                Bộ Thẻ Ghi Nhớ Flashcard
                <span className="text-[11px] px-2 py-0.5 rounded-full font-semibold bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                  Thuật toán SM-2
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Lặp lại ngắt quãng (Spaced Repetition) giúp não bộ ghi nhớ vĩnh viễn công thức & định nghĩa
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsAddingNew(!isAddingNew)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-xs cursor-pointer transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              {isAddingNew ? 'Xem thẻ' : 'Thêm thẻ'}
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
              aria-label="Đóng"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filter Toolbar */}
        {!isAddingNew && (
          <div className="flex items-center justify-between px-6 py-2.5 border-b border-slate-200 dark:border-slate-800 bg-slate-100/50 dark:bg-slate-900/50 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-500">Môn học:</span>
              <select
                value={selectedSubject}
                onChange={(e) => {
                  setSelectedSubject(e.target.value);
                  setCurrentIndex(0);
                  setIsFlipped(false);
                }}
                className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1 text-xs focus:ring-1 focus:ring-emerald-500 outline-none"
              >
                <option value="all">Tất cả môn học ({cards.length})</option>
                <option value="Toán">Toán học</option>
                <option value="Vật lý">Vật lý</option>
                <option value="Hóa">Hóa học</option>
                <option value="Lịch sử">Lịch sử</option>
                <option value="Tiếng Anh">Tiếng Anh</option>
              </select>
            </div>

            <div className="text-slate-500 font-medium">
              Thẻ {filteredCards.length > 0 ? currentIndex + 1 : 0} / {filteredCards.length}
            </div>
          </div>
        )}

        {/* Body Container */}
        <div className="flex-1 overflow-y-auto p-6">
          {isAddingNew ? (
            /* Form Tạo Thẻ Mới */
            <form onSubmit={handleCreateCard} className="space-y-4 max-w-lg mx-auto">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                Tạo Thẻ Ghi Nhớ Mới
              </h3>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Môn học:
                </label>
                <select
                  value={newSubject}
                  onChange={(e) => setNewSubject(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                >
                  <option value="Toán học">Toán học</option>
                  <option value="Vật lý">Vật lý</option>
                  <option value="Hóa học">Hóa học</option>
                  <option value="Sinh học">Sinh học</option>
                  <option value="Lịch sử">Lịch sử</option>
                  <option value="Địa lý">Địa lý</option>
                  <option value="Tiếng Anh">Tiếng Anh</option>
                  <option value="Ngữ văn">Ngữ văn</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Mặt trước: Câu hỏi, thuật ngữ hoặc công thức cần nhớ (Hỗ trợ LaTeX $...$):
                </label>
                <textarea
                  rows={3}
                  value={newFront}
                  onChange={(e) => setNewFront(e.target.value)}
                  placeholder="Ví dụ: Công thức tính diện tích hình tròn bán kính R?"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-3 text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Mặt sau: Định nghĩa, lời giải hoặc đáp án chi tiết:
                </label>
                <textarea
                  rows={4}
                  value={newBack}
                  onChange={(e) => setNewBack(e.target.value)}
                  placeholder="Ví dụ: $$S = \pi R^2$$"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-3 text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddingNew(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/30 transition-all cursor-pointer"
                >
                  Lưu thẻ
                </button>
              </div>
            </form>
          ) : filteredCards.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-40" />
              <p className="text-sm font-semibold">Chưa có thẻ ghi nhớ nào trong mục này.</p>
              <button
                onClick={() => setIsAddingNew(true)}
                className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-semibold"
              >
                <Plus className="w-4 h-4" /> Tạo thẻ đầu tiên
              </button>
            </div>
          ) : (
            /* Hiển thị Thẻ Lật 3D */
            <div className="flex flex-col items-center max-w-xl mx-auto">
              <div
                onClick={handleFlip}
                className="w-full min-h-[260px] cursor-pointer relative select-none group [perspective:1000px]"
              >
                <div
                  className={`w-full min-h-[260px] p-6 sm:p-8 rounded-3xl border transition-all duration-500 [transform-style:preserve-3d] flex flex-col justify-between shadow-xl relative ${
                    isFlipped
                      ? 'bg-gradient-to-br from-emerald-950/60 to-slate-900 border-emerald-600/40 text-emerald-100'
                      : 'bg-gradient-to-br from-slate-900 to-slate-950 border-slate-700/80 text-white'
                  }`}
                >
                  {/* Top Bar of Card */}
                  <div className="flex items-center justify-between text-xs text-slate-400 mb-4">
                    <span className="px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 font-semibold text-[10px]">
                      {currentCard.subject} · {currentCard.grade}
                    </span>

                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-400 flex items-center gap-1">
                        <RotateCw className="w-3 h-3" />
                        {isFlipped ? 'Mặt sau (Lời giải)' : 'Mặt trước (Bấm để lật)'}
                      </span>
                      <button
                        onClick={(e) => handleDelete(currentCard.id, e)}
                        className="p-1 rounded-md text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-all"
                        title="Xóa thẻ này"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Card Main Content */}
                  <div className="my-auto py-2">
                    <MarkdownRenderer content={isFlipped ? currentCard.back : currentCard.front} />
                  </div>

                  {/* Bottom Indicator */}
                  <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                    <span>Lặp lại: {currentCard.repetitions} lần</span>
                    <span className="text-emerald-400 font-mono">Chu kỳ: {currentCard.interval} ngày</span>
                  </div>
                </div>
              </div>

              {/* Nút Điều Hướng Trái / Phải */}
              <div className="flex items-center justify-between w-full mt-4 px-2">
                <button
                  onClick={handlePrev}
                  disabled={currentIndex === 0}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 disabled:opacity-30 text-xs font-semibold cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Câu trước
                </button>

                <button
                  onClick={handleFlip}
                  className="px-4 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-bold hover:bg-slate-300 dark:hover:bg-slate-700 transition-all cursor-pointer"
                >
                  {isFlipped ? 'Xem lại đề bài' : 'Xem đáp án (Lật thẻ)'}
                </button>

                <button
                  onClick={handleNext}
                  disabled={currentIndex >= filteredCards.length - 1}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 disabled:opacity-30 text-xs font-semibold cursor-pointer"
                >
                  Câu tiếp <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* 4 Nút Đánh Giá SM-2 Khi Đã Lật Thẻ */}
              {isFlipped && (
                <div className="w-full mt-5 p-4 rounded-2xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <span className="block text-center text-xs font-bold text-slate-600 dark:text-slate-300 mb-3">
                    ĐÁNH GIÁ MỨC ĐỘ GHI NHỚ (THUẬT TOÁN SM-2):
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <button
                      onClick={() => handleRate(1)}
                      className="py-2 px-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs transition-all shadow-xs cursor-pointer flex flex-col items-center"
                    >
                      <span>🔁 Lại</span>
                      <small className="text-[10px] opacity-80">&lt; 1 phút</small>
                    </button>

                    <button
                      onClick={() => handleRate(3)}
                      className="py-2 px-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs transition-all shadow-xs cursor-pointer flex flex-col items-center"
                    >
                      <span>⚠️ Khó</span>
                      <small className="text-[10px] opacity-80">1 ngày</small>
                    </button>

                    <button
                      onClick={() => handleRate(4)}
                      className="py-2 px-3 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-semibold text-xs transition-all shadow-xs cursor-pointer flex flex-col items-center"
                    >
                      <span>👍 Tốt</span>
                      <small className="text-[10px] opacity-80">3 ngày</small>
                    </button>

                    <button
                      onClick={() => handleRate(5)}
                      className="py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-all shadow-xs cursor-pointer flex flex-col items-center"
                    >
                      <span>⭐ Dễ</span>
                      <small className="text-[10px] opacity-80">5 ngày</small>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
