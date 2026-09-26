import React, { useState, useEffect } from 'react';
import {
  X,
  Clock,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  Sparkles,
  Trophy,
  Award,
} from 'lucide-react';
import { ParsedExam, QuizQuestion, UserQuizAnswers, QuizResultSummary } from '../types';
import { MarkdownRenderer } from './MarkdownRenderer';

interface InteractiveQuizModalProps {
  isOpen: boolean;
  onClose: () => void;
  exam: ParsedExam | null;
  onToast: (msg: string) => void;
}

export const InteractiveQuizModal: React.FC<InteractiveQuizModalProps> = ({
  isOpen,
  onClose,
  exam,
  onToast,
}) => {
  const [answers, setAnswers] = useState<UserQuizAnswers>({
    part1: {},
    part2: {},
    part3: {},
  });

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [timeLeftSeconds, setTimeLeftSeconds] = useState<number>(45 * 60);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [scoreSummary, setScoreSummary] = useState<QuizResultSummary | null>(null);

  useEffect(() => {
    if (isOpen && exam) {
      setAnswers({ part1: {}, part2: {}, part3: {} });
      setCurrentQuestionIndex(0);
      setIsSubmitted(false);
      setScoreSummary(null);
      setTimeLeftSeconds(exam.duration * 60);
    }
  }, [isOpen, exam]);

  // Countdown Timer
  useEffect(() => {
    if (!isOpen || isSubmitted) return;

    const timer = setInterval(() => {
      setTimeLeftSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmitQuiz();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, isSubmitted]);

  if (!isOpen || !exam || exam.questions.length === 0) return null;

  const currentQ: QuizQuestion = exam.questions[currentQuestionIndex];

  // Thao tác chọn đáp án Phần I (A, B, C, D)
  const handleSelectPart1 = (qId: string, optionKey: string) => {
    if (isSubmitted) return;
    setAnswers((prev) => ({
      ...prev,
      part1: {
        ...prev.part1,
        [qId]: optionKey,
      },
    }));
  };

  // Thao tác chọn Đúng/Sai Phần II (a, b, c, d)
  const handleSelectPart2 = (qId: string, subKey: string, val: boolean) => {
    if (isSubmitted) return;
    setAnswers((prev) => ({
      ...prev,
      part2: {
        ...prev.part2,
        [qId]: {
          ...(prev.part2[qId] || {}),
          [subKey]: val,
        },
      },
    }));
  };

  // Thao tác nhập trả lời ngắn Phần III
  const handleSelectPart3 = (qId: string, text: string) => {
    if (isSubmitted) return;
    setAnswers((prev) => ({
      ...prev,
      part3: {
        ...prev.part3,
        [qId]: text,
      },
    }));
  };

  // Nộp bài và chấm điểm
  const handleSubmitQuiz = () => {
    let score = 0;
    let correct = 0;
    const totalQ = exam.questions.length;

    exam.questions.forEach((q) => {
      if (q.section === 'part1') {
        const userChoice = answers.part1[q.id];
        if (userChoice && userChoice.toUpperCase() === q.correctAnswer?.toUpperCase()) {
          score += 1;
          correct += 1;
        }
      } else if (q.section === 'part2') {
        // Đúng/Sai từng ý: 1 ý đúng 0.1đ, 2 ý 0.25đ, 3 ý 0.5đ, 4 ý 1.0đ
        const subAns = answers.part2[q.id] || {};
        let subCorrect = 0;
        q.subItems?.forEach((sub) => {
          if (subAns[sub.key] === sub.correctValue) {
            subCorrect += 1;
          }
        });
        if (subCorrect === 4) score += 1.0;
        else if (subCorrect === 3) score += 0.5;
        else if (subCorrect === 2) score += 0.25;
        else if (subCorrect === 1) score += 0.1;

        if (subCorrect >= 3) correct += 1;
      } else if (q.section === 'part3') {
        const userAns = answers.part3[q.id]?.trim().toLowerCase();
        const expected = q.shortAnswerExpected?.trim().toLowerCase();
        if (userAns && expected && (userAns === expected || userAns.includes(expected))) {
          score += 1;
          correct += 1;
        }
      }
    });

    const scaledScore = Math.min(10, Math.round(((score * 10) / Math.max(1, totalQ)) * 10) / 10);
    const timeSpent = exam.duration * 60 - timeLeftSeconds;

    setScoreSummary({
      totalScore: scaledScore,
      totalQuestions: totalQ,
      correctCount: correct,
      timeSpentSeconds: Math.max(1, timeSpent),
    });

    setIsSubmitted(true);
    onToast(`🎉 Đã nộp bài! Điểm số của em: ${scaledScore}/10.`);
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden text-slate-800 dark:text-slate-100">
        {/* Header với Đồng Hồ Đếm Ngược */}
        <div className="flex items-center justify-between px-6 py-3.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-600 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold tracking-tight text-slate-900 dark:text-white">
                {exam.title}
              </h2>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                {exam.subject} · {exam.grade} · {exam.questions.length} câu hỏi
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Đồng hồ đếm ngược */}
            <div
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-mono text-xs font-bold ${
                timeLeftSeconds < 300
                  ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 animate-pulse'
                  : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>{formatTime(timeLeftSeconds)}</span>
            </div>

            {!isSubmitted ? (
              <button
                onClick={handleSubmitQuiz}
                className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/30 cursor-pointer active:scale-95 transition-all"
              >
                Nộp bài
              </button>
            ) : (
              <button
                onClick={onClose}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Thẻ Kết Quả Điểm Số Nếu Đã Nộp Bài */}
        {isSubmitted && scoreSummary && (
          <div className="p-4 bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-transparent border-b border-emerald-500/20 flex flex-wrap items-center justify-between gap-4 px-6">
            <div className="flex items-center gap-3">
              <Award className="w-8 h-8 text-emerald-500" />
              <div>
                <span className="text-xs text-slate-500 block">KẾT QUẢ BÀI THI:</span>
                <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
                  {scoreSummary.totalScore} / 10 điểm
                </span>
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs font-medium text-slate-600 dark:text-slate-400">
              <span>Đúng: <strong>{scoreSummary.correctCount} / {scoreSummary.totalQuestions}</strong></span>
              <span>Thời gian làm: <strong>{Math.floor(scoreSummary.timeSpentSeconds / 60)}p {scoreSummary.timeSpentSeconds % 60}s</strong></span>
              <button
                onClick={() => {
                  setIsSubmitted(false);
                  setAnswers({ part1: {}, part2: {}, part3: {} });
                  setTimeLeftSeconds(exam.duration * 60);
                }}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-700 font-semibold"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Làm lại
              </button>
            </div>
          </div>
        )}

        {/* Nội dung câu hỏi */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6">
          <div className="max-w-2xl mx-auto space-y-6">
            {/* Header Câu Hỏi */}
            <div className="flex items-center justify-between">
              <span className="px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold">
                Câu {currentQ.number} / {exam.questions.length} (
                {currentQ.section === 'part1'
                  ? 'Phần I: Trắc nghiệm 4 lựa chọn'
                  : currentQ.section === 'part2'
                  ? 'Phần II: Đúng / Sai'
                  : 'Phần III: Trả lời ngắn'}
                )
              </span>

              {isSubmitted && (
                <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                  Đáp án chuẩn: {currentQ.correctAnswer || 'Xem hướng dẫn'}
                </span>
              )}
            </div>

            {/* Nội dung câu hỏi (Markdown + LaTeX) */}
            <div className="text-sm font-medium leading-relaxed bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
              <MarkdownRenderer content={currentQ.questionText} />
            </div>

            {/* PHẦN I: Trắc nghiệm 4 phương án A, B, C, D */}
            {currentQ.section === 'part1' && (
              <div className="space-y-2.5">
                {(currentQ.options && currentQ.options.length > 0
                  ? currentQ.options
                  : [
                      { key: 'A', text: 'Phương án A' },
                      { key: 'B', text: 'Phương án B' },
                      { key: 'C', text: 'Phương án C' },
                      { key: 'D', text: 'Phương án D' },
                    ]
                ).map((opt) => {
                  const isSelected = answers.part1[currentQ.id] === opt.key;
                  const isCorrect = isSubmitted && currentQ.correctAnswer === opt.key;
                  const isWrong = isSubmitted && isSelected && !isCorrect;

                  return (
                    <button
                      key={opt.key}
                      onClick={() => handleSelectPart1(currentQ.id, opt.key)}
                      disabled={isSubmitted}
                      className={`w-full text-left p-3.5 rounded-2xl border flex items-center gap-3 transition-all cursor-pointer ${
                        isCorrect
                          ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 font-bold'
                          : isWrong
                          ? 'border-rose-500 bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-200 line-through'
                          : isSelected
                          ? 'border-emerald-600 bg-emerald-50/80 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-100 font-semibold ring-1 ring-emerald-500'
                          : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900/60'
                      }`}
                    >
                      <span
                        className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                          isSelected ? 'bg-emerald-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        {opt.key}
                      </span>
                      <span className="text-xs sm:text-sm">{opt.text}</span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* PHẦN II: Trắc nghiệm Đúng / Sai từng ý a, b, c, d */}
            {currentQ.section === 'part2' && (
              <div className="space-y-3">
                <span className="text-xs text-slate-500 font-semibold block">
                  Chọn Đúng hoặc Sai cho từng ý:
                </span>
                {(currentQ.subItems && currentQ.subItems.length > 0
                  ? currentQ.subItems
                  : [
                      { key: 'a', text: 'Ý a', correctValue: true },
                      { key: 'b', text: 'Ý b', correctValue: false },
                      { key: 'c', text: 'Ý c', correctValue: true },
                      { key: 'd', text: 'Ý d', correctValue: false },
                    ]
                ).map((sub) => {
                  const currentSubVal = answers.part2[currentQ.id]?.[sub.key];

                  return (
                    <div
                      key={sub.key}
                      className="p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40 flex items-center justify-between gap-4"
                    >
                      <div className="flex items-start gap-2.5">
                        <span className="font-bold text-xs uppercase text-slate-600 dark:text-slate-400">
                          {sub.key})
                        </span>
                        <span className="text-xs sm:text-sm">{sub.text}</span>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleSelectPart2(currentQ.id, sub.key, true)}
                          disabled={isSubmitted}
                          className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                            currentSubVal === true
                              ? 'bg-emerald-600 text-white'
                              : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-400'
                          }`}
                        >
                          Đúng
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSelectPart2(currentQ.id, sub.key, false)}
                          disabled={isSubmitted}
                          className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                            currentSubVal === false
                              ? 'bg-rose-600 text-white'
                              : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-400'
                          }`}
                        >
                          Sai
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* PHẦN III: Trả lời ngắn */}
            {currentQ.section === 'part3' && (
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Nhập kết quả số hoặc đáp số ngắn:
                </label>
                <input
                  type="text"
                  disabled={isSubmitted}
                  value={answers.part3[currentQ.id] || ''}
                  onChange={(e) => handleSelectPart3(currentQ.id, e.target.value)}
                  placeholder="Ví dụ: 4.5, -2, 100..."
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-2.5 text-xs font-mono focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>
            )}

            {/* Lời giải giải thích khi đã nộp bài */}
            {isSubmitted && currentQ.explanation && (
              <div className="p-4 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs space-y-1">
                <span className="font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" /> Lời giải chi tiết:
                </span>
                <MarkdownRenderer content={currentQ.explanation} />
              </div>
            )}
          </div>
        </div>

        {/* Thanh Điều Hướng Dưới Cùng (Question Pagination Bar) */}
        <div className="px-6 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex items-center justify-between shrink-0">
          <button
            onClick={() => setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))}
            disabled={currentQuestionIndex === 0}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold disabled:opacity-30 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Câu trước
          </button>

          {/* Quick jump question circles */}
          <div className="flex items-center gap-1 overflow-x-auto max-w-xs sm:max-w-md py-1">
            {exam.questions.map((q, idx) => {
              const isAnswered =
                answers.part1[q.id] ||
                (answers.part2[q.id] && Object.keys(answers.part2[q.id]).length > 0) ||
                answers.part3[q.id];

              return (
                <button
                  key={q.id}
                  onClick={() => setCurrentQuestionIndex(idx)}
                  className={`w-6 h-6 rounded-lg text-[10px] font-bold shrink-0 transition-all cursor-pointer ${
                    currentQuestionIndex === idx
                      ? 'bg-emerald-600 text-white ring-2 ring-emerald-500/30'
                      : isAnswered
                      ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-semibold'
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>

          <button
            onClick={() => setCurrentQuestionIndex((prev) => Math.min(exam.questions.length - 1, prev + 1))}
            disabled={currentQuestionIndex >= exam.questions.length - 1}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold disabled:opacity-30 cursor-pointer"
          >
            Câu tiếp <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
