import React, { useState } from 'react';
import {
  X,
  Key,
  Database,
  FileSpreadsheet,
  Moon,
  Sun,
  Laptop,
  CheckCircle,
  ExternalLink,
  RotateCcw,
  Sparkles,
  Zap,
  Layers,
  Cpu,
} from 'lucide-react';
import { UserSettings } from '../types';
import { AiProvider, isValidGoogleAiApiKey, createGoogleAiClient } from '../lib/aiClientFactory';
import {
  getAvailableModels,
  getDefaultModelForProvider,
} from '../lib/models';
import { SUBJECT_OPTIONS, GRADE_OPTIONS } from '../lib/prompts';
import { testGoogleSheetsUrl } from '../lib/sheets';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: UserSettings;
  onSave: (newSettings: UserSettings) => void;
  onToast: (msg: string) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSave,
  onToast,
}) => {
  const [provider, setProvider] = useState<AiProvider>(settings.provider || 'gemini');
  const [geminiKey, setGeminiKey] = useState(settings.geminiApiKey || '');
  const [agentKey, setAgentKey] = useState(settings.agentPlatformApiKey || '');
  const [multiKeyInput, setMultiKeyInput] = useState(
    settings.apiKeyList && settings.apiKeyList.length > 0
      ? settings.apiKeyList.join('\n')
      : ''
  );
  const [model, setModel] = useState(
    settings.model || getDefaultModelForProvider(settings.provider || 'gemini')
  );
  const [sheetsUrl, setSheetsUrl] = useState(settings.sheetsUrl || '');
  const [loggingEnabled, setLoggingEnabled] = useState(settings.loggingEnabled);
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>(settings.theme);
  const [defaultSubject, setDefaultSubject] = useState(settings.defaultSubject || 'auto');
  const [defaultGrade, setDefaultGrade] = useState(settings.defaultGrade || 'all');

  const [isTestingKey, setIsTestingKey] = useState(false);
  const [isTestingSheets, setIsTestingSheets] = useState(false);
  const [keyTestStatus, setKeyTestStatus] = useState<{ success: boolean; msg: string } | null>(null);

  if (!isOpen) return null;

  // Khi chuyển đổi provider, tự động chuyển model phù hợp nếu model cũ không thuộc provider đó
  const handleProviderChange = (newProvider: AiProvider) => {
    setProvider(newProvider);
    setKeyTestStatus(null);
    const available = getAvailableModels(newProvider);
    if (!available.some((m) => m.id === model)) {
      setModel(getDefaultModelForProvider(newProvider));
    }
  };

  // Test live API Key connection
  const handleTestApiKey = async () => {
    const activeKey = (provider === 'agent-platform' ? agentKey : geminiKey).trim();
    if (!activeKey) {
      setKeyTestStatus({
        success: false,
        msg: 'Vui lòng nhập API Key trước khi kiểm tra kết nối.',
      });
      return;
    }

    if (!isValidGoogleAiApiKey(activeKey)) {
      setKeyTestStatus({
        success: false,
        msg: 'Định dạng khóa API không hợp lệ (không được để trống hoặc chứa khoảng trắng).',
      });
      return;
    }

    setIsTestingKey(true);
    setKeyTestStatus(null);

    try {
      const ai = createGoogleAiClient(activeKey, provider);
      const testModel = model || getDefaultModelForProvider(provider);
      const res = await ai.models.generateContent({
        model: testModel,
        contents: 'Test connection. Output 1 word: OK',
      });

      if (res && res.text) {
        setKeyTestStatus({
          success: true,
          msg: `Kết nối thành công đến mô hình ${testModel} (${provider.toUpperCase()})!`,
        });
      } else {
        setKeyTestStatus({
          success: true,
          msg: 'Đã kết nối được tới Google AI!',
        });
      }
    } catch (err: unknown) {
      const errMessage = err instanceof Error ? err.message : String(err);
      console.error('[Settings Key Test Error]:', errMessage);

      if (errMessage.toLowerCase().includes('permission_denied') || errMessage.includes('403')) {
        setKeyTestStatus({
          success: false,
          msg: 'Lỗi 403: Google đã nhận key nhưng dự án/key chưa được cấp quyền cho endpoint này.',
        });
      } else if (errMessage.toLowerCase().includes('api_key') || errMessage.includes('401')) {
        setKeyTestStatus({
          success: false,
          msg: 'Lỗi 401: API Key không chính xác hoặc đã bị vô hiệu hóa.',
        });
      } else if (errMessage.includes('503') || errMessage.toLowerCase().includes('unavailable')) {
        setKeyTestStatus({
          success: false,
          msg: 'Mô hình này đang tạm thời quá tải (503). Key vẫn hợp lệ, hệ thống sẽ tự động fallback.',
        });
      } else {
        setKeyTestStatus({
          success: false,
          msg: `Lỗi kết nối: ${errMessage}`,
        });
      }
    } finally {
      setIsTestingKey(false);
    }
  };

  const handleTestSheets = async () => {
    if (!sheetsUrl.trim()) {
      onToast('Vui lòng nhập URL Google Apps Script Web App.');
      return;
    }

    setIsTestingSheets(true);
    const ok = await testGoogleSheetsUrl(sheetsUrl);
    setIsTestingSheets(false);

    if (ok) {
      onToast('✅ Kết nối Google Sheets thành công!');
    } else {
      onToast('⚠️ Không thể kết nối. Hãy kiểm tra lại URL Apps Script (quyền Anyone).');
    }
  };

  const handleSave = () => {
    // Phân tích danh sách xoay key
    const rawKeys = multiKeyInput
      .split(/[\n,]+/)
      .map((k) => k.trim())
      .filter((k) => k.length > 0 && isValidGoogleAiApiKey(k));

    const cleanGeminiKey = geminiKey.trim();
    const cleanAgentKey = agentKey.trim();

    // Bổ sung key chính vào danh sách nếu chưa có
    const activeKey = provider === 'agent-platform' ? cleanAgentKey : cleanGeminiKey;
    const finalKeyList = Array.from(new Set([activeKey, ...rawKeys].filter(Boolean)));

    const updated: UserSettings = {
      provider,
      model,
      geminiApiKey: cleanGeminiKey,
      agentPlatformApiKey: cleanAgentKey,
      apiKey: activeKey,
      apiKeyList: finalKeyList,
      sheetsUrl: sheetsUrl.trim(),
      loggingEnabled,
      theme,
      defaultSubject,
      defaultGrade,
    };

    onSave(updated);
    onToast('Đã lưu toàn bộ cấu hình hệ thống thành công!');
    onClose();
  };

  const handleResetDefaults = () => {
    setProvider('gemini');
    setGeminiKey('');
    setAgentKey('');
    setMultiKeyInput('');
    setModel(getDefaultModelForProvider('gemini'));
    setSheetsUrl('');
    setLoggingEnabled(false);
    setTheme('system');
    setDefaultSubject('auto');
    setDefaultGrade('all');
    setKeyTestStatus(null);
    onToast('Đã khôi phục cài đặt mặc định.');
  };

  const currentModels = getAvailableModels(provider);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div className="relative w-full max-w-2xl max-h-[88dvh] flex flex-col bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-slate-200 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-400 flex items-center justify-center shadow-xs">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg text-slate-900 dark:text-white leading-tight">
                Cài đặt & Cấu hình AI
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Quản lý Google Gemini API, Agent Platform, xoay API Key & Giao diện
              </p>
            </div>
          </div>
          <button
            id="btn-close-settings"
            type="button"
            onClick={onClose}
            className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer active:scale-95"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6 text-xs sm:text-sm">
          {/* Section 1: AI Provider Selection Tabs */}
          <div className="space-y-3.5">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 text-sm">
                <Layers className="w-4 h-4 text-emerald-500" />
                1. Nhà cung cấp AI (Google AI Provider)
              </h4>
              <span className="text-[11px] text-slate-400 font-medium">Bắt buộc chọn thủ công</span>
            </div>

            {/* Provider Switcher Tabs */}
            <div className="grid grid-cols-2 gap-2 p-1.5 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80">
              <button
                id="tab-provider-gemini"
                type="button"
                onClick={() => handleProviderChange('gemini')}
                className={`flex flex-col items-center justify-center p-3 rounded-xl transition-all cursor-pointer ${
                  provider === 'gemini'
                    ? 'bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-300 shadow-xs ring-1 ring-emerald-500/30 font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-1.5 text-xs sm:text-sm">
                  <Sparkles className="w-4 h-4 text-emerald-500" />
                  <span>Google Gemini API</span>
                </div>
                <span className="text-[10px] opacity-75 mt-0.5 font-normal">
                  Google AI Studio (Miễn phí & Phổ biến)
                </span>
              </button>

              <button
                id="tab-provider-agent-platform"
                type="button"
                onClick={() => handleProviderChange('agent-platform')}
                className={`flex flex-col items-center justify-center p-3 rounded-xl transition-all cursor-pointer ${
                  provider === 'agent-platform'
                    ? 'bg-white dark:bg-slate-700 text-teal-700 dark:text-teal-300 shadow-xs ring-1 ring-teal-500/30 font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-1.5 text-xs sm:text-sm">
                  <Cpu className="w-4 h-4 text-teal-500" />
                  <span>Agent Platform API</span>
                </div>
                <span className="text-[10px] opacity-75 mt-0.5 font-normal">
                  Google Cloud Enterprise Agent
                </span>
              </button>
            </div>

            {/* API Key Input based on provider */}
            {provider === 'gemini' ? (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">
                    Gemini API Key:
                  </label>
                  <a
                    href="https://aistudio.google.com/api-keys"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] text-teal-600 dark:text-teal-400 hover:underline font-bold"
                  >
                    <span>Lấy key miễn phí tại Google AI Studio</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <input
                  id="input-gemini-key"
                  type="password"
                  value={geminiKey}
                  onChange={(e) => setGeminiKey(e.target.value)}
                  placeholder="AIzaSy... hoặc AQ..."
                  className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:border-emerald-500 font-mono text-xs sm:text-sm"
                />
              </div>
            ) : (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">
                    Agent Platform API Key:
                  </label>
                  <a
                    href="https://docs.cloud.google.com/gemini-enterprise-agent-platform/models/start/api-keys"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] text-teal-600 dark:text-teal-400 hover:underline font-bold"
                  >
                    <span>Xem hướng dẫn Agent Platform</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <input
                  id="input-agent-key"
                  type="password"
                  value={agentKey}
                  onChange={(e) => setAgentKey(e.target.value)}
                  placeholder="Nhập Agent Platform API Key..."
                  className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:border-emerald-500 font-mono text-xs sm:text-sm"
                />
              </div>
            )}

            {/* Live Key Test Button & Status */}
            <div className="flex items-center gap-3 pt-1">
              <button
                id="btn-test-api-key"
                type="button"
                onClick={handleTestApiKey}
                disabled={isTestingKey}
                className="flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold text-xs transition-colors cursor-pointer disabled:opacity-50 active:scale-95"
              >
                <Zap className="w-3.5 h-3.5 text-amber-500" />
                <span>{isTestingKey ? 'Đang kiểm tra kết nối...' : 'Kiểm tra kết nối Live'}</span>
              </button>

              {keyTestStatus && (
                <div
                  className={`text-xs font-medium px-3 py-1.5 rounded-xl flex-1 ${
                    keyTestStatus.success
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800'
                      : 'bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300 border border-red-200/80 dark:border-red-800'
                  }`}
                >
                  {keyTestStatus.msg}
                </div>
              )}
            </div>

            {/* API Key Rotation (Tùy chọn nâng cao) */}
            <details className="pt-2 text-xs">
              <summary className="font-semibold text-slate-700 dark:text-slate-300 cursor-pointer hover:text-emerald-600">
                ➕ Danh sách nhiều API Key dự phòng (Tự động xoay khi gặp 429 Quota)
              </summary>
              <div className="mt-2 space-y-1.5 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <textarea
                  rows={2}
                  value={multiKeyInput}
                  onChange={(e) => setMultiKeyInput(e.target.value)}
                  placeholder="Dán các API Key dự phòng (mỗi dòng hoặc dấu phẩy 1 key)..."
                  className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 font-mono text-xs text-slate-900 dark:text-slate-100 resize-none focus:outline-hidden"
                />
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Khi một key chạm hạn mức tốc độ (Rate Limit 429), hệ thống sẽ tự động chuyển sang key tiếp theo mà không làm gián đoạn bài học.
                </p>
              </div>
            </details>
          </div>

          {/* Section 2: Model Selection Cards */}
          <div className="space-y-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 text-sm">
                <Key className="w-4 h-4 text-emerald-500" />
                2. Mô hình AI ({provider === 'gemini' ? 'Gemini 3.x / 2.5' : 'Agent Platform'})
              </h4>
              <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                Tự động Fallback đa tầng khi quá tải
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {currentModels.map((m) => {
                const isSelected = model === m.id;
                return (
                  <button
                    key={m.id}
                    id={`model-card-${m.id}`}
                    type="button"
                    onClick={() => setModel(m.id)}
                    className={`flex flex-col p-3.5 rounded-2xl border text-left transition-all cursor-pointer active:scale-[0.98] ${
                      isSelected
                        ? 'bg-emerald-50/70 dark:bg-emerald-950/40 border-emerald-500 text-emerald-900 dark:text-emerald-200 ring-2 ring-emerald-500/20 shadow-xs'
                        : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                        {m.name}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          m.recommended
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {m.badge}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                      {m.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 3: Default Subject & Grade */}
          <div className="space-y-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 text-sm">
              <CheckCircle className="w-4 h-4 text-teal-600" />
              3. Mặc định môn học & Cấp lớp
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Môn học ưu tiên:
                </label>
                <select
                  id="settings-default-subject"
                  value={defaultSubject}
                  onChange={(e) => setDefaultSubject(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:border-emerald-500 text-xs sm:text-sm"
                >
                  {SUBJECT_OPTIONS.map((sub) => (
                    <option key={sub.id} value={sub.id}>
                      {sub.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Khối lớp ưu tiên:
                </label>
                <select
                  id="settings-default-grade"
                  value={defaultGrade}
                  onChange={(e) => setDefaultGrade(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:border-emerald-500 text-xs sm:text-sm"
                >
                  {GRADE_OPTIONS.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Section 4: Google Sheets Logging */}
          <div className="space-y-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 text-sm">
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                4. Nhật ký Google Sheets (Dành cho Giáo viên)
              </h4>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  id="toggle-sheets-logging"
                  type="checkbox"
                  checked={loggingEnabled}
                  onChange={(e) => setLoggingEnabled(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-300 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
              </label>
            </div>

            {loggingEnabled && (
              <div className="space-y-2 animate-in fade-in">
                <div className="flex gap-2">
                  <input
                    id="input-sheets-url"
                    type="url"
                    value={sheetsUrl}
                    onChange={(e) => setSheetsUrl(e.target.value)}
                    placeholder="https://script.google.com/macros/s/.../exec"
                    className="flex-1 px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:border-emerald-500 text-xs sm:text-sm font-mono"
                  />
                  <button
                    id="btn-test-sheets"
                    type="button"
                    onClick={handleTestSheets}
                    disabled={isTestingSheets}
                    className="min-h-[42px] px-3.5 py-2 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold text-xs transition-colors shrink-0 cursor-pointer disabled:opacity-50 active:scale-95"
                  >
                    {isTestingSheets ? 'Đang thử...' : 'Kiểm tra'}
                  </button>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Tự động ghi lại thời gian, môn học, khối lớp để theo dõi tiến độ tự học của học sinh mà không lưu trữ thông tin cá nhân.
                </p>
              </div>
            )}
          </div>

          {/* Section 5: Theme Mode */}
          <div className="space-y-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 text-sm">
              <Sun className="w-4 h-4 text-amber-500" />
              5. Giao diện hiển thị
            </h4>
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              <button
                type="button"
                onClick={() => setTheme('light')}
                className={`min-h-[44px] flex items-center justify-center gap-2 p-2.5 rounded-2xl border text-xs font-semibold cursor-pointer transition-all active:scale-95 ${
                  theme === 'light'
                    ? 'bg-white dark:bg-slate-800 border-emerald-500 text-emerald-700 dark:text-emerald-300 ring-2 ring-emerald-500/20'
                    : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                }`}
              >
                <Sun className="w-4 h-4 text-amber-500" />
                <span>Sáng</span>
              </button>

              <button
                type="button"
                onClick={() => setTheme('dark')}
                className={`min-h-[44px] flex items-center justify-center gap-2 p-2.5 rounded-2xl border text-xs font-semibold cursor-pointer transition-all active:scale-95 ${
                  theme === 'dark'
                    ? 'bg-white dark:bg-slate-800 border-emerald-500 text-emerald-700 dark:text-emerald-300 ring-2 ring-emerald-500/20'
                    : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                }`}
              >
                <Moon className="w-4 h-4 text-teal-500" />
                <span>Tối</span>
              </button>

              <button
                type="button"
                onClick={() => setTheme('system')}
                className={`min-h-[44px] flex items-center justify-center gap-2 p-2.5 rounded-2xl border text-xs font-semibold cursor-pointer transition-all active:scale-95 ${
                  theme === 'system'
                    ? 'bg-white dark:bg-slate-800 border-emerald-500 text-emerald-700 dark:text-emerald-300 ring-2 ring-emerald-500/20'
                    : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                }`}
              >
                <Laptop className="w-4 h-4 text-slate-500" />
                <span>Tự động</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 sm:px-6 py-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/90 flex items-center justify-between shrink-0">
          <button
            id="btn-reset-defaults"
            type="button"
            onClick={handleResetDefaults}
            className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors cursor-pointer py-1.5 px-2 rounded-xl"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Mặc định</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="min-h-[40px] px-4 py-2 rounded-2xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer active:scale-95"
            >
              Hủy
            </button>
            <button
              id="btn-save-settings"
              type="button"
              onClick={handleSave}
              className="min-h-[40px] px-5 py-2 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs shadow-emerald-600/30 transition-all cursor-pointer active:scale-95"
            >
              Lưu cấu hình
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
