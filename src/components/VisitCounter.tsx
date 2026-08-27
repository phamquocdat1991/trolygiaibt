import React, { useState, useEffect } from 'react';
import { Eye, Flame, UserCheck } from 'lucide-react';

// ============================================
// CẤU HÌNH THEO CHUẨN visit.md
// ============================================
const APP_NAMESPACE = 'anhgiaoai-edugenvn';
const BASE_VISIT_OFFSET = 1850;
const COUNTER_API_URL = `https://api.counterapi.dev/v1/${APP_NAMESPACE}/visits/up`;

// Keys localStorage
const VISIT_STORAGE_KEY = `${APP_NAMESPACE}_my_visits`;
const LAST_VISIT_KEY = `${APP_NAMESPACE}_last_visit_time`;
const FALLBACK_KEY = `${APP_NAMESPACE}_total_fallback`;

const getToday = (): string => new Date().toISOString().split('T')[0];

interface VisitData {
  myVisits: number;
  totalVisits: number;
  todayVisits: number;
}

/** Tăng lượt cá nhân trên thiết bị này */
const incrementLocalVisits = (): { myVisits: number; todayVisits: number } => {
  const today = getToday();
  const todayKey = `${APP_NAMESPACE}_today_${today}`;

  try {
    const myVisits = parseInt(localStorage.getItem(VISIT_STORAGE_KEY) || '0', 10) + 1;
    localStorage.setItem(VISIT_STORAGE_KEY, String(myVisits));

    const lastDate = localStorage.getItem(LAST_VISIT_KEY) || '';
    const prevToday = lastDate === today ? parseInt(localStorage.getItem(todayKey) || '0', 10) : 0;
    const todayVisits = prevToday + 1;
    localStorage.setItem(todayKey, String(todayVisits));
    localStorage.setItem(LAST_VISIT_KEY, today);

    // Dọn dẹp ngày hôm trước
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    localStorage.removeItem(`${APP_NAMESPACE}_today_${yesterday}`);

    return { myVisits, todayVisits };
  } catch {
    return { myVisits: 1, todayVisits: 1 };
  }
};

/** Gọi API server-side counterapi.dev để đếm tổng số thực */
const fetchServerVisitCount = async (): Promise<number> => {
  try {
    const response = await fetch(COUNTER_API_URL);
    if (response.ok) {
      const data = await response.json();
      if (data && typeof data.count === 'number') {
        const count = BASE_VISIT_OFFSET + data.count;
        localStorage.setItem(FALLBACK_KEY, String(count));
        return count;
      }
    }
  } catch (error) {
    console.warn('[Visit Counter API Info] Sử dụng bộ đếm cục bộ dự phòng:', error);
  }

  // Fallback an toàn khi API không phản hồi
  const fallback = parseInt(localStorage.getItem(FALLBACK_KEY) || String(BASE_VISIT_OFFSET), 10);
  const newFallback = fallback + Math.floor(Math.random() * 2) + 1;
  localStorage.setItem(FALLBACK_KEY, String(newFallback));
  return newFallback;
};

/** Hiệu ứng đếm số mượt mà */
export const AnimatedNumber: React.FC<{ value: number; duration?: number }> = ({
  value,
  duration = 800,
}) => {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (value === 0) return;
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      setDisplay(Math.floor(value * eased));

      if (progress < 1) requestAnimationFrame(animate);
    };

    requestAnimationFrame(animate);
  }, [value, duration]);

  return <>{display.toLocaleString('vi-VN')}</>;
};

export const VisitCounter: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const [visitData, setVisitData] = useState<VisitData>({
    myVisits: 0,
    totalVisits: 0,
    todayVisits: 0,
  });
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Tránh đếm lặp trong React StrictMode
    const timer = setTimeout(async () => {
      const localData = incrementLocalVisits();
      const totalVisits = await fetchServerVisitCount();
      setVisitData({ ...localData, totalVisits });
      setIsLoaded(true);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  if (!isLoaded) return null;

  if (compact) {
    return (
      <div
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/80 dark:border-emerald-800 text-[11px] text-emerald-800 dark:text-emerald-300 shadow-2xs"
        title={`Tổng lượt học toàn quốc: ${visitData.totalVisits.toLocaleString('vi-VN')} | Hôm nay: ${visitData.todayVisits} | Của em: ${visitData.myVisits}`}
      >
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </span>
        <span className="font-bold text-slate-900 dark:text-white">
          <AnimatedNumber value={visitData.totalVisits} />
        </span>
        <span className="hidden sm:inline text-slate-500 dark:text-slate-400">lượt truy cập</span>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center gap-2 flex-wrap text-xs">
      {/* Tổng lượt truy cập toàn quốc */}
      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-teal-500/40 bg-teal-50 dark:bg-teal-950/50 text-teal-800 dark:text-teal-200 backdrop-blur-xs">
        <span className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
        </span>
        <span className="flex items-center gap-1">
          <Eye className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
          <span>Tổng:</span>
          <span className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm">
            <AnimatedNumber value={visitData.totalVisits} />
          </span>
          <span>lượt</span>
        </span>
      </div>

      {/* Hôm nay */}
      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-amber-500/30 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-200">
        <Flame className="w-3.5 h-3.5 text-amber-500" />
        <span>Hôm nay:</span>
        <span className="font-bold text-amber-900 dark:text-amber-100">
          <AnimatedNumber value={visitData.todayVisits} duration={600} />
        </span>
      </div>

      {/* Của bạn */}
      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-sky-500/30 bg-sky-50 dark:bg-sky-950/40 text-sky-800 dark:text-sky-200">
        <UserCheck className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
        <span>Em:</span>
        <span className="font-bold text-sky-900 dark:text-sky-100">
          <AnimatedNumber value={visitData.myVisits} duration={600} />
        </span>
        <span>lần</span>
      </div>
    </div>
  );
};
