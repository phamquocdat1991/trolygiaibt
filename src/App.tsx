import React, { useState, useEffect, useRef } from 'react';
import { LearningHome } from './components/LearningHome';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { ChatMessage } from './components/ChatMessage';
import { Composer } from './components/Composer';
import { SettingsModal } from './components/SettingsModal';
import { InstructionsModal } from './components/InstructionsModal';
import { AboutModal } from './components/AboutModal';
import { HistoryModal } from './components/HistoryModal';
import { ImagePreviewModal } from './components/ImagePreviewModal';
import { OnboardingKeyModal } from './components/OnboardingKeyModal';
import { VirtualLabModal } from './components/VirtualLabModal';
import { FlashcardModal } from './components/FlashcardModal';
import { ExamGeneratorModal } from './components/ExamGeneratorModal';
import { InteractiveQuizModal } from './components/InteractiveQuizModal';
import { exportConversationToWord } from './lib/docxExport';
import {
  Conversation,
  ChatMessage as ChatMessageType,
  ChatMode,
  ImageAttachment,
  UserSettings,
  ParsedExam,
} from './types';
import {
  loadSettings,
  saveSettings,
  loadConversations,
  saveConversations,
  loadCurrentConversationId,
  saveCurrentConversationId,
  saveSessionBackup,
  loadSessionBackup,
  getLastSavedTimestamp,
  clearSessionBackup,
} from './lib/storage';
import { buildSystemPrompt, SUBJECT_OPTIONS, GRADE_OPTIONS } from './lib/prompts';
import { streamChatCompletion } from './lib/aiService';
import { parseApiError } from './lib/errors';
import { logToGoogleSheets } from './lib/sheets';
import {
  Calculator,
  BookOpen,
  Languages,
  Atom,
  ArrowDown,
  Trash2,
  RotateCcw,
  Sparkles,
} from 'lucide-react';

