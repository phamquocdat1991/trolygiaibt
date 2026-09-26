import React, { useState } from 'react';
import {
  X,
  Sparkles,
  FileText,
  Play,
  Download,
  Copy,
  Check,
  RotateCcw,
  BookOpen,
  GraduationCap,
  Clock,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { ExamConfig, ExamType, ParsedExam, UserSettings } from '../types';
import { buildExamPrompt, parseExamQuestions } from '../lib/examService';
import { generateTextContent } from '../lib/aiService';
import { exportExamToWord } from '../lib/docxExport';
import { MarkdownRenderer } from './MarkdownRenderer';
import { SUBJECT_OPTIONS, GRADE_OPTIONS } from '../lib/prompts';

interface ExamGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: UserSettings;
  onStartQuiz: (exam: ParsedExam) => void;
  onToast: (msg: string) => void;
}

export const ExamGeneratorModal: React.FC<ExamGeneratorModalProps> = ({
  isOpen,
  onClose,
  settings,
  onStartQuiz,
  onToast,
}) => {
  const [config, setConfig] = useState<ExamConfig>({
    subject: settings.defaultSubject !== 'auto' ? settings.defaultSubject : 'math',
    grade: settings.defaultGrade !== 'all' ? settings.defaultGrade : 'grade-12',
    examType: '45min',
    durationMinutes: 45,
    topic: 'Khảo sát hàm số và ứng dụng đạo hàm',
    cognitiveLevel: 'advanced',
  });

  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generatedExamText, setGeneratedExamText] = useState<string>('');
  const [parsedExam, setParsedExam] = useState<ParsedExam | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleTypeChange = (type: ExamType) => {
    let duration = 45;
    if (type === '15min') duration = 15;
    else if (type === 'national_exam' || type === 'semester') duration = 90;

    setConfig((prev) => ({
      ...prev,
      examType: type,
      durationMinutes: duration,
    }));
  };

  const handleGenerateExam = async (e: React.FormEvent) => {
    e.preventDefault();

    const activeKey = settings.apiKey?.trim();
    if (!activeKey) {
      onToast('Vui lòng mở Cài đặt để nhập Gemini API Key trước khi tạo đề thi nhé.');
      return;
    }

    setIsGenerating(true);
    setGeneratedExamText('');
    setParsedExam(null);

    try {
      const { prompt, systemPrompt } = buildExamPrompt(config);

      const result = await generateTextContent({
        apiKey: activeKey,
        provider: settings.provider,
        model: settings.model || 'gemini-3.8-flash',
        prompt,
        systemPrompt,
        onModelFallback: (fromModel, toModel) => {
          onToast(`Mô hình ${fromModel} đang bận, tự động chuyển sang ${toModel} để tạo đề...`);
        },
      });

      if (result && result.text) {
        setGeneratedExamText(result.text);
        const parsed = parseExamQuestions(result.text, config);
        setParsedExam(parsed);
        onToast('Đã biên soạn đề thi thành công theo chuẩn Công văn 7991/BGDĐT!');
      } else {
        onToast('Không nhận được nội dung từ AI. Em hãy thử lại nhé.');
      }
    } catch (err: unknown) {
      console.error('[Exam Gen Error]:', err);
      const msg = err instanceof Error ? err.message : String(err);
      onToast(`Lỗi khi tạo đề: ${msg}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExportWord = () => {
    if (!generatedExamText) return;
    const subName = SUBJECT_OPTIONS.find((s) => s.id === config.subject)?.name || 'MonHoc';
    const grName = GRADE_OPTIONS.find((g) => g.id === config.grade)?.name || 'Lop12';
    exportExamToWord(`Đề thi ${subName} ${grName}`, generatedExamText, subName, grName);
    onToast('Đã xuất đề thi ra tệp Word (.doc) chuẩn thể thức Bộ GD&ĐT!');
  };

  const handleCopy = () => {
    if (!generatedExamText) return;
    navigator.clipboard.writeText(generatedExamText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    onToast('Đã sao chép nội dung đề thi vào bộ nhớ tạm.');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden text-slate-800 dark:text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
                Trợ Lý Tạo Đề Thi GDPT 2018
                <span className="text-[11px] px-2 py-0.5 rounded-full font-semibold bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-800">
                  Công văn 7991/BGDĐT
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Tự động sinh đề 4 phần chuẩn: Trắc nghiệm 4 lựa chọn, Đúng/Sai, Trả lời ngắn & Tự luận kèm ma trận điểm
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
            aria-label="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6">
          {!generatedExamText ? (
            /* Form Thiết Kế Đề Thi */
            <form onSubmit={handleGenerateExam} className="max-w-2xl mx-auto space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Môn học:
                  </label>
                  <select
                    value={config.subject}
                    onChange={(e) => setConfig({ ...config, subject: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2.5 text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    {SUBJECT_OPTIONS.filter((s) => s.id !== 'auto').map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Cấp học / Lớp:
                  </label>
                  <select
                    value={config.grade}
                    onChange={(e) => setConfig({ ...config, grade: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2.5 text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    {GRADE_OPTIONS.filter((g) => g.id !== 'all').map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Loại đề kiểm tra */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Hình thức đề kiểm tra:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: '15min', label: '15 Phút', desc: 'Kiểm tra nhanh' },
                    { id: '45min', label: '1 Tiết (45p)', desc: 'Kiểm tra định kỳ' },
                    { id: 'semester', label: 'Cuối Học Kỳ', desc: 'Thi học kỳ' },
                    { id: 'national_exam', label: 'Thi Thử THPT', desc: 'ĐGNL / Tốt nghiệp' },
                  ].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => handleTypeChange(t.id as ExamType)}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        config.examType === t.id
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-bold ring-1 ring-blue-500'
                          : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <span className="block text-xs">{t.label}</span>
                      <span className="block text-[10px] text-slate-500 dark:text-slate-400 font-normal">
                        {t.desc}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Chủ đề hoặc nội dung trọng tâm */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Chủ đề / Bài học / Nội dung trọng tâm cần kiểm tra:
                </label>
                <input
                  type="text"
                  value={config.topic}
                  onChange={(e) => setConfig({ ...config, topic: e.target.value })}
                  placeholder="Ví dụ: Este - Lipit, Khảo sát hàm số, Chiến dịch Điện Biên Phủ, Thì tương lai..."
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2.5 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              {/* Mức độ nhận thức */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Mức độ nhận thức:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setConfig({ ...config, cognitiveLevel: 'standard' })}
                    className={`py-2 px-3 rounded-xl border text-xs text-center transition-all ${
                      config.cognitiveLevel === 'standard'
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-bold'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    Chuẩn cơ bản (1-6 điểm)
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfig({ ...config, cognitiveLevel: 'advanced' })}
                    className={`py-2 px-3 rounded-xl border text-xs text-center transition-all ${
                      config.cognitiveLevel === 'advanced'
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-bold'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    Vận dụng cao (7-9 điểm)
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfig({ ...config, cognitiveLevel: 'olympic' })}
                    className={`py-2 px-3 rounded-xl border text-xs text-center transition-all ${
                      config.cognitiveLevel === 'olympic'
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-bold'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    Học sinh giỏi (9-10 điểm)
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-3">
                <button
                  type="submit"
                  disabled={isGenerating}
                  className="w-full flex items-center justify-center gap-2 py-3 px-6 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-blue-500/25 active:scale-98 transition-all cursor-pointer disabled:opacity-60"
                >
                  {isGenerating ? (
                    <>
                      <RotateCcw className="w-4 h-4 animate-spin" />
                      <span>Đang biên soạn đề thi chuẩn CV 7991 (Vui lòng đợi vài giây)...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Biên Soạn Đề Thi Ngay (Gemini 3.8 Flash)</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            /* Hiển thị Kết quả Đề Thi Đã Sinh */
            <div className="space-y-4">
              {/* Thanh Công Cụ Thao Tác (Actions Toolbar) */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Đã tạo: {parsedExam?.title || 'Đề thi GDPT 2018'}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-semibold">
                    {parsedExam?.questions.length || 0} câu hỏi trắc nghiệm
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {/* Nút Luyện Đề Trực Tiếp */}
                  {parsedExam && parsedExam.questions.length > 0 && (
                    <button
                      onClick={() => {
                        onStartQuiz(parsedExam);
                        onClose();
                      }}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-600/30 active:scale-95 transition-all cursor-pointer"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      Luyện Đề Ngay
                    </button>
                  )}

                  {/* Nút Xuất Tệp Word .docx */}
                  <button
                    onClick={handleExportWord}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-xs active:scale-95 transition-all cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Xuất File Word (.doc)
                  </button>

                  {/* Nút Sao Chép */}
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold hover:bg-slate-300 dark:hover:bg-slate-600 transition-all cursor-pointer"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? 'Đã chép' : 'Sao chép'}
                  </button>

                  {/* Nút Tạo Đề Khác */}
                  <button
                    onClick={() => setGeneratedExamText('')}
                    className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all cursor-pointer"
                    title="Tạo đề khác"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Khung hiển thị nội dung đề thi */}
              <div className="p-6 rounded-3xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 overflow-x-auto text-sm leading-relaxed">
                <MarkdownRenderer content={generatedExamText} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
