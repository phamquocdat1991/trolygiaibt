import { ExamConfig, ParsedExam, QuizQuestion } from '../types';
import { SUBJECT_OPTIONS, GRADE_OPTIONS } from './prompts';

/**
 * Xây dựng câu lệnh Prompt tối ưu cho AI để sinh đề thi chuẩn Công văn 7991/BGDĐT
 */
export function buildExamPrompt(config: ExamConfig): { prompt: string; systemPrompt: string } {
  const subjectName = SUBJECT_OPTIONS.find((s) => s.id === config.subject)?.name || 'Toán học';
  const gradeName = GRADE_OPTIONS.find((g) => g.id === config.grade)?.name || 'Lớp 12';

  const typeLabel =
    config.examType === '15min'
      ? 'ĐỀ KIỂM TRA 15 PHÚT'
      : config.examType === '45min'
      ? 'ĐỀ KIỂM TRA 1 TIẾT (45 PHÚT)'
      : config.examType === 'midterm'
      ? 'ĐỀ KIỂM TRA GIỮA HỌC KỲ'
      : config.examType === 'semester'
      ? 'ĐỀ KIỂM TRA CUỐI HỌC KỲ'
      : 'ĐỀ THI THỬ TỐT NGHIỆP THPT & ĐÁNH GIÁ NĂNG LỰC';

  const systemPrompt = `Bạn là Chuyên gia Khảo thí và Đo lường Giáo dục hàng đầu thuộc Bộ Giáo dục và Đào tạo Việt Nam.
Nhiệm vụ của bạn là biên soạn đề kiểm tra / đề thi chất lượng cao, chuẩn mực 100% theo Chương trình Giáo dục Phổ thông 2018 (GDPT 2018) và định dạng cấu trúc đề thi mới nhất theo Công văn số 7991/BGDĐT-GDTrH.

Quy định bắt buộc về cấu trúc đề:
1. Đề thi phải phân định rõ ràng 4 PHẦN CHUẨN:
   - **PHẦN I: CÂU HỎI TRẮC NGHIỆM NHIỀU PHƯƠNG ÁN LỰA CHỌN** (Thí sinh chọn 1 phương án đúng trong 4 phương án A, B, C, D).
   - **PHẦN II: CÂU HỎI TRẮC NGHIỆM ĐÚNG/SAI** (Mỗi câu có lệnh hỏi và 4 ý a), b), c), d). Thí sinh chọn Đúng hoặc Sai cho từng ý).
   - **PHẦN III: CÂU HỎI TRẮC NGHIỆM TRẢ LỜI NGẮN** (Thí sinh tự điền đáp án ngắn, số liệu hoặc giá trị cụ thể).
   - **PHẦN IV: CÂU HỎI TỰ LUẬN / BÀI TOÁN THỰC TẾ** (Lời giải chi tiết logic, ứng dụng đời sống).
2. Kèm theo **MA TRẬN ĐỀ THI** (Nhận biết, Thông hiểu, Vận dụng, Vận dụng cao).
3. Kèm theo **BẢNG ĐÁP ÁN VÀ THANG ĐIỂM 10 CHI TIẾT** theo quy chế chấm điểm thi tốt nghiệp.
4. Công thức toán học và khoa học BẮT BUỘC viết bằng ký hiệu LaTeX chuẩn ($công_thức$).`;

  const prompt = `Hãy soạn một ${typeLabel} hoàn chỉnh:
- **Môn học:** ${subjectName}
- **Cấp học / Khối lớp:** ${gradeName}
- **Thời gian làm bài:** ${config.durationMinutes} phút
- **Chủ đề / Yêu cầu trọng tâm:** ${config.topic || 'Kiến thức trọng tâm theo chương trình học hiện hành'}
- **Mức độ nhận thức:** ${config.cognitiveLevel === 'olympic' ? 'Phân hóa cao / Bồi dưỡng học sinh giỏi' : config.cognitiveLevel === 'advanced' ? 'Vận dụng và Vận dụng cao' : 'Chuẩn kiến thức kỹ năng phổ thông'}

CẤU TRÚC CHI TIẾT CẦN TRÌNH BÀY:
# SỞ GD&ĐT ... - TRƯỜNG THPT ...
## ${typeLabel} - NĂM HỌC 2025 - 2026
**Môn:** ${subjectName} | **Lớp:** ${gradeName} | **Thời gian:** ${config.durationMinutes} phút (không kể thời gian phát đề)

---

### PHẦN I. CÂU HỎI TRẮC NGHIỆM NHIỀU LỰA CHỌN
(Thí sinh trả lời từ câu 1 đến câu ${config.examType === '15min' ? '4' : '12'}. Mỗi câu hỏi chỉ chọn một phương án).
[Soạn các câu hỏi có đủ 4 phương án A, B, C, D]

### PHẦN II. CÂU HỎI TRẮC NGHIỆM ĐÚNG/SAI
(Thí sinh trả lời từ câu 1 đến câu ${config.examType === '15min' ? '1' : '4'}. Trong mỗi ý a), b), c), d) ở mỗi câu, thí sinh chọn đúng hoặc sai).
[Soạn các câu hỏi Đúng/Sai có đủ 4 ý a, b, c, d]

### PHẦN III. CÂU HỎI TRẮC NGHIỆM TRẢ LỜI NGẮN
(Thí sinh trả lời từ câu 1 đến câu ${config.examType === '15min' ? '2' : '6'}. Điền kết quả số hoặc đáp số ngắn gọn).
[Soạn các câu hỏi yêu cầu tính toán ra số cụ thể]

### PHẦN IV. CÂU HỎI TỰ LUẬN
[Soạn bài toán vận dụng thực tế hoặc phân tích lập luận sâu sắc]

---

### BẢNG MA TRẬN ĐỀ THI VÀ ĐÁP ÁN CHI TIẾT
1. **Bảng đáp án Phần I:** (Câu - Đáp án đúng - Giải thích ngắn)
2. **Bảng đáp án Phần II:** (Câu - Ý a, b, c, d Đúng hay Sai - Giải thích)
3. **Bảng đáp án Phần III:** (Câu - Giá trị đáp số)
4. **Hướng dẫn chấm Phần IV:** (Phân bổ barem điểm từng bước trên thang điểm 10).`;

  return { prompt, systemPrompt };
}

