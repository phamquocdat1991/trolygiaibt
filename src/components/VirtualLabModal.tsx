import React, { useState, useEffect, useRef } from 'react';
import { X, Play, Pause, RotateCcw, Sparkles, Atom, Calculator, FlaskConical, Info, HelpCircle } from 'lucide-react';

interface VirtualLabModalProps {
  isOpen: boolean;
  onClose: () => void;
  onToast: (msg: string) => void;
}

export const VirtualLabModal: React.FC<VirtualLabModalProps> = ({ isOpen, onClose, onToast }) => {
  const [activeTab, setActiveTab] = useState<'pendulum' | 'parabola' | 'titration'>('pendulum');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden text-slate-800 dark:text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
                Phòng Thí Nghiệm Ảo
                <span className="text-[11px] px-2 py-0.5 rounded-full font-semibold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                  Mô phỏng Khoa học
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Khám phá bản chất Vật lý, Toán học và Hóa học qua mô phỏng trực quan tương tác
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

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 px-6 bg-slate-100/50 dark:bg-slate-900/50 shrink-0 gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('pendulum')}
            className={`flex items-center gap-2 py-3 px-4 font-semibold text-xs border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'pendulum'
                ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Atom className="w-4 h-4" />
            Vật lý: Con lắc đơn
          </button>

          <button
            onClick={() => setActiveTab('parabola')}
            className={`flex items-center gap-2 py-3 px-4 font-semibold text-xs border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'parabola'
                ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Calculator className="w-4 h-4" />
            Toán học: Đồ thị Parabol
          </button>

          <button
            onClick={() => setActiveTab('titration')}
            className={`flex items-center gap-2 py-3 px-4 font-semibold text-xs border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'titration'
                ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <FlaskConical className="w-4 h-4" />
            Hóa học: Chuẩn độ pH
          </button>
        </div>

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6">
          {activeTab === 'pendulum' && <PendulumLab onToast={onToast} />}
          {activeTab === 'parabola' && <ParabolaLab onToast={onToast} />}
          {activeTab === 'titration' && <TitrationLab onToast={onToast} />}
        </div>
      </div>
    </div>
  );
};

// ===============================================================
// 1. PHÒNG THÍ NGHIỆM VẬT LÝ: CON LẮC ĐƠN DAO ĐỘNG ĐIỀU HÒA
// ===============================================================
const PendulumLab: React.FC<{ onToast: (msg: string) => void }> = ({ onToast }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isRunning, setIsRunning] = useState(true);
  const [length, setLength] = useState(1.5); // Mét (0.5m - 3.0m)
  const [gravity, setGravity] = useState(9.8); // m/s^2
  const [mass, setMass] = useState(0.5); // kg
  const [angle0, setAngle0] = useState(25); // Độ (5 - 60)

  const stateRef = useRef({
    theta: (25 * Math.PI) / 180,
    thetaMax: (25 * Math.PI) / 180,
    omega: Math.sqrt(9.8 / 1.5),
    time: 0,
    length: 1.5,
    gravity: 9.8,
    mass: 0.5,
  });

  useEffect(() => {
    stateRef.current.length = length;
    stateRef.current.gravity = gravity;
    stateRef.current.mass = mass;
    stateRef.current.thetaMax = (angle0 * Math.PI) / 180;
    stateRef.current.omega = Math.sqrt(gravity / length);
  }, [length, gravity, mass, angle0]);

  useEffect(() => {
    let animId: number;
    let lastTs = performance.now();

    const render = (now: number) => {
      const dt = Math.min((now - lastTs) / 1000, 0.1);
      lastTs = now;

      if (isRunning) {
        stateRef.current.time += dt;
        const { time, omega, thetaMax } = stateRef.current;
        stateRef.current.theta = thetaMax * Math.cos(omega * time);
      }

      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          drawPendulum(ctx, canvas.width, canvas.height, stateRef.current);
        }
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [isRunning]);

  const period = 2 * Math.PI * Math.sqrt(length / gravity);
  const frequency = 1 / period;

  const handleReset = () => {
    stateRef.current.time = 0;
    stateRef.current.theta = (angle0 * Math.PI) / 180;
    onToast('Đã đặt lại trạng thái ban đầu của con lắc!');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Cột Trực Quan Hóa (Canvas 60FPS) */}
      <div className="lg:col-span-7 flex flex-col items-center justify-center bg-slate-950 rounded-2xl p-4 border border-slate-800 shadow-inner">
        <canvas ref={canvasRef} width={420} height={360} className="w-full max-w-[420px] h-[320px] rounded-xl" />

        {/* Nút điều khiển nhanh */}
        <div className="flex items-center gap-3 mt-4">
          <button
            onClick={() => setIsRunning(!isRunning)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold shadow-md transition-all cursor-pointer ${
              isRunning
                ? 'bg-amber-600 hover:bg-amber-500 text-white'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white'
            }`}
          >
            {isRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            {isRunning ? 'Tạm dừng' : 'Tiếp tục dao động'}
          </button>

          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Đặt lại
          </button>
        </div>
      </div>

      {/* Cột Thông Số & Công Thức Vật Lý */}
      <div className="lg:col-span-5 flex flex-col gap-4">
        {/* Hộp Công Thức Tính Toán */}
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300">CÔNG THỨC CHU KỲ (T)</span>
            <span className="text-[11px] font-mono text-emerald-700 dark:text-emerald-400">T = 2π√(l/g)</span>
          </div>
          <div className="grid grid-cols-2 gap-3 text-center">
            <div className="bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-emerald-200/60 dark:border-emerald-900/60 shadow-xs">
              <span className="text-[10px] text-slate-500 dark:text-slate-400 block">Chu kỳ (T)</span>
              <span className="text-base font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                {period.toFixed(2)} s
              </span>
            </div>
            <div className="bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-emerald-200/60 dark:border-emerald-900/60 shadow-xs">
              <span className="text-[10px] text-slate-500 dark:text-slate-400 block">Tần số (f)</span>
              <span className="text-base font-bold text-teal-600 dark:text-teal-400 font-mono">
                {frequency.toFixed(2)} Hz
              </span>
            </div>
          </div>
        </div>

        {/* Thanh trượt điều khiển tham số */}
        <div className="space-y-3.5 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-xs">
          <div>
            <div className="flex justify-between font-medium mb-1">
              <span>Chiều dài dây treo (l):</span>
              <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{length.toFixed(2)} m</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="3.0"
              step="0.1"
              value={length}
              onChange={(e) => setLength(parseFloat(e.target.value))}
              className="w-full accent-emerald-500 cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between font-medium mb-1">
              <span>Gia tốc trọng trường (g):</span>
              <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{gravity.toFixed(2)} m/s²</span>
            </div>
            <div className="grid grid-cols-3 gap-1.5 mb-2">
              <button
                onClick={() => setGravity(9.8)}
                className={`py-1 px-2 rounded-lg text-[10px] font-semibold transition-all ${
                  gravity === 9.8 ? 'bg-emerald-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                Trái Đất (9.8)
              </button>
              <button
                onClick={() => setGravity(1.62)}
                className={`py-1 px-2 rounded-lg text-[10px] font-semibold transition-all ${
                  gravity === 1.62 ? 'bg-emerald-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                Mặt Trăng (1.62)
              </button>
              <button
                onClick={() => setGravity(3.71)}
                className={`py-1 px-2 rounded-lg text-[10px] font-semibold transition-all ${
                  gravity === 3.71 ? 'bg-emerald-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                Sao Hỏa (3.71)
              </button>
            </div>
          </div>

          <div>
            <div className="flex justify-between font-medium mb-1">
              <span>Góc lệch ban đầu (α₀):</span>
              <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{angle0}°</span>
            </div>
            <input
              type="range"
              min="5"
              max="60"
              step="1"
              value={angle0}
              onChange={(e) => setAngle0(parseInt(e.target.value, 10))}
              className="w-full accent-emerald-500 cursor-pointer"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

function drawPendulum(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  state: { theta: number; length: number; mass: number }
) {
  ctx.clearRect(0, 0, width, height);

  const originX = width / 2;
  const originY = 50;
  const scale = 80; // pixels per meter
  const wireLength = state.length * scale;

  const bobX = originX + wireLength * Math.sin(state.theta);
  const bobY = originY + wireLength * Math.cos(state.theta);

  // 1. Vẽ giá treo trần
  ctx.beginPath();
  ctx.moveTo(originX - 40, originY - 10);
  ctx.lineTo(originX + 40, originY - 10);
  ctx.strokeStyle = '#64748b';
  ctx.lineWidth = 6;
  ctx.stroke();

  // 2. Vẽ trục thẳng đứng (nét đứt)
  ctx.beginPath();
  ctx.setLineDash([4, 4]);
  ctx.moveTo(originX, originY);
  ctx.lineTo(originX, originY + wireLength + 20);
  ctx.strokeStyle = '#475569';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.setLineDash([]);

  // 3. Vẽ dây treo
  ctx.beginPath();
  ctx.moveTo(originX, originY);
  ctx.lineTo(bobX, bobY);
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 2.5;
  ctx.stroke();

  // 4. Vẽ quả nặng (bob) với gradient ánh sáng 3D
  const radius = 16 + state.mass * 8;
  const grad = ctx.createRadialGradient(bobX - radius / 3, bobY - radius / 3, radius / 8, bobX, bobY, radius);
  grad.addColorStop(0, '#34d399');
  grad.addColorStop(0.8, '#059669');
  grad.addColorStop(1, '#064e3b');

  ctx.beginPath();
  ctx.arc(bobX, bobY, radius, 0, Math.PI * 2);
  ctx.fillStyle = grad;
  ctx.fill();
  ctx.strokeStyle = '#a7f3d0';
  ctx.lineWidth = 2;
  ctx.stroke();

  // 5. Vẽ nhãn góc lệch θ
  ctx.fillStyle = '#94a3b8';
  ctx.font = '11px sans-serif';
  ctx.fillText(`θ = ${(state.theta * 180 / Math.PI).toFixed(1)}°`, bobX + radius + 6, bobY + 4);
}

// ===============================================================
// 2. PHÒNG THÍ NGHIỆM TOÁN HỌC: KHẢO SÁT ĐỒ THỊ PARABOL
// ===============================================================
const ParabolaLab: React.FC<{ onToast: (msg: string) => void }> = ({ onToast }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [a, setA] = useState(1);
  const [b, setB] = useState(-2);
  const [c, setC] = useState(-3);

  // Tính tọa độ đỉnh I(-b / 2a, -delta / 4a)
  const delta = b * b - 4 * a * c;
  const xVertex = -b / (2 * a);
  const yVertex = -delta / (4 * a);

  // Nghiệm
  let roots: number[] = [];
  if (delta > 0) {
    roots = [(-b - Math.sqrt(delta)) / (2 * a), (-b + Math.sqrt(delta)) / (2 * a)].sort((x, y) => x - y);
  } else if (delta === 0) {
    roots = [-b / (2 * a)];
  }

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    drawParabola(ctx, canvas.width, canvas.height, a, b, c, xVertex, yVertex, roots);
  }, [a, b, c, xVertex, yVertex, roots]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Canvas đồ thị Oxy */}
      <div className="lg:col-span-7 flex flex-col items-center justify-center bg-slate-950 rounded-2xl p-4 border border-slate-800 shadow-inner">
        <canvas ref={canvasRef} width={420} height={360} className="w-full max-w-[420px] h-[320px] rounded-xl" />
        <span className="text-[11px] text-slate-400 mt-2 font-mono">
          Hàm số: y = {a === 1 ? '' : a === -1 ? '-' : a}x² {b >= 0 ? `+ ${b}` : `- ${Math.abs(b)}`}x {c >= 0 ? `+ ${c}` : `- ${Math.abs(c)}`}
        </span>
      </div>

      {/* Điều khiển hệ số a, b, c */}
      <div className="lg:col-span-5 flex flex-col gap-4">
        {/* Kết quả phân tích */}
        <div className="p-4 rounded-2xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800/60 text-xs space-y-2">
          <div className="font-bold text-teal-800 dark:text-teal-300">ĐẶC TRƯNG HÌNH HỌC:</div>
          <div className="flex justify-between">
            <span className="text-slate-600 dark:text-slate-400">Tọa độ đỉnh I:</span>
            <span className="font-mono font-bold text-teal-700 dark:text-teal-300">
              I({xVertex.toFixed(2)}; {yVertex.toFixed(2)})
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-600 dark:text-slate-400">Trục đối xứng:</span>
            <span className="font-mono font-bold text-teal-700 dark:text-teal-300">
              x = {xVertex.toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-600 dark:text-slate-400">Biệt thức Δ:</span>
            <span className="font-mono font-bold text-teal-700 dark:text-teal-300">
              {delta.toFixed(2)} ({delta > 0 ? '2 nghiệm' : delta === 0 ? 'Nghiệm kép' : 'Vô nghiệm'})
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-600 dark:text-slate-400">Bề lõm:</span>
            <span className="font-bold text-teal-700 dark:text-teal-300">
              {a > 0 ? 'Hướng lên trên (U)' : 'Hướng xuống dưới (∩)'}
            </span>
          </div>
        </div>

        {/* Thanh trượt a, b, c */}
        <div className="space-y-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-xs">
          <div>
            <div className="flex justify-between font-medium mb-1">
              <span>Hệ số a (a ≠ 0):</span>
              <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{a}</span>
            </div>
            <input
              type="range"
              min="-4"
              max="4"
              step="0.5"
              value={a}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                setA(val === 0 ? 0.5 : val);
              }}
              className="w-full accent-emerald-500 cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between font-medium mb-1">
              <span>Hệ số b:</span>
              <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{b}</span>
            </div>
            <input
              type="range"
              min="-8"
              max="8"
              step="1"
              value={b}
              onChange={(e) => setB(parseInt(e.target.value, 10))}
              className="w-full accent-emerald-500 cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between font-medium mb-1">
              <span>Hệ số c (Giao trục Oy):</span>
              <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{c}</span>
            </div>
            <input
              type="range"
              min="-8"
              max="8"
              step="1"
              value={c}
              onChange={(e) => setC(parseInt(e.target.value, 10))}
              className="w-full accent-emerald-500 cursor-pointer"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

function drawParabola(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  a: number,
  b: number,
  c: number,
  vx: number,
  vy: number,
  roots: number[]
) {
  ctx.clearRect(0, 0, width, height);

  const originX = width / 2;
  const originY = height / 2;
  const unit = 24; // 24px = 1 đơn vị trên hệ trục Oxy

  // 1. Vẽ lưới (Grid)
  ctx.beginPath();
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 1;
  for (let x = originX % unit; x < width; x += unit) {
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
  }
  for (let y = originY % unit; y < height; y += unit) {
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
  }
  ctx.stroke();

  // 2. Vẽ 2 trục tọa độ Ox và Oy
  ctx.beginPath();
  ctx.strokeStyle = '#64748b';
  ctx.lineWidth = 2;
  // Ox
  ctx.moveTo(0, originY);
  ctx.lineTo(width, originY);
  // Oy
  ctx.moveTo(originX, 0);
  ctx.lineTo(originX, height);
  ctx.stroke();

  // Mũi tên Ox, Oy
  ctx.fillStyle = '#94a3b8';
  ctx.font = '11px monospace';
  ctx.fillText('x', width - 14, originY - 6);
  ctx.fillText('y', originX + 8, 14);
  ctx.fillText('O', originX - 12, originY + 14);

  // 3. Vẽ đường Parabol: y = ax^2 + bx + c
  ctx.beginPath();
  ctx.strokeStyle = '#10b981';
  ctx.lineWidth = 3;

  let first = true;
  for (let px = 0; px <= width; px += 2) {
    const x = (px - originX) / unit;
    const y = a * x * x + b * x + c;
    const py = originY - y * unit;

    if (py >= -20 && py <= height + 20) {
      if (first) {
        ctx.moveTo(px, py);
        first = false;
      } else {
        ctx.lineTo(px, py);
      }
    }
  }
  ctx.stroke();

  // 4. Vẽ đỉnh I
  const pVertexX = originX + vx * unit;
  const pVertexY = originY - vy * unit;
  if (pVertexX >= 0 && pVertexX <= width && pVertexY >= 0 && pVertexY <= height) {
    ctx.beginPath();
    ctx.arc(pVertexX, pVertexY, 5, 0, Math.PI * 2);
    ctx.fillStyle = '#f59e0b';
    ctx.fill();
    ctx.fillText(`I(${vx.toFixed(1)}, ${vy.toFixed(1)})`, pVertexX + 8, pVertexY - 6);
  }

  // 5. Vẽ trục đối xứng (nét đứt đỏ)
  ctx.beginPath();
  ctx.setLineDash([4, 4]);
  ctx.strokeStyle = '#ef4444';
  ctx.lineWidth = 1.5;
  ctx.moveTo(pVertexX, 0);
  ctx.lineTo(pVertexX, height);
  ctx.stroke();
  ctx.setLineDash([]);
}

// ===============================================================
// 3. PHÒNG THÍ NGHIỆM HÓA HỌC: CHUẨN ĐỘ AXIT - BAZƠ & ĐỔI MÀU PH
// ===============================================================
const TitrationLab: React.FC<{ onToast: (msg: string) => void }> = ({ onToast }) => {
  const [volAdded, setVolAdded] = useState(0); // Thể tích NaOH thêm vào (0 - 40 mL)
  const [indicator, setIndicator] = useState<'phenolphthalein' | 'litmus'>('phenolphthalein');

  // Nồng độ: 20 mL HCl 0.1M chuẩn độ bằng NaOH 0.1M
  // Điểm tương đương tại V_NaOH = 20 mL
  const calculatePH = (v: number): number => {
    const vHcl = 20;
    const c = 0.1;
    if (v < 20) {
      const remainingH = (vHcl * c - v * c) / (vHcl + v);
      return Math.max(1, -Math.log10(remainingH));
    } else if (v === 20) {
      return 7.0; // Trung hòa hoàn toàn
    } else {
      const excessOH = (v * c - vHcl * c) / (vHcl + v);
      const pOH = -Math.log10(excessOH);
      return Math.min(13.5, 14 - pOH);
    }
  };

  const ph = calculatePH(volAdded);

  // Xác định màu sắc dung dịch trong bình tam giác
  const getSolutionColor = (): string => {
    if (indicator === 'phenolphthalein') {
      if (ph < 8.2) return 'rgba(240, 249, 255, 0.2)'; // Không màu trong suốt
      if (ph < 10) return 'rgba(244, 114, 182, 0.45)'; // Hồng nhạt
      return 'rgba(219, 39, 119, 0.85)'; // Hồng cánh sen đậm
    } else {
      // Quỳ tím
      if (ph < 5) return 'rgba(239, 68, 68, 0.7)'; // Đỏ axit
      if (ph <= 8) return 'rgba(168, 85, 247, 0.6)'; // Tím trung tính
      return 'rgba(59, 130, 246, 0.75)'; // Xanh bazơ
    }
  };

  const addDrops = (amount: number) => {
    setVolAdded((prev) => {
      const next = Math.min(40, prev + amount);
      if (prev < 20 && next >= 20) {
        onToast('🎯 Đã đạt điểm tương đương (pH = 7.0)! Màu dung dịch bắt đầu chuyển sắc.');
      }
      return next;
    });
  };

  const handleReset = () => {
    setVolAdded(0);
    onToast('Đã làm mới bình tam giác chứa 20 mL HCl 0.1M.');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Cột Mô phỏng Buret và Bình tam giác */}
      <div className="lg:col-span-6 flex flex-col items-center justify-center bg-slate-950 rounded-2xl p-6 border border-slate-800 shadow-inner min-h-[360px]">
        {/* Buret và nhỏ giọt */}
        <div className="flex flex-col items-center">
          <div className="w-6 h-28 border-2 border-slate-400 bg-slate-800/80 rounded-t-sm relative overflow-hidden flex items-end">
            <div
              className="w-full bg-cyan-400/60 transition-all duration-300"
              style={{ height: `${Math.max(5, 100 - (volAdded / 40) * 100)}%` }}
            />
            <span className="absolute top-1 text-[8px] font-mono text-cyan-200">NaOH</span>
          </div>
          {/* Đầu khóa buret */}
          <div className="w-2 h-4 bg-slate-500 rounded-b-sm" />
          {/* Giọt rơi */}
          <div className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce my-2" />

          {/* Bình tam giác Erlenmeyer */}
          <div className="w-32 h-36 relative flex items-end justify-center">
            {/* Hình dạng bình Erlenmeyer bằng SVG */}
            <svg viewBox="0 0 100 120" className="w-full h-full">
              {/* Thân bình tam giác thủy tinh */}
              <polygon points="35,10 65,10 65,30 95,110 5,110 35,30" fill="rgba(255,255,255,0.08)" stroke="#94a3b8" strokeWidth="2.5" />
              {/* Dung dịch lỏng bên trong bình */}
              <polygon
                points="25,60 75,60 93,108 7,108"
                fill={getSolutionColor()}
                className="transition-colors duration-500"
              />
            </svg>
            <span className="absolute bottom-2 text-[10px] font-bold text-white tracking-wider">
              pH = {ph.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Nút nhỏ giọt */}
        <div className="flex items-center gap-2 mt-4">
          <button
            onClick={() => addDrops(0.5)}
            className="px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-xs cursor-pointer active:scale-95 transition-all"
          >
            +0.5 mL (1 giọt)
          </button>
          <button
            onClick={() => addDrops(2.0)}
            className="px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold shadow-xs cursor-pointer active:scale-95 transition-all"
          >
            +2.0 mL
          </button>
          <button
            onClick={handleReset}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all cursor-pointer"
            title="Làm mới"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Cột Đường cong Chuẩn độ & Chỉ thị màu */}
      <div className="lg:col-span-6 flex flex-col gap-4">
        {/* Đồng hồ pH */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-xs">
          <div className="flex justify-between items-center mb-2">
            <span className="font-bold text-slate-700 dark:text-slate-300">DUNG DỊCH ĐANG ĐO:</span>
            <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">V_NaOH = {volAdded.toFixed(1)} mL</span>
          </div>

          <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-[11px] text-slate-500 block">Độ pH đo được:</span>
              <span className="text-2xl font-bold font-mono text-cyan-600 dark:text-cyan-400">
                {ph.toFixed(2)}
              </span>
            </div>

            <div className="text-right">
              <span className="text-[11px] text-slate-500 block">Môi trường:</span>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                ph < 7
                  ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                  : ph === 7
                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                  : 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
              }`}>
                {ph < 7 ? 'Axit (dư HCl)' : ph === 7 ? 'Trung hòa (Đương lượng)' : 'Bazơ (dư NaOH)'}
              </span>
            </div>
          </div>
        </div>

        {/* Lựa chọn chất chỉ thị */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-xs">
          <span className="font-bold text-slate-700 dark:text-slate-300 block mb-2">CHỌN CHẤT CHỈ THỊ MÀU:</span>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setIndicator('phenolphthalein')}
              className={`p-2.5 rounded-xl border text-left transition-all ${
                indicator === 'phenolphthalein'
                  ? 'border-pink-500 bg-pink-50 dark:bg-pink-950/40 text-pink-700 dark:text-pink-300 font-bold'
                  : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
              }`}
            >
              Phenolphthalein
              <span className="block text-[10px] font-normal text-slate-500 dark:text-slate-400 mt-0.5">
                Không màu ➔ Hồng cánh sen (pH ≥ 8.3)
              </span>
            </button>

            <button
              onClick={() => setIndicator('litmus')}
              className={`p-2.5 rounded-xl border text-left transition-all ${
                indicator === 'litmus'
                  ? 'border-purple-500 bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 font-bold'
                  : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
              }`}
            >
              Quỳ tím (Litmus)
              <span className="block text-[10px] font-normal text-slate-500 dark:text-slate-400 mt-0.5">
                Đỏ ➔ Tím (pH=7) ➔ Xanh (pH &gt; 7)
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
