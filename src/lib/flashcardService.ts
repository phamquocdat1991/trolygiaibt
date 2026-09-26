import { Flashcard } from '../types';

const FLASHCARD_STORAGE_KEY = 'anhgiao_flashcards_v1';

/**
 * Thuật toán SuperMemo 2 (SM-2) Spaced Repetition chuẩn quốc tế
 * @param card Thẻ hiện tại
 * @param quality Đánh giá của học sinh: 1 (Lại), 3 (Khó), 4 (Tốt), 5 (Dễ)
 */
export function calculateSM2(card: Flashcard, quality: 1 | 3 | 4 | 5): Flashcard {
  let { repetitions, interval, easeFactor } = card;

  if (quality < 3) {
    // Chưa thuộc: reset về bước đầu
    repetitions = 0;
    interval = 1;
  } else {
    // Đã thuộc
    if (repetitions === 0) {
      interval = 1;
    } else if (repetitions === 1) {
      interval = 6;
    } else {
      interval = Math.round(interval * easeFactor);
    }
    repetitions += 1;
  }

  // Cập nhật Ease Factor (EF)
  easeFactor = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  if (easeFactor < 1.3) {
    easeFactor = 1.3;
  }

  const nextReviewDate = Date.now() + interval * 24 * 60 * 60 * 1000;

  return {
    ...card,
    repetitions,
    interval,
    easeFactor: Math.round(easeFactor * 100) / 100,
    nextReviewDate,
  };
}

export function loadFlashcards(): Flashcard[] {
  try {
    const raw = localStorage.getItem(FLASHCARD_STORAGE_KEY);
    if (!raw) return getDefaultSampleFlashcards();
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : getDefaultSampleFlashcards();
  } catch {
    return getDefaultSampleFlashcards();
  }
}

export function saveFlashcards(cards: Flashcard[]): void {
  try {
    localStorage.setItem(FLASHCARD_STORAGE_KEY, JSON.stringify(cards));
  } catch (err) {
    console.warn('[Flashcard Save Error]:', err);
  }
}

export function addFlashcard(front: string, back: string, subject = 'Toán học', grade = 'Lớp 12'): Flashcard {
  const newCard: Flashcard = {
    id: `fc_${Date.now()}_${Math.random().toString(36).substring(7)}`,
    front: front.trim(),
    back: back.trim(),
    subject,
    grade,
    createdAt: Date.now(),
    repetitions: 0,
    interval: 1,
    easeFactor: 2.5,
    nextReviewDate: Date.now(),
  };

  const list = loadFlashcards();
  const updated = [newCard, ...list];
  saveFlashcards(updated);
  return newCard;
}

export function deleteFlashcard(id: string): Flashcard[] {
  const list = loadFlashcards().filter((c) => c.id !== id);
  saveFlashcards(list);
  return list;
}

export function updateFlashcardReview(id: string, quality: 1 | 3 | 4 | 5): Flashcard[] {
  const list = loadFlashcards();
  const updated = list.map((card) => {
    if (card.id === id) {
      return calculateSM2(card, quality);
    }
    return card;
  });
  saveFlashcards(updated);
  return updated;
}

/**
 * Thẻ ghi nhớ mẫu ban đầu phong phú đa môn theo chương trình GDPT 2018
 */
export function getDefaultSampleFlashcards(): Flashcard[] {
  const now = Date.now();
  return [
    {
      id: 'fc_sample_1',
      front: 'Công thức tính chu kỳ con lắc đơn dao động điều hòa góc nhỏ là gì?',
      back: '$$T = 2\\pi \\sqrt{\\frac{l}{g}}$$\nTrong đó:\n- $l$: chiều dài dây treo (m)\n- $g$: gia tốc trọng trường ($m/s^2$)\n- Chu kỳ $T$ chỉ phụ thuộc $l$ và $g$, KHÔNG phụ thuộc khối lượng vật $m$.',
      subject: 'Vật lý',
      grade: 'Lớp 12',
      createdAt: now - 86400000 * 2,
      repetitions: 2,
      interval: 3,
      easeFactor: 2.5,
      nextReviewDate: now,
    },
    {
      id: 'fc_sample_2',
      front: 'Tọa độ đỉnh $I$ và trục đối xứng của đồ thị Parabol $y = ax^2 + bx + c$ ($a \\neq 0$)?',
      back: 'Tọa độ đỉnh:\n$$I\\left(-\\frac{b}{2a}; -\\frac{\\Delta}{4a}\\right)$$\nTrục đối xứng:\n$$x = -\\frac{b}{2a}$$\nVới $\\Delta = b^2 - 4ac$.',
      subject: 'Toán học',
      grade: 'Lớp 10',
      createdAt: now - 86400000,
      repetitions: 1,
      interval: 1,
      easeFactor: 2.5,
      nextReviewDate: now,
    },
    {
      id: 'fc_sample_3',
      front: 'Chất chỉ thị Phenolphthalein đổi sang màu gì trong môi trường Axit, Trung tính và Bazơ?',
      back: '- Môi trường Axit ($pH < 7$): **Không màu**\n- Môi trường Trung tính ($pH = 7$): **Không màu**\n- Môi trường Bazơ ($pH \\ge 8.3$): **Chuyển sang màu hồng cánh sen rực rỡ**.',
      subject: 'Hóa học',
      grade: 'Lớp 11',
      createdAt: now,
      repetitions: 0,
      interval: 1,
      easeFactor: 2.5,
      nextReviewDate: now,
    },
    {
      id: 'fc_sample_4',
      front: 'Chiến dịch Điện Biên Phủ diễn ra trong bao nhiêu ngày đêm? Thời gian bắt đầu và kết thúc?',
      back: 'Chiến dịch Điện Biên Phủ diễn ra trong **56 ngày đêm** "khoét núi, ngủ hầm, mưa dầm, cơm vắt":\n- Bắt đầu: Ngày **13/03/1954**\n- Toàn thắng: Chiều ngày **07/05/1954**\n- "Lừng lẫy năm châu, chấn động địa cầu".',
      subject: 'Lịch sử',
      grade: 'Lớp 12',
      createdAt: now,
      repetitions: 0,
      interval: 1,
      easeFactor: 2.5,
      nextReviewDate: now,
    },
    {
      id: 'fc_sample_5',
      front: 'Quy tắc chia thì Quá khứ hoàn thành (Past Perfect)?',
      back: 'Công thức:\n$$S + \\text{had} + V_{3/ed}$$\nCách dùng: Diễn tả một hành động xảy ra và hoàn tất trước một thời điểm hoặc một hành động khác trong quá khứ.\n*Ví dụ:* By the time I arrived, the train had left.',
      subject: 'Tiếng Anh',
      grade: 'Lớp 12',
      createdAt: now,
      repetitions: 0,
      interval: 1,
      easeFactor: 2.5,
      nextReviewDate: now,
    },
  ];
}