/**
 * Tự động bóc tách các câu hỏi trắc nghiệm từ văn bản đề thi Markdown để đưa vào Quiz Runner
 */
export function parseExamQuestions(rawContent: string, config: ExamConfig): ParsedExam {
  const questions: QuizQuestion[] = [];
  const lines = rawContent.split('\n');

  let currentSection: 'part1' | 'part2' | 'part3' | 'part4' = 'part1';
  let currentQ: Partial<QuizQuestion> | null = null;
  let qNumber = 1;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    if (line.includes('PHẦN I') || line.includes('Phần I') || line.includes('PHẦN 1')) {
      currentSection = 'part1';
      continue;
    } else if (line.includes('PHẦN II') || line.includes('Phần II') || line.includes('PHẦN 2')) {
      if (currentQ && currentQ.questionText) {
        questions.push(finalizeQuestion(currentQ, questions.length + 1));
        currentQ = null;
      }
      currentSection = 'part2';
      continue;
    } else if (line.includes('PHẦN III') || line.includes('Phần III') || line.includes('PHẦN 3')) {
      if (currentQ && currentQ.questionText) {
        questions.push(finalizeQuestion(currentQ, questions.length + 1));
        currentQ = null;
      }
      currentSection = 'part3';
      continue;
    } else if (line.includes('PHẦN IV') || line.includes('Phần IV') || line.includes('BẢNG ĐÁP ÁN') || line.includes('ĐÁP ÁN')) {
      if (currentQ && currentQ.questionText) {
        questions.push(finalizeQuestion(currentQ, questions.length + 1));
        currentQ = null;
      }
      currentSection = 'part4';
      if (line.includes('ĐÁP ÁN') || line.includes('BẢNG MA TRẬN')) break;
      continue;
    }

    // Phát hiện bắt đầu câu hỏi mới: "Câu 1:", "**Câu 1:**", "Câu 1.", "1."
    const matchQuestion = line.match(/^(?:\*\*|\*|#+\s*)?(?:Câu|Bài)\s*(\d+)[\s.:]+(.*)/i);
    if (matchQuestion) {
      if (currentQ && currentQ.questionText) {
        questions.push(finalizeQuestion(currentQ, questions.length + 1));
      }

      currentQ = {
        id: `q_${Date.now()}_${questions.length + 1}`,
        number: parseInt(matchQuestion[1], 10) || qNumber++,
        section: currentSection,
        questionText: matchQuestion[2].replace(/\*\*$/, '').trim(),
        options: [],
        subItems: [],
      };
      continue;
    }

    if (!currentQ) continue;

    // Nếu đang ở Phần I: Tìm lựa chọn A, B, C, D
    if (currentSection === 'part1') {
      const matchOpt = line.match(/^(?:[A-D][.)]|(?:\*\*)?[A-D][.)](?:\*\*))\s*(.*)/i);
      if (matchOpt) {
        const keyLetter = line.trim().substring(0, 2).replace(/[^\w]/g, '').toUpperCase() as 'A' | 'B' | 'C' | 'D';
        if (!currentQ.options) currentQ.options = [];
        currentQ.options.push({
          key: keyLetter,
          text: matchOpt[1].trim(),
        });
        continue;
      }
    }

    // Nếu đang ở Phần II: Tìm các ý a), b), c), d)
    if (currentSection === 'part2') {
      const matchSub = line.match(/^(?:[a-d][.)]|(?:\*\*)?[a-d][.)](?:\*\*))\s*(.*)/i);
      if (matchSub) {
        const keyLetter = line.trim().substring(0, 2).replace(/[^\w]/g, '').toLowerCase() as 'a' | 'b' | 'c' | 'd';
        if (!currentQ.subItems) currentQ.subItems = [];
        currentQ.subItems.push({
          key: keyLetter,
          text: matchSub[1].trim(),
          correctValue: true, // Mặc định true, sẽ được đối chiếu bảng đáp án
        });
        continue;
      }
    }

    // Ghép thêm dòng mô tả câu hỏi
    if (!line.startsWith('A.') && !line.startsWith('B.') && !line.startsWith('C.') && !line.startsWith('D.') && !line.startsWith('a)') && !line.startsWith('b)')) {
      if (currentQ.questionText) {
        currentQ.questionText += '\n' + line;
      }
    }
  }

  if (currentQ && currentQ.questionText) {
    questions.push(finalizeQuestion(currentQ, questions.length + 1));
  }

  // Tự động phân tích bảng đáp án để gán correctAnswer
  parseAnswerKeyFromText(rawContent, questions);

  const subjectItem = SUBJECT_OPTIONS.find((s) => s.id === config.subject)?.name || 'Toán học';
  const gradeItem = GRADE_OPTIONS.find((g) => g.id === config.grade)?.name || 'Lớp 12';

  return {
    title: `Đề thi ${subjectItem} - ${gradeItem}`,
    grade: gradeItem,
    subject: subjectItem,
    duration: config.durationMinutes,
    rawContent,
    questions,
  };
}

function finalizeQuestion(q: Partial<QuizQuestion>, fallbackNum: number): QuizQuestion {
  return {
    id: q.id || `q_${Date.now()}_${fallbackNum}`,
    number: q.number || fallbackNum,
    section: q.section || 'part1',
    questionText: q.questionText || '',
    options: q.options || [],
    subItems: q.subItems || [],
    shortAnswerExpected: q.shortAnswerExpected || '',
    correctAnswer: q.correctAnswer || (q.options && q.options[0]?.key) || 'A',
    explanation: q.explanation || 'Xem hướng dẫn chi tiết trong bảng đáp án của đề thi.',
  };
}

function parseAnswerKeyFromText(raw: string, questions: QuizQuestion[]): void {
  // Tìm các đoạn dạng: "Câu 1: A", "1. A", "Câu 2: B"
  const answersMatches = raw.matchAll(/(?:Câu|Bài)\s*(\d+)[\s.:]+([A-D])/gi);
  for (const m of answersMatches) {
    const qNum = parseInt(m[1], 10);
    const ans = m[2].toUpperCase();
    const q = questions.find((item) => item.number === qNum && item.section === 'part1');
    if (q) {
      q.correctAnswer = ans;
    }
  }
}