export default function App() {
  // State: Settings
  const [settings, setSettings] = useState<UserSettings>(loadSettings);
  const [isDark, setIsDark] = useState<boolean>(() => {
    const saved = loadSettings();
    if (saved.theme === 'dark') return true;
    if (saved.theme === 'light') return false;
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  // State: Conversations & Active Session
  const [conversations, setConversations] = useState<Conversation[]>(loadConversations);
  const [currentId, setCurrentId] = useState<string | null>(() => {
    const savedId = loadCurrentConversationId();
    const list = loadConversations();
    if (savedId && list.some((c) => c.id === savedId)) {
      return savedId;
    }
    return list.length > 0 ? list[0].id : null;
  });

  // Current Mode & Subject/Grade filters
  const [currentMode, setCurrentMode] = useState<ChatMode>('guided');
  const [currentSubject, setCurrentSubject] = useState<string>(settings.defaultSubject || 'auto');
  const [currentGrade, setCurrentGrade] = useState<string>(settings.defaultGrade || 'all');

  // Generation state & Abort Controller
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  // UI Modals state
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  const [settingsOpen, setSettingsOpen] = useState<boolean>(false);
  const [instructionsOpen, setInstructionsOpen] = useState<boolean>(false);
  const [aboutOpen, setAboutOpen] = useState<boolean>(false);
  const [historyOpen, setHistoryOpen] = useState<boolean>(false);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [clearChatConfirmOpen, setClearChatConfirmOpen] = useState<boolean>(false);
  const [virtualLabOpen, setVirtualLabOpen] = useState<boolean>(false);
  const [flashcardOpen, setFlashcardOpen] = useState<boolean>(false);
  const [examGeneratorOpen, setExamGeneratorOpen] = useState<boolean>(false);
  const [quizModalOpen, setQuizModalOpen] = useState<boolean>(false);
  const [activeExam, setActiveExam] = useState<ParsedExam | null>(null);

  const [onboardingOpen, setOnboardingOpen] = useState<boolean>(() => {
    const s = loadSettings();
    return !s.apiKey;
  });

  // Session Restore Banner State
  const [savedSessionNotice, setSavedSessionNotice] = useState<string | null>(() => {
    const backup = loadSessionBackup();
    const lastSaved = getLastSavedTimestamp();
    if (backup && lastSaved && Date.now() - lastSaved < 24 * 60 * 60 * 1000) {
      return `Đã tự động lưu phiên làm việc lúc ${new Date(lastSaved).toLocaleTimeString('vi-VN')}`;
    }
    return null;
  });

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Scroll ref & Intelligent user-scroll-awareness
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const chatScrollContainerRef = useRef<HTMLDivElement>(null);
  const [showScrollBottom, setShowScrollBottom] = useState<boolean>(false);
  const userScrolledUpRef = useRef<boolean>(false);

  // Sync Dark mode with HTML document element
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  // Persist conversations
  useEffect(() => {
    saveConversations(conversations);
  }, [conversations]);

  // Persist current ID
  useEffect(() => {
    if (currentId) {
      saveCurrentConversationId(currentId);
    }
  }, [currentId]);

  // Auto-save Session every 5 seconds (Tính năng lưu phiên theo yêu cầu)
  useEffect(() => {
    const interval = setInterval(() => {
      saveSessionBackup({
        currentMode,
        currentSubject,
        currentGrade,
        currentConvId: currentId,
      });
    }, 5000);

    return () => clearInterval(interval);
  }, [currentMode, currentSubject, currentGrade, currentId]);

  // Show toast notification
  const showToast = (msg: string) => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToastMessage(msg);
    toastTimeoutRef.current = setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Get active conversation or create default
  const activeConversation: Conversation | null =
    conversations.find((c) => c.id === currentId) || null;

  // Auto scroll to bottom with intent check
  const scrollToBottom = (smooth = true, force = false) => {
    if (!force && userScrolledUpRef.current) {
      return;
    }
    chatBottomRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
  };

  // When active conversation changes or new messages arrive
  useEffect(() => {
    if (activeConversation?.messages.length) {
      scrollToBottom(true, false);
    }
  }, [activeConversation?.messages.length, isGenerating]);

  // Scroll listener
  const handleScroll = () => {
    if (!chatScrollContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = chatScrollContainerRef.current;
    const distanceToBottom = scrollHeight - scrollTop - clientHeight;
    const isNearBottom = distanceToBottom < 160;

    userScrolledUpRef.current = !isNearBottom;
    setShowScrollBottom(!isNearBottom);
  };

  // Create New Chat
  const handleNewChat = () => {
    userScrolledUpRef.current = false;
    const newConv: Conversation = {
      id: `conv_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      title: 'Hội thoại học tập mới',
      messages: [],
      subject: currentSubject,
      grade: currentGrade,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    setConversations((prev) => [newConv, ...prev]);
    setCurrentId(newConv.id);
    showToast('Đã bắt đầu hội thoại mới!');
  };

  // Select a conversation
  const handleSelectConversation = (id: string) => {
    userScrolledUpRef.current = false;
    setCurrentId(id);
    const conv = conversations.find((c) => c.id === id);
    if (conv) {
      if (conv.subject) setCurrentSubject(conv.subject);
      if (conv.grade) setCurrentGrade(conv.grade);
    }
  };

  // Delete a conversation
  const handleDeleteConversation = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setConversations((prev) => {
      const updated = prev.filter((c) => c.id !== id);
      if (currentId === id) {
        setCurrentId(updated.length > 0 ? updated[0].id : null);
      }
      return updated;
    });
    showToast('Đã xóa cuộc trò chuyện.');
  };

  // Clear all history
  const handleClearAllHistory = () => {
    setConversations([]);
    setCurrentId(null);
    setHistoryOpen(false);
    showToast('Đã xóa toàn bộ lịch sử học tập.');
  };

  // Clear current active conversation messages
  const handleConfirmClearCurrentChat = () => {
    if (!currentId) return;
    setConversations((prev) =>
      prev.map((c) => (c.id === currentId ? { ...c, messages: [], updatedAt: Date.now() } : c))
    );
    setClearChatConfirmOpen(false);
    showToast('Đã xóa nội dung hội thoại hiện tại.');
  };

  // Toggle Theme
  const handleToggleDark = () => {
    const next = !isDark;
    setIsDark(next);
    const updatedSettings = { ...settings, theme: (next ? 'dark' : 'light') as 'light' | 'dark' };
    setSettings(updatedSettings);
    saveSettings(updatedSettings);
  };

  // Save Settings
  const handleSaveSettings = (newSettings: UserSettings) => {
    setSettings(newSettings);
    saveSettings(newSettings);
    if (newSettings.theme === 'dark') setIsDark(true);
    else if (newSettings.theme === 'light') setIsDark(false);
    else setIsDark(window.matchMedia('(prefers-color-scheme: dark)').matches);

    if (newSettings.defaultSubject) setCurrentSubject(newSettings.defaultSubject);
    if (newSettings.defaultGrade) setCurrentGrade(newSettings.defaultGrade);
  };

  // Stop Generation
  const handleStopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsGenerating(false);
    showToast('Đã dừng tạo câu trả lời.');
  };

  // Send Message using direct client-side AI service
  const handleSendMessage = async (
    text: string,
    attachment?: ImageAttachment,
    mode: ChatMode = currentMode,
    subject: string = currentSubject
  ) => {
    if ((!text.trim() && !attachment) || isGenerating) return;

    if (!settings.apiKey) {
      setOnboardingOpen(true);
      return;
    }

    userScrolledUpRef.current = false;

    // Target conversation
    let targetConvId = currentId;
    let targetConversation = activeConversation;

    if (!targetConversation || !targetConvId) {
      const newConv: Conversation = {
        id: `conv_${Date.now()}_${Math.random().toString(36).substring(7)}`,
        title: text ? text.slice(0, 32) + (text.length > 32 ? '...' : '') : 'Ảnh bài tập',
        messages: [],
        subject,
        grade: currentGrade,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      setConversations((prev) => [newConv, ...prev]);
      targetConvId = newConv.id;
      targetConversation = newConv;
      setCurrentId(newConv.id);
    }

    const userMessage: ChatMessageType = {
      id: `msg_${Date.now()}_user`,
      role: 'user',
      content: text,
      timestamp: Date.now(),
      attachment,
    };

    const isFirst = !targetConversation.messages || targetConversation.messages.length === 0;
    const newTitle = isFirst
      ? text
        ? text.slice(0, 36) + (text.length > 36 ? '...' : '')
        : 'Ảnh bài tập'
      : targetConversation.title;

    const updatedMessages = [...(targetConversation.messages || []), userMessage];

    setConversations((prev) =>
      prev.map((c) =>
        c.id === targetConvId
          ? {
              ...c,
              title: newTitle,
              messages: updatedMessages,
              subject,
              grade: currentGrade,
              updatedAt: Date.now(),
            }
          : c
      )
    );

    setIsGenerating(true);
    const controller = new AbortController();
    abortControllerRef.current = controller;

    const systemPrompt = buildSystemPrompt({
      subject,
      grade: currentGrade,
      mode,
    });

    const aiMessageId = `msg_${Date.now()}_ai`;
    // Dùng ref để có thể reset từ onModelFallback callback (fix BUG 3)
    let accumulatedText = '';

    const initialAiMessage: ChatMessageType = {
      id: aiMessageId,
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
      mode,
      subject,
      grade: currentGrade,
    };

    setConversations((prev) =>
      prev.map((c) =>
        c.id === targetConvId
          ? {
              ...c,
              messages: [...updatedMessages, initialAiMessage],
              updatedAt: Date.now(),
            }
          : c
      )
    );

    try {
      // Direct Client-Side AI Streaming with Automatic Fallback (No backend server required!)
      const result = await streamChatCompletion({
        apiKey: settings.apiKey,
        provider: settings.provider,
        model: settings.model,
        messages: updatedMessages.map((m) => ({
          role: m.role,
          content: m.content,
          attachment: m.attachment,
        })),
        systemPrompt,
        signal: controller.signal,
        onChunk: (chunkText) => {
          accumulatedText += chunkText;
          const currentText = accumulatedText;

          setConversations((prev) =>
            prev.map((c) =>
              c.id === targetConvId
                ? {
                    ...c,
                    messages: c.messages.map((m) =>
                      m.id === aiMessageId ? { ...m, content: currentText } : m
                    ),
                    updatedAt: Date.now(),
                  }
                : c
            )
          );
        },
        onModelFallback: (fromModel, toModel, _reason) => {
          showToast(`⚡ Model ${fromModel} quá tải. Đang tự động thử ${toModel}...`);
          // BUG 3 FIX: Reset accumulated text trong App khi fallback model
          // Tránh partial text từ model trước bị ghép vào response model sau
          accumulatedText = '';
          setConversations((prev) =>
            prev.map((c) =>
              c.id === targetConvId
                ? {
                    ...c,
                    messages: c.messages.map((m) =>
                      m.id === aiMessageId ? { ...m, content: '' } : m
                    ),
                    updatedAt: Date.now(),
                  }
                : c
            )
          );
        },
      });

      // Update final message with model used
      setConversations((prev) =>
        prev.map((c) =>
          c.id === targetConvId
            ? {
                ...c,
                messages: c.messages.map((m) =>
                  m.id === aiMessageId ? { ...m, modelUsed: result.modelUsed } : m
                ),
                updatedAt: Date.now(),
              }
            : c
        )
      );

      // Async Google Sheets logging
      if (settings.loggingEnabled && settings.sheetsUrl) {
        logToGoogleSheets(settings.sheetsUrl, {
          timestamp: new Date().toISOString(),
          subject,
          grade: currentGrade,
          mode,
          success: true,
          model: result.modelUsed,
        });
      }
    } catch (err: unknown) {
      if ((err as Error).name === 'AbortError') {
        console.log('Request stopped by student.');
        return;
      }

      const parsedErr = parseApiError(err);
      const rawDetails = err instanceof Error ? err.message : String(err);

      const errorMessage: ChatMessageType = {
        id: `msg_${Date.now()}_err`,
        role: 'assistant',
        content: `⚠️ Đã dừng do lỗi: ${parsedErr.message}`,
        timestamp: Date.now(),
        mode,
        subject,
        grade: currentGrade,
        isError: true,
        errorCode: parsedErr.type,
        errorDetails: rawDetails,
      };

      setConversations((prev) =>
        prev.map((c) =>
          c.id === targetConvId
            ? {
                ...c,
                messages: [
                  ...c.messages.filter((m) => m.id !== aiMessageId),
                  errorMessage,
                ],
                updatedAt: Date.now(),
              }
            : c
        )
      );

      if (settings.loggingEnabled && settings.sheetsUrl) {
        logToGoogleSheets(settings.sheetsUrl, {
          timestamp: new Date().toISOString(),
          subject,
          grade: currentGrade,
          mode,
          success: false,
          model: settings.model,
          errorType: parsedErr.type,
        });
      }
    } finally {
      setIsGenerating(false);
      abortControllerRef.current = null;
    }
  };

  // Retry previous question
  const handleRetryLast = () => {
    if (!activeConversation || activeConversation.messages.length === 0) return;
    const msgs = activeConversation.messages;

    let lastUserMsg: ChatMessageType | null = null;
    for (let i = msgs.length - 1; i >= 0; i--) {
      if (msgs[i].role === 'user') {
        lastUserMsg = msgs[i];
        break;
      }
    }

    if (!lastUserMsg) return;
    handleSendMessage(lastUserMsg.content, lastUserMsg.attachment, currentMode);
  };

  // Starter prompts
  const starterPrompts = [
    {
      subject: 'math',
      title: 'Toán học - Giải phương trình & Tọa độ',
      prompt: 'Hướng dẫn em tìm tập nghiệm của phương trình bậc hai: $2x^2 - 5x + 2 = 0$ và vẽ sơ đồ parabol.',
      icon: Calculator,
      color: 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200/60 dark:border-emerald-800/60',
    },
    {
      subject: 'literature',
      title: 'Ngữ văn - Lập dàn ý & Luận điểm',
      prompt: 'Anh Giáo ơi, hãy giúp em lập dàn ý chi tiết phân tích vẻ đẹp tâm hồn người chiến sĩ trong bài thơ "Tây Tiến" (Quang Dũng).',
      icon: BookOpen,
      color: 'text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50 border-amber-200/60 dark:border-amber-800/60',
    },
    {
      subject: 'english',
      title: 'Tiếng Anh - Ngữ pháp & Thì cơ bản',
      prompt: 'Giải thích giúp em cách phân biệt thì Present Perfect (Hiện tại hoàn thành) và Past Simple (Quá khứ đơn) kèm ví dụ bài tập có đáp án.',
      icon: Languages,
      color: 'text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/50 border-sky-200/60 dark:border-sky-800/60',
    },
    {
      subject: 'physics',
      title: 'Vật lý - Định luật bảo toàn & Chuyển động',
      prompt: 'Một vật có khối lượng $m = 2\\text{ kg}$ trượt không vận tốc đầu từ đỉnh mặt phẳng nghiêng cao $h = 5\\text{ m}$. Hãy tính vận tốc tại chân dốc khi bỏ qua ma sát.',
      icon: Atom,
      color: 'text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/50 border-teal-200/60 dark:border-teal-800/60',
    },
  ];

  return (
    <div className="pastel-app flex h-screen-dvh w-full overflow-hidden bg-slate-50 dark:bg-slate-950 font-sans antialiased text-slate-900 dark:text-slate-100">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-2xl bg-slate-900/95 dark:bg-white/95 text-white dark:text-slate-900 text-xs font-bold shadow-xl backdrop-blur-md animate-in fade-in slide-in-from-top-2 border border-slate-700/40 dark:border-slate-300/40">
          {toastMessage}
        </div>
      )}

      {/* Left Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        conversations={conversations}
        currentConversationId={currentId}
        onSelectConversation={handleSelectConversation}
        onNewChat={handleNewChat}
        onDeleteConversation={handleDeleteConversation}
        currentSubject={currentSubject}
        onSubjectChange={setCurrentSubject}
        currentGrade={currentGrade}
        onGradeChange={setCurrentGrade}
        onOpenSettings={() => setSettingsOpen(true)}
        onOpenInstructions={() => setInstructionsOpen(true)}
        onOpenAbout={() => setAboutOpen(true)}
        onOpenExamGenerator={() => setExamGeneratorOpen(true)}
        onOpenVirtualLab={() => setVirtualLabOpen(true)}
        onOpenFlashcards={() => setFlashcardOpen(true)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full min-w-0 bg-slate-50/70 dark:bg-slate-950 relative overflow-hidden">
        {/* Top Header */}
        <Header
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          onOpenSettings={() => setSettingsOpen(true)}
          onOpenHistory={() => setHistoryOpen(true)}
          onClearChat={() => {
            if (activeConversation && activeConversation.messages.length > 0) {
              setClearChatConfirmOpen(true);
            } else {
              showToast('Cuộc trò chuyện đang trống.');
            }
          }}
          isDark={isDark}
          onToggleDark={handleToggleDark}
          isGenerating={isGenerating}
          hasApiKey={Boolean(settings.apiKey)}
          currentConversation={activeConversation}
          onToast={showToast}
          onOpenExamGenerator={() => setExamGeneratorOpen(true)}
          onOpenVirtualLab={() => setVirtualLabOpen(true)}
          onOpenFlashcards={() => setFlashcardOpen(true)}
          onExportWord={() => {
            if (activeConversation && activeConversation.messages.length > 0) {
              exportConversationToWord(activeConversation);
              showToast('Đã xuất bài học sang tệp Word (.doc) chuẩn.');
            } else {
              showToast('Chưa có nội dung bài học để xuất Word.');
            }
          }}
        />

        {/* Saved Session Notification Banner */}
        {savedSessionNotice && (
          <div className="bg-emerald-50 dark:bg-emerald-950/60 border-b border-emerald-200/80 dark:border-emerald-800 px-4 py-1.5 flex items-center justify-between text-xs text-emerald-800 dark:text-emerald-300">
            <div className="flex items-center gap-1.5 font-medium">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{savedSessionNotice}</span>
            </div>
            <button
              onClick={() => {
                clearSessionBackup();
                setSavedSessionNotice(null);
              }}
              className="text-[11px] underline opacity-80 hover:opacity-100 cursor-pointer"
            >
              Đã hiểu
            </button>
          </div>
        )}

        {/* Scrollable Chat Area */}
        <main
          ref={chatScrollContainerRef}
          onScroll={handleScroll}
          className="chat-container flex-1 overflow-y-auto overflow-x-hidden p-2.5 sm:p-4 md:p-6 space-y-3 sm:space-y-4"
        >
          {/* Welcome Screen when conversation is empty */}
          {(!activeConversation || activeConversation.messages.length === 0) && (
            <LearningHome
              conversations={conversations}
              subject={currentSubject}
              grade={currentGrade}
              onSelectConversation={handleSelectConversation}
              onOpenHistory={() => setHistoryOpen(true)}
              onOpenSettings={() => setSettingsOpen(true)}
              onSubjectChange={setCurrentSubject}
              onGradeChange={setCurrentGrade}
              starters={starterPrompts}
              onStarter={(subject, prompt) => {
                setCurrentSubject(subject);
                handleSendMessage(prompt, undefined, currentMode, subject);
              }}
              onOpenExamGenerator={() => setExamGeneratorOpen(true)}
              onOpenVirtualLab={() => setVirtualLabOpen(true)}
              onOpenFlashcards={() => setFlashcardOpen(true)}
            />
          )}

          {/* Active Conversation Messages */}
          {activeConversation &&
            activeConversation.messages.map((msg, index) => {
              const isLast = index === activeConversation.messages.length - 1;
              return (
                <ChatMessage
                  key={msg.id || index}
                  message={msg}
                  onRetry={isLast && msg.role === 'assistant' ? handleRetryLast : undefined}
                  onToast={showToast}
                  onPreviewImage={(url) => setPreviewImageUrl(url)}
                />
              );
            })}

          {/* AI Thinking Animation */}
          {isGenerating && (
            <div className="w-full max-w-4xl mx-auto flex gap-2.5 sm:gap-4 py-2 px-1.5 sm:px-4 animate-in fade-in">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-600 text-white font-bold text-xs flex items-center justify-center shadow-xs">
                AG
              </div>
              <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex items-center gap-3 text-xs text-slate-600 dark:text-slate-400 shadow-2xs">
                <span className="flex gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-bounce [animation-delay:-0.3s]"></span>
                  <span className="w-2.5 h-2.5 rounded-full bg-teal-500 animate-bounce [animation-delay:-0.15s]"></span>
                  <span className="w-2.5 h-2.5 rounded-full bg-sky-500 animate-bounce"></span>
                </span>
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  Anh Giáo AI đang phân tích bài học và soạn lời giải chuẩn mực...
                </span>
              </div>
            </div>
          )}

          <div ref={chatBottomRef} className="h-4" />
        </main>

        {/* Floating Scroll to Bottom Button */}
        {showScrollBottom && (
          <button
            id="btn-scroll-bottom"
            onClick={() => {
              userScrolledUpRef.current = false;
              scrollToBottom(true, true);
            }}
            className="no-print absolute bottom-24 right-4 sm:right-8 z-20 flex items-center gap-1.5 px-3.5 py-2.5 rounded-full bg-white/95 dark:bg-slate-800/95 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 shadow-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-all duration-150 cursor-pointer active:scale-95 motion-reduce:transform-none backdrop-blur-xs text-xs font-semibold"
            title="Cuộn xuống dưới cùng"
          >
            <ArrowDown className="w-4 h-4 text-emerald-600" />
            <span className="hidden sm:inline">Xem câu trả lời mới</span>
          </button>
        )}

        {/* Bottom Composer */}
        <Composer
          onSendMessage={handleSendMessage}
          isGenerating={isGenerating}
          onStopGeneration={handleStopGeneration}
          currentMode={currentMode}
          onModeChange={setCurrentMode}
          onToast={showToast}
        />
      </div>

      {/* Clear Chat Confirmation Modal */}
      {clearChatConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-red-600 dark:text-red-400">
              <div className="p-3 rounded-2xl bg-red-50 dark:bg-red-950/60">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  Xóa cuộc trò chuyện?
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Tất cả tin nhắn trong hội thoại này sẽ bị xóa vĩnh viễn.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setClearChatConfirmOpen(false)}
                className="min-h-[40px] px-4 py-2 rounded-2xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer active:scale-95 transition-all"
              >
                Giữ lại
              </button>
              <button
                type="button"
                onClick={handleConfirmClearCurrentChat}
                className="min-h-[40px] px-4 py-2 rounded-2xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-xs cursor-pointer active:scale-95 transition-all"
              >
                Đồng ý xóa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      <SettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        settings={settings}
        onSave={handleSaveSettings}
        onToast={showToast}
      />

      {/* Onboarding API Key Modal */}
      <OnboardingKeyModal
        isOpen={onboardingOpen}
        onClose={() => setOnboardingOpen(false)}
        onSaveKey={(newKey) => {
          const updated = { ...settings, apiKey: newKey, geminiApiKey: newKey };
          handleSaveSettings(updated);
          showToast('✅ Đã cấu hình API Key thành công! Bắt đầu học nhé.');
        }}
      />

      {/* Instructions Modal */}
      <InstructionsModal
        isOpen={instructionsOpen}
        onClose={() => setInstructionsOpen(false)}
      />

      {/* About Modal */}
      <AboutModal isOpen={aboutOpen} onClose={() => setAboutOpen(false)} />

      {/* History Modal */}
      <HistoryModal
        isOpen={historyOpen}
        onClose={() => setHistoryOpen(false)}
        conversations={conversations}
        onSelectConversation={handleSelectConversation}
        onDeleteConversation={handleDeleteConversation}
        onClearAllHistory={handleClearAllHistory}
      />

      {/* Image Preview Modal */}
      <ImagePreviewModal
        imageUrl={previewImageUrl}
        onClose={() => setPreviewImageUrl(null)}
      />

      {/* Virtual Lab Modal */}
      <VirtualLabModal
        isOpen={virtualLabOpen}
        onClose={() => setVirtualLabOpen(false)}
        onToast={showToast}
      />

      {/* Flashcard SM-2 Modal */}
      <FlashcardModal
        isOpen={flashcardOpen}
        onClose={() => setFlashcardOpen(false)}
        onToast={showToast}
      />

      {/* Exam Generator Modal */}
      <ExamGeneratorModal
        isOpen={examGeneratorOpen}
        onClose={() => setExamGeneratorOpen(false)}
        settings={settings}
        onStartQuiz={(exam) => {
          setActiveExam(exam);
          setQuizModalOpen(true);
        }}
        onToast={showToast}
      />

      {/* Interactive Quiz Runner Modal */}
      <InteractiveQuizModal
        isOpen={quizModalOpen}
        onClose={() => setQuizModalOpen(false)}
        exam={activeExam}
        onToast={showToast}
      />
    </div>
  );
}

