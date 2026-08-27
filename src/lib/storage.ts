import { Conversation, UserSettings } from '../types';
import { AiProvider } from './aiClientFactory';
import { DEFAULT_GEMINI_MODEL, getDefaultModelForProvider } from './models';

const STORAGE_KEYS = {
  SETTINGS: 'anhgiao_settings_v2',
  GEMINI_KEY: 'gemini_api_key',
  AGENT_PLATFORM_KEY: 'agent_platform_api_key',
  AI_PROVIDER: 'google_ai_provider',
  API_KEY_LIST: 'anhgiao_api_key_list_v2',
  CONVERSATIONS: 'anhgiao_conversations_v2',
  CURRENT_CONV: 'anhgiao_current_conv_id_v2',
  SESSION_BACKUP: 'anhgiao_session_backup_v2',
  LAST_SAVED_AT: 'anhgiao_last_saved_at_v2',
};

export const DEFAULT_SETTINGS: UserSettings = {
  provider: 'gemini',
  model: DEFAULT_GEMINI_MODEL,
  geminiApiKey: '',
  agentPlatformApiKey: '',
  apiKey: '',
  apiKeyList: [],
  defaultSubject: 'auto',
  defaultGrade: 'all',
  sheetsUrl: '',
  loggingEnabled: false,
  theme: 'system',
};

export function loadSettings(): UserSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    const parsed = raw ? JSON.parse(raw) : {};

    // Đọc riêng từng key theo từng provider theo chuẩn api.md
    const geminiApiKey =
      localStorage.getItem(STORAGE_KEYS.GEMINI_KEY) ||
      parsed.geminiApiKey ||
      parsed.apiKey ||
      '';
    const agentPlatformApiKey =
      localStorage.getItem(STORAGE_KEYS.AGENT_PLATFORM_KEY) ||
      parsed.agentPlatformApiKey ||
      '';
    
    // Đọc provider
    const storedProvider = (localStorage.getItem(STORAGE_KEYS.AI_PROVIDER) ||
      parsed.provider ||
      'gemini') as AiProvider;
    const provider: AiProvider = storedProvider === 'agent-platform' ? 'agent-platform' : 'gemini';

    // Đọc danh sách xoay key
    let apiKeyList: string[] = [];
    try {
      const rawList = localStorage.getItem(STORAGE_KEYS.API_KEY_LIST);
      if (rawList) apiKeyList = JSON.parse(rawList);
    } catch {
      apiKeyList = [];
    }

    const activeKey = provider === 'agent-platform' ? agentPlatformApiKey : geminiApiKey;

    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
      provider,
      geminiApiKey,
      agentPlatformApiKey,
      apiKey: activeKey,
      apiKeyList,
      model: parsed.model || getDefaultModelForProvider(provider),
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: UserSettings): void {
  try {
    // 1. Lưu key riêng theo provider
    if (settings.geminiApiKey) {
      localStorage.setItem(STORAGE_KEYS.GEMINI_KEY, settings.geminiApiKey.trim());
    } else {
      localStorage.removeItem(STORAGE_KEYS.GEMINI_KEY);
    }

    if (settings.agentPlatformApiKey) {
      localStorage.setItem(STORAGE_KEYS.AGENT_PLATFORM_KEY, settings.agentPlatformApiKey.trim());
    } else {
      localStorage.removeItem(STORAGE_KEYS.AGENT_PLATFORM_KEY);
    }

    // 2. Lưu provider
    localStorage.setItem(STORAGE_KEYS.AI_PROVIDER, settings.provider);

    // 3. Lưu danh sách xoay key
    if (settings.apiKeyList && settings.apiKeyList.length > 0) {
      localStorage.setItem(STORAGE_KEYS.API_KEY_LIST, JSON.stringify(settings.apiKeyList));
    } else {
      localStorage.removeItem(STORAGE_KEYS.API_KEY_LIST);
    }

    // 4. Lưu cài đặt chung
    const toPersist = {
      provider: settings.provider,
      model: settings.model,
      geminiApiKey: settings.geminiApiKey,
      agentPlatformApiKey: settings.agentPlatformApiKey,
      defaultSubject: settings.defaultSubject,
      defaultGrade: settings.defaultGrade,
      sheetsUrl: settings.sheetsUrl,
      loggingEnabled: settings.loggingEnabled,
      theme: settings.theme,
    };
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(toPersist));
  } catch (e) {
    console.error('Failed to save settings:', e);
  }
}

// Xoay key tự động khi gặp lỗi 429 Rate Limit / Quota
export function rotateApiKey(): string | null {
  try {
    const settings = loadSettings();
    const keys = settings.apiKeyList || [];
    if (keys.length <= 1) return null;

    const currentKey = settings.apiKey;
    const currentIndex = keys.indexOf(currentKey);
    const nextIndex = (currentIndex + 1) % keys.length;
    const nextKey = keys[nextIndex];

    if (nextKey && nextKey !== currentKey) {
      if (settings.provider === 'gemini') {
        settings.geminiApiKey = nextKey;
      } else {
        settings.agentPlatformApiKey = nextKey;
      }
      settings.apiKey = nextKey;
      saveSettings(settings);
      return nextKey;
    }
  } catch (e) {
    console.error('Error rotating API key:', e);
  }
  return null;
}

export function loadConversations(): Conversation[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CONVERSATIONS);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveConversations(conversations: Conversation[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.CONVERSATIONS, JSON.stringify(conversations));
  } catch (e) {
    console.error('Failed to save conversations:', e);
  }
}

export function loadCurrentConversationId(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEYS.CURRENT_CONV);
  } catch {
    return null;
  }
}

export function saveCurrentConversationId(id: string): void {
  try {
    localStorage.setItem(STORAGE_KEYS.CURRENT_CONV, id);
  } catch (e) {
    console.error('Failed to save current conv id:', e);
  }
}

// ============================================
// AUTO-SAVE SESSION (Sau mỗi 5s)
// ============================================
export interface SessionBackupData {
  inputText: string;
  currentMode: string;
  currentSubject: string;
  currentGrade: string;
  currentConvId: string | null;
  timestamp: number;
}

export function saveSessionBackup(data: Partial<SessionBackupData>): void {
  try {
    const existing = loadSessionBackup();
    const merged: SessionBackupData = {
      inputText: '',
      currentMode: 'guided',
      currentSubject: 'auto',
      currentGrade: 'all',
      currentConvId: null,
      ...existing,
      ...data,
      timestamp: Date.now(),
    };
    localStorage.setItem(STORAGE_KEYS.SESSION_BACKUP, JSON.stringify(merged));
    localStorage.setItem(STORAGE_KEYS.LAST_SAVED_AT, String(Date.now()));
  } catch (e) {
    console.error('Failed to save session backup:', e);
  }
}

export function loadSessionBackup(): SessionBackupData | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SESSION_BACKUP);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function clearSessionBackup(): void {
  try {
    localStorage.removeItem(STORAGE_KEYS.SESSION_BACKUP);
  } catch (e) {
    console.error('Failed to clear session backup:', e);
  }
}

export function getLastSavedTimestamp(): number | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.LAST_SAVED_AT);
    return raw ? parseInt(raw, 10) : null;
  } catch {
    return null;
  }
}
