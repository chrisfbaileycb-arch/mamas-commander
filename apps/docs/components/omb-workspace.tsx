'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  Plus,
  CalendarClock,
  Blocks,
  ShieldCheck,
  Package,
  Settings,
  Monitor,
  Activity,
  Sliders,
  Send,
  Paperclip,
  Phone,
  PhoneOff,
  Check,
  X,
  Terminal,
  Sparkles,
  BookOpen,
  Search,
  ChevronRight,
  Download,
  AlertTriangle,
  Cpu,
  MessageSquare,
} from 'lucide-react';
import {
  INITIAL_WORKSPACE_STATE,
  type ApprovalMode,
  type BotProfile,
  type RoutineItem,
  type WorkspaceState,
} from '@/lib/omb-data';
import { OmbMascot } from './omb-mascot';
import { OmbRightDrawer } from './omb-drawers';
import {
  AutomationsView,
  ConnectedAppsView,
  WorkflowsAndSkillsView,
  TemplatesAndDataView,
} from './omb-views';
import { SettingsModal, NewBotModal } from './omb-modals';

type MainTab = 'chat' | 'automations' | 'apps' | 'workflows' | 'templates';
type RightDrawer = 'computer' | 'inspector' | 'profile' | null;

const APPROVAL_OPTIONS: { id: ApprovalMode; label: string }[] = [
  { id: 'ask', label: 'Ask' },
  { id: 'edits', label: 'Edits' },
  { id: 'auto', label: 'Auto' },
  { id: 'full', label: 'Full' },
  { id: 'custom', label: 'Custom' },
];

export function OmbWorkspace() {
  const [state, setState] = useState<WorkspaceState>(INITIAL_WORKSPACE_STATE);
  const [selectedBotId, setSelectedBotId] = useState<string>(
    INITIAL_WORKSPACE_STATE.bots[0]?.id ?? 'bot-bramble'
  );
  const [selectedThreadId, setSelectedThreadId] = useState<string>(
    INITIAL_WORKSPACE_STATE.threads[0]?.id ?? 'thread-bramble-main'
  );
  const [loaded, setLoaded] = useState(false);
  const [activeTab, setActiveTab] = useState<MainTab>('chat');
  const [rightDrawer, setRightDrawer] = useState<RightDrawer>('computer');
  const [promptInput, setPromptInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [runningRoutineId, setRunningRoutineId] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showNewBot, setShowNewBot] = useState(false);
  const [showRepoSplit, setShowRepoSplit] = useState(false);
  const [repoSplitMsg, setRepoSplitMsg] = useState<string | null>(
    'Part 1 (~850 KB) is active in the workspace so GitHub publish succeeds immediately.'
  );
  const [repoSplitBusy, setRepoSplitBusy] = useState(false);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [commandQuery, setCommandQuery] = useState('');
  const [inVoiceCall, setInVoiceCall] = useState(false);
  const [attachedFileNames, setAttachedFileNames] = useState<string[]>([]);
  const [syncIndicator, setSyncIndicator] = useState<'synced' | 'saving'>('synced');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/omb/state')
      .then((res) => res.json())
      .then((data: WorkspaceState) => {
        if (!cancelled && data && Array.isArray(data.bots)) {
          setState(data);
          if (data.bots[0] && !data.bots.some((b) => b.id === selectedBotId)) {
            setSelectedBotId(data.bots[0].id);
          }
          if (data.threads[0] && !data.threads.some((t) => t.id === selectedThreadId)) {
            setSelectedThreadId(data.threads[0].id);
          }
        }
        if (!cancelled) setLoaded(true);
      })
      .catch(() => {
        if (!cancelled) setLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setShowCommandPalette((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const persistState = (updater: (prev: WorkspaceState) => WorkspaceState) => {
    setState((prev) => {
      const next = updater(prev);
      setSyncIndicator('saving');
      fetch('/api/omb/state', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(next),
      })
        .then((r) => r.json())
        .then(() => {
          setSyncIndicator('synced');
        })
        .catch(() => {
          setSyncIndicator('synced');
        });
      return next;
    });
  };

  const activeBot =
    state.bots.find((b) => b.id === selectedBotId) || state.bots[0];
  const botThreads = state.threads.filter((t) => t.botId === activeBot.id);
  const activeThread =
    state.threads.find((t) => t.id === selectedThreadId) ||
    botThreads[0] ||
    state.threads[0];

  const handleSelectBot = (botId: string) => {
    setSelectedBotId(botId);
    const threadsForBot = state.threads.filter((t) => t.botId === botId);
    if (threadsForBot.length > 0) {
      setSelectedThreadId(threadsForBot[0].id);
    } else {
      const createdId = `thread-${Date.now()}`;
      setSelectedThreadId(createdId);
      persistState((prev) => ({
        ...prev,
        threads: [
          {
            id: createdId,
            botId,
            title: 'Main Task Session',
            updatedAt: 'Just now',
            status: 'idle',
            messages: [],
          },
          ...prev.threads,
        ],
      }));
    }
    setActiveTab('chat');
  };

  const handleCreateTaskThread = (botId: string, customTitle?: string) => {
    const newThreadId = `thread-${Date.now()}`;
    const title =
      customTitle ||
      `Task #${state.threads.filter((t) => t.botId === botId).length + 1}`;
    setSelectedBotId(botId);
    setSelectedThreadId(newThreadId);
    persistState((prev) => ({
      ...prev,
      threads: [
        {
          id: newThreadId,
          botId,
          title,
          updatedAt: 'Just now',
          status: 'idle',
          messages: [],
        },
        ...prev.threads,
      ],
    }));
    setActiveTab('chat');
  };

  const handleSendMessage = async (overridePrompt?: string) => {
    const textToSend = (overridePrompt ?? promptInput).trim();
    if (!textToSend || isSending || !activeThread) return;

    const attachmentsPrefix =
      attachedFileNames.length > 0
        ? `[Attached files: ${attachedFileNames.join(', ')}]\n`
        : '';
    const finalPrompt = `${attachmentsPrefix}${textToSend}`;

    if (!overridePrompt) {
      setPromptInput('');
      setAttachedFileNames([]);
    }
    setIsSending(true);

    try {
      let directLocalReply:
        | { content: string; model: string; endpoint: string }
        | undefined;

      if (activeBot.engineId === 'localhost-model' || activeBot.engineId === 'pi') {
        const localCfg = state.localhostConfig ?? {
          baseUrl: 'http://127.0.0.1:11434/v1',
          modelName: activeBot.model || 'llama3.3:latest',
          autoFallbackToApi: true,
        };
        const cleanBase = localCfg.baseUrl.replace(/\/+$/, '');
        const targetModel = localCfg.modelName || activeBot.model || 'llama3.3:latest';
        try {
          const controller = new AbortController();
          const timer = setTimeout(() => controller.abort(), 6000);
          const localRes = await fetch(`${cleanBase}/chat/completions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            signal: controller.signal,
            body: JSON.stringify({
              model: targetModel,
              messages: [
                {
                  role: 'system',
                  content: `You are ${activeBot.name} (${activeBot.title}) in OpenMausBot.\nInstructions: ${activeBot.instructions}\nMemory:\n${activeBot.memoryMd}`,
                },
                { role: 'user', content: finalPrompt },
              ],
            }),
          });
          clearTimeout(timer);
          if (localRes.ok) {
            const localJson = (await localRes.json()) as {
              choices?: Array<{ message?: { content?: string } }>;
            };
            const text = localJson.choices?.[0]?.message?.content?.trim();
            if (text) {
              directLocalReply = {
                content: text,
                model: targetModel,
                endpoint: cleanBase,
              };
            }
          }
        } catch {
          directLocalReply = undefined;
        }
      }

      const res = await fetch('/api/omb/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          threadId: activeThread.id,
          message: finalPrompt,
          viaCall: inVoiceCall,
          directLocalReply,
        }),
      });
      const data = await res.json();
      if (data.state) {
        setState(data.state);
        if (inVoiceCall && typeof window !== 'undefined' && 'speechSynthesis' in window) {
          const updatedThread = (data.state as WorkspaceState).threads.find(
            (t) => t.id === activeThread.id
          );
          const lastMsg = updatedThread?.messages[updatedThread.messages.length - 1];
          if (lastMsg && lastMsg.role === 'assistant') {
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(
              lastMsg.content.replace(/[#*`_~]/g, '').slice(0, 260)
            );
            window.speechSynthesis.speak(utterance);
          }
        }
      }
    } finally {
      setIsSending(false);
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 80);
    }
  };

  const handleResolveApproval = async (
    messageId: string,
    decision: 'approved_once' | 'approved_session' | 'approved_always' | 'denied'
  ) => {
    if (!activeThread) return;
    setIsSending(true);
    try {
      const res = await fetch('/api/omb/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          threadId: activeThread.id,
          approvalDecision: {
            messageId,
            decision,
            decidedBy: inVoiceCall ? 'voice' : 'person',
          },
        }),
      });
      const data = await res.json();
      if (data.state) {
        setState(data.state);
      }
    } finally {
      setIsSending(false);
    }
  };

  const handleRunRoutineNow = async (routine: RoutineItem) => {
    setRunningRoutineId(routine.id);
    try {
      const res = await fetch('/api/omb/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          threadId: routine.postResultsToThreadId,
          routineId: routine.id,
          message: `[Routine Triggered: ${routine.title}] ${routine.instructions}`,
        }),
      });
      const data = await res.json();
      if (data.state) {
        setState(data.state);
      }
    } finally {
      setRunningRoutineId(null);
    }
  };

  const handleTriggerWebhook = async (webhookId: string, payloadJson: string) => {
    const wh = state.webhooks.find((w) => w.id === webhookId);
    const targetThread =
      state.threads.find((t) => t.botId === wh?.botId) ?? state.threads[0];
    if (!wh || !targetThread) return;
    setRunningRoutineId(webhookId);
    try {
      const res = await fetch('/api/omb/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          threadId: targetThread.id,
          webhookId,
          webhookPayload: payloadJson,
          message: `[Inbound Webhook: ${wh.slug}] ${wh.instructions}\nPayload: ${payloadJson}`,
        }),
      });
      const data = await res.json();
      if (data.state) {
        setState(data.state);
      }
    } finally {
      setRunningRoutineId(null);
    }
  };

  const handleResetWorkspace = async () => {
    const res = await fetch('/api/omb/state', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'reset' }),
    });
    const data = await res.json();
    if (data && Array.isArray(data.bots)) {
      setState(data);
    }
  };

  const handleQuickExportOmb = () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `openmausbot-cloud-${new Date().toISOString().slice(0, 10)}.omb.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const updateActiveBot = (updater: (bot: BotProfile) => BotProfile) => {
    persistState((prev) => ({
      ...prev,
      bots: prev.bots.map((b) => (b.id === activeBot.id ? updater(b) : b)),
    }));
  };

  const pendingApprovalsCount = state.threads.reduce(
    (acc, t) =>
      acc +
      t.messages.filter((m) => m.approvalCard?.status === 'pending').length,
    0
  );

  const allModels = state.engines.flatMap((eng) =>
    eng.models.map((m) => ({
      id: m.id,
      label: m.label,
      engineId: eng.id,
      engineName: eng.name,
    }))
  );

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#0b0c0e] text-zinc-100 select-none">
      <aside className="flex w-64 shrink-0 flex-col justify-between border-r border-zinc-800/80 bg-[#0f1014]">
        <div className="flex flex-1 flex-col overflow-hidden">
          <div className="flex items-center justify-between border-b border-zinc-800/80 px-3.5 py-3">
            <div className="flex items-center gap-2.5">
              <OmbMascot color="#F59E0B" shape="mascot" expression={0} size="sm" />
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-bold tracking-tight text-zinc-100">
                    Mama&apos;s Agent
                  </span>
                  <span className="rounded bg-amber-500/15 px-1.5 py-0.5 font-mono text-[9px] font-semibold text-amber-300">
                    CLOUD
                  </span>
                </div>
                <div className="flex items-center gap-1 text-[10px] text-zinc-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  <span>{state.activeEnv}</span>
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowCommandPalette(true)}
              title="Command Palette (Cmd+K)"
              className="flex items-center gap-1 rounded-md border border-zinc-800 bg-zinc-900/90 px-2 py-1 text-[10px] text-zinc-400 hover:border-zinc-700 hover:text-zinc-200"
            >
              <Search className="h-3 w-3" />
              <span>⌘K</span>
            </button>
          </div>

          <div className="space-y-0.5 border-b border-zinc-800/80 p-2">
            <button
              type="button"
              onClick={() => setActiveTab('chat')}
              className={`flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-xs font-medium transition ${
                activeTab === 'chat'
                  ? 'bg-zinc-800/90 text-zinc-100'
                  : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
              }`}
            >
              <span className="flex items-center gap-2">
                <MessageSquare className="h-3.5 w-3.5 text-amber-400" />
                Chat & Task Threads
              </span>
              {pendingApprovalsCount > 0 && (
                <span className="rounded-full bg-amber-500 px-1.5 py-0.2 text-[10px] font-bold text-zinc-950">
                  {pendingApprovalsCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('automations')}
              className={`flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-xs font-medium transition ${
                activeTab === 'automations'
                  ? 'bg-zinc-800/90 text-zinc-100'
                  : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
              }`}
            >
              <span className="flex items-center gap-2">
                <CalendarClock className="h-3.5 w-3.5 text-emerald-400" />
                Tasks & Routines
              </span>
              <span className="font-mono text-[10px] text-zinc-500">
                {state.routines.filter((r) => r.enabled).length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('apps')}
              className={`flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-xs font-medium transition ${
                activeTab === 'apps'
                  ? 'bg-zinc-800/90 text-zinc-100'
                  : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
              }`}
            >
              <span className="flex items-center gap-2">
                <Blocks className="h-3.5 w-3.5 text-sky-400" />
                Connected Apps
              </span>
              <span className="font-mono text-[10px] text-zinc-500">
                {state.composioServices.reduce((acc, a) => acc + a.accounts.length, 0)}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('workflows')}
              className={`flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-xs font-medium transition ${
                activeTab === 'workflows'
                  ? 'bg-zinc-800/90 text-zinc-100'
                  : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
              }`}
            >
              <span className="flex items-center gap-2">
                <ShieldCheck className="h-3.5 w-3.5 text-purple-400" />
                Skills, Verify & CI
              </span>
              <span className="rounded bg-purple-500/15 px-1.5 py-0.2 font-mono text-[9px] text-purple-300">
                13 YML
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('templates')}
              className={`flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-xs font-medium transition ${
                activeTab === 'templates'
                  ? 'bg-zinc-800/90 text-zinc-100'
                  : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
              }`}
            >
              <span className="flex items-center gap-2">
                <Package className="h-3.5 w-3.5 text-pink-400" />
                Templates & Data
              </span>
              <span className="font-mono text-[10px] text-zinc-500">.omb</span>
            </button>
          </div>

          <div className="flex items-center justify-between px-3.5 pt-3 pb-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
              Bots & Team Chiefs ({state.bots.length})
            </span>
            <button
              type="button"
              onClick={() => setShowNewBot(true)}
              className="flex items-center gap-1 rounded bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-amber-300 hover:bg-amber-500/25"
            >
              <Plus className="h-3 w-3" />
              New Bot
            </button>
          </div>

          <div className="flex-1 space-y-1 overflow-y-auto px-2 pb-3">
            {state.bots.map((bot) => {
              const isSelected = bot.id === activeBot.id;
              const threads = state.threads.filter((t) => t.botId === bot.id);
              return (
                <div
                  key={bot.id}
                  className={`rounded-lg border transition ${
                    isSelected
                      ? 'border-zinc-700/80 bg-zinc-900/90'
                      : 'border-transparent hover:bg-zinc-900/40'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => handleSelectBot(bot.id)}
                    className="flex w-full items-center justify-between px-2.5 py-2 text-left"
                  >
                    <div className="flex min-w-0 items-center gap-2.5">
                      <OmbMascot
                        color={bot.color}
                        shape={bot.shape}
                        expression={bot.expression}
                        size="sm"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="truncate text-xs font-semibold text-zinc-100">
                            {bot.name}
                          </span>
                          {bot.isChief && (
                            <span className="rounded bg-amber-500/20 px-1 py-0.2 text-[9px] font-bold uppercase text-amber-300">
                              Chief
                            </span>
                          )}
                        </div>
                        <div className="truncate font-mono text-[10px] text-zinc-400">
                          {bot.title} · {bot.computerMode}
                        </div>
                      </div>
                    </div>
                  </button>

                  {isSelected && (
                    <div className="border-t border-zinc-800/80 px-2 py-1.5">
                      <div className="mb-1 flex items-center justify-between px-1">
                        <span className="text-[10px] font-medium text-zinc-500">
                          Task Threads ({threads.length})
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCreateTaskThread(bot.id)}
                          className="flex items-center gap-0.5 text-[10px] font-medium text-amber-400 hover:text-amber-300"
                        >
                          <Plus className="h-2.5 w-2.5" />
                          Task
                        </button>
                      </div>
                      <div className="space-y-0.5">
                        {threads.map((thread) => {
                          const isThreadActive =
                            thread.id === activeThread?.id && activeTab === 'chat';
                          const hasPendingApproval = thread.messages.some(
                            (m) => m.approvalCard?.status === 'pending'
                          );
                          return (
                            <button
                              key={thread.id}
                              type="button"
                              onClick={() => {
                                setSelectedThreadId(thread.id);
                                setActiveTab('chat');
                              }}
                              className={`flex w-full items-center justify-between rounded px-2 py-1 text-left text-[11px] transition ${
                                isThreadActive
                                  ? 'bg-amber-500/15 font-medium text-amber-300'
                                  : 'text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-200'
                              }`}
                            >
                              <span className="truncate">{thread.title}</span>
                              {hasPendingApproval ? (
                                <span className="h-2 w-2 shrink-0 rounded-full bg-amber-400" />
                              ) : (
                                <span className="ml-1 shrink-0 font-mono text-[9px] text-zinc-500">
                                  {thread.messages.length}
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="border-t border-zinc-800/80 bg-[#0b0c0f] p-2.5 space-y-2">
          <div className="rounded-lg border border-zinc-800/90 bg-zinc-900/50 p-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                <span className="text-[11px] font-semibold text-zinc-200">
                  My Cloud Box
                </span>
              </div>
              <span className="font-mono text-[10px] text-emerald-400">
                {syncIndicator === 'saving' ? 'Syncing...' : 'Persisted'}
              </span>
            </div>
            <div className="mt-0.5 truncate font-mono text-[10px] text-zinc-400">
              omb-cloud-us-east-01.maus.cloud
            </div>
            <div className="mt-2 flex gap-1.5">
              <button
                type="button"
                onClick={handleQuickExportOmb}
                className="flex flex-1 items-center justify-center gap-1 rounded bg-zinc-800 px-2 py-1 text-[10px] font-medium text-zinc-200 hover:bg-zinc-700"
              >
                <Download className="h-3 w-3" />
                Export .omb
              </button>
              <button
                type="button"
                onClick={() => setShowRepoSplit(true)}
                className="flex flex-1 items-center justify-center gap-1 rounded border border-amber-500/40 bg-amber-500/15 px-2 py-1 text-[10px] font-semibold text-amber-300 hover:bg-amber-500/25"
              >
                <Package className="h-3 w-3" />
                Part 1 / 2 Push
              </button>
              <Link
                href="/docs"
                className="flex items-center justify-center gap-1 rounded border border-zinc-800 bg-zinc-950 px-2 py-1 text-[10px] font-medium text-zinc-300 hover:border-zinc-700 hover:text-zinc-100"
              >
                <BookOpen className="h-3 w-3" />
                Docs
              </Link>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowSettings(true)}
            className="flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-xs text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200"
          >
            <span className="flex items-center gap-2">
              <Settings className="h-3.5 w-3.5" />
              Workspace Settings
            </span>
            <span className="font-mono text-[10px] text-zinc-500">v0.14</span>
          </button>
        </div>
      </aside>

      <div className="flex flex-1 flex-col overflow-hidden">
        {activeTab === 'chat' && (
          <>
            <header className="flex h-14 shrink-0 items-center justify-between border-b border-zinc-800/80 bg-[#0f1014] px-4">
              <div className="flex min-w-0 items-center gap-3">
                <button
                  type="button"
                  onClick={() =>
                    setRightDrawer((prev) => (prev === 'profile' ? null : 'profile'))
                  }
                  className="flex items-center gap-2.5 rounded-lg px-2 py-1 hover:bg-zinc-800/70"
                >
                  <OmbMascot
                    color={activeBot.color}
                    shape={activeBot.shape}
                    expression={activeBot.expression}
                    size="sm"
                  />
                  <div className="text-left">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-semibold text-zinc-100">
                        {activeBot.name}
                      </span>
                      {activeBot.isChief && (
                        <span className="rounded bg-amber-500/20 px-1.5 py-0.2 text-[9px] font-bold uppercase text-amber-300">
                          Team Chief
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-zinc-400">
                      {activeThread?.title || 'Task Session'} ·{' '}
                      <span className="font-mono">{activeBot.workingFolder}</span>
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleCreateTaskThread(activeBot.id)}
                  className="flex items-center gap-1 rounded-md border border-zinc-800 bg-zinc-900 px-2.5 py-1 text-xs font-medium text-zinc-300 hover:border-zinc-700 hover:text-zinc-100"
                >
                  <Plus className="h-3.5 w-3.5 text-amber-400" />
                  New Task
                </button>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex items-center rounded-lg border border-zinc-800 bg-zinc-900/90 p-0.5">
                  <button
                    type="button"
                    onClick={() =>
                      updateActiveBot((b) => ({
                        ...b,
                        engineId: 'api-connected',
                        model: 'gemini-3-flash-preview',
                      }))
                    }
                    className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] font-medium transition ${
                      activeBot.engineId === 'api-connected'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    API Connected
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      updateActiveBot((b) => ({
                        ...b,
                        engineId: 'localhost-model',
                        model: state.localhostConfig?.modelName || 'llama3.3:latest',
                      }))
                    }
                    className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] font-medium transition ${
                      activeBot.engineId === 'localhost-model' || activeBot.engineId === 'pi'
                        ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                        : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-sky-400" />
                    Localhost Model
                  </button>
                </div>

                <div className="flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900/90 px-2.5 py-1">
                  <Cpu className="h-3.5 w-3.5 text-amber-400" />
                  <select
                    aria-label="Bot Model"
                    value={activeBot.model}
                    onChange={(e) => {
                      const found = allModels.find((m) => m.id === e.target.value);
                      updateActiveBot((b) => ({
                        ...b,
                        model: e.target.value,
                        engineId: found?.engineId ?? b.engineId,
                      }));
                    }}
                    className="max-w-[180px] truncate bg-transparent text-xs font-medium text-zinc-200 focus:outline-none"
                  >
                    {allModels.map((m) => (
                      <option key={`${m.engineId}-${m.id}`} value={m.id} className="bg-zinc-900 text-zinc-100">
                        {m.label} ({m.engineName})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-1 rounded-lg border border-zinc-800 bg-zinc-900/90 px-2 py-1">
                  <span className="text-[10px] text-zinc-400">Approval:</span>
                  <select
                    aria-label="Approval Mode"
                    value={activeBot.approvalMode}
                    onChange={(e) =>
                      updateActiveBot((b) => ({
                        ...b,
                        approvalMode: e.target.value as ApprovalMode,
                      }))
                    }
                    className="bg-transparent text-xs font-semibold text-amber-300 focus:outline-none"
                  >
                    {APPROVAL_OPTIONS.map((lvl) => (
                      <option key={lvl.id} value={lvl.id} className="bg-zinc-900 text-zinc-100">
                        {lvl.label}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  type="button"
                  onClick={() => setInVoiceCall((prev) => !prev)}
                  className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium transition ${
                    inVoiceCall
                      ? 'border-emerald-500/50 bg-emerald-500/20 text-emerald-300'
                      : 'border-zinc-800 bg-zinc-900 text-zinc-300 hover:bg-zinc-800'
                  }`}
                >
                  {inVoiceCall ? (
                    <>
                      <PhoneOff className="h-3.5 w-3.5 text-emerald-400" />
                      Live Call
                    </>
                  ) : (
                    <>
                      <Phone className="h-3.5 w-3.5" />
                      Call
                    </>
                  )}
                </button>

                <div className="ml-1 flex items-center rounded-lg border border-zinc-800 bg-zinc-900/80 p-0.5">
                  <button
                    type="button"
                    onClick={() =>
                      setRightDrawer((prev) => (prev === 'profile' ? null : 'profile'))
                    }
                    title="Agent Profile, Memory & Skills"
                    className={`flex items-center gap-1 rounded-md px-2 py-1 text-xs transition ${
                      rightDrawer === 'profile'
                        ? 'bg-zinc-800 text-amber-300 font-medium'
                        : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    <Sliders className="h-3.5 w-3.5" />
                    <span className="hidden xl:inline">Profile</span>
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setRightDrawer((prev) => (prev === 'computer' ? null : 'computer'))
                    }
                    title="Computer Panel (Browser & Shell)"
                    className={`flex items-center gap-1 rounded-md px-2 py-1 text-xs transition ${
                      rightDrawer === 'computer'
                        ? 'bg-zinc-800 text-amber-300 font-medium'
                        : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    <Monitor className="h-3.5 w-3.5" />
                    <span className="hidden xl:inline">Computer</span>
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setRightDrawer((prev) => (prev === 'inspector' ? null : 'inspector'))
                    }
                    title="Runtime Contract Inspector"
                    className={`flex items-center gap-1 rounded-md px-2 py-1 text-xs transition ${
                      rightDrawer === 'inspector'
                        ? 'bg-zinc-800 text-amber-300 font-medium'
                        : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    <Activity className="h-3.5 w-3.5" />
                    <span className="hidden xl:inline">Inspector</span>
                  </button>
                </div>
              </div>
            </header>

            {(activeBot.engineId === 'localhost-model' || activeBot.engineId === 'pi') && (
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-sky-500/30 bg-sky-500/10 px-4 py-1.5 text-xs">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-sky-400" />
                  <span className="font-semibold text-sky-200">
                    Localhost Bridge Active:
                  </span>
                  <input
                    type="text"
                    aria-label="Localhost Endpoint URL"
                    value={state.localhostConfig?.baseUrl ?? 'http://127.0.0.1:11434/v1'}
                    onChange={(e) =>
                      persistState((prev) => ({
                        ...prev,
                        localhostConfig: {
                          baseUrl: e.target.value,
                          modelName: prev.localhostConfig?.modelName ?? activeBot.model,
                          autoFallbackToApi: prev.localhostConfig?.autoFallbackToApi ?? true,
                        },
                      }))
                    }
                    className="w-52 rounded border border-sky-500/30 bg-zinc-950/90 px-2 py-0.5 font-mono text-[11px] text-sky-200"
                  />
                  <input
                    type="text"
                    aria-label="Localhost Model Identifier"
                    value={state.localhostConfig?.modelName ?? activeBot.model}
                    onChange={(e) => {
                      const val = e.target.value;
                      persistState((prev) => ({
                        ...prev,
                        localhostConfig: {
                          baseUrl: prev.localhostConfig?.baseUrl ?? 'http://127.0.0.1:11434/v1',
                          modelName: val,
                          autoFallbackToApi: prev.localhostConfig?.autoFallbackToApi ?? true,
                        },
                        bots: prev.bots.map((b) =>
                          b.id === activeBot.id ? { ...b, model: val } : b
                        ),
                      }));
                    }}
                    className="w-40 rounded border border-sky-500/30 bg-zinc-950/90 px-2 py-0.5 font-mono text-[11px] text-sky-200"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-sky-300/90">
                    Direct browser → 127.0.0.1 (auto-bridges to API Connected if offline)
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowSettings(true)}
                    className="rounded bg-sky-500/20 px-2 py-0.5 text-[11px] font-medium text-sky-200 hover:bg-sky-500/30"
                  >
                    Configure Ports
                  </button>
                </div>
              </div>
            )}

            {inVoiceCall && (
              <div className="flex items-center justify-between border-b border-emerald-500/30 bg-emerald-500/10 px-4 py-2">
                <div className="flex items-center gap-2.5">
                  <span className="h-2.5 w-2.5 animate-ping rounded-full bg-emerald-400" />
                  <span className="text-xs font-medium text-emerald-200">
                    Voice Call Active with {activeBot.name} — responses will be spoken aloud via browser synthesis
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      handleSendMessage(
                        'Give me a concise 2-sentence voice briefing on our current tasks and any blockers.'
                      )
                    }
                    className="rounded bg-emerald-500 px-2.5 py-1 text-xs font-semibold text-zinc-950 hover:bg-emerald-400"
                  >
                    Ask for Voice Briefing
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
                        window.speechSynthesis.cancel();
                      }
                      setInVoiceCall(false);
                    }}
                    className="rounded bg-zinc-800 px-2.5 py-1 text-xs text-zinc-300 hover:bg-zinc-700"
                  >
                    End Call
                  </button>
                </div>
              </div>
            )}

            <div className="flex flex-1 overflow-hidden">
              <div className="flex flex-1 flex-col overflow-hidden">
                <div className="flex-1 overflow-y-auto p-6 space-y-5">
                  {!loaded ? (
                    <div className="flex h-40 items-center justify-center text-xs text-zinc-400">
                      Loading OpenMausBot Cloud Workspace...
                    </div>
                  ) : !activeThread || activeThread.messages.length === 0 ? (
                    <div className="mx-auto my-8 max-w-2xl text-center">
                      <div className="mx-auto mb-3 flex justify-center">
                        <OmbMascot
                          color={activeBot.color}
                          shape={activeBot.shape}
                          expression={activeBot.expression}
                          size="xl"
                        />
                      </div>
                      <h2 className="text-lg font-bold text-zinc-100">
                        {activeBot.name}
                      </h2>
                      <p className="mt-1 text-xs text-zinc-400">
                        {activeBot.description}
                      </p>
                      <div className="mt-2 inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900/90 px-3 py-1 text-[11px] text-zinc-300">
                        <span>Computer: <strong className="text-amber-300">{activeBot.computerMode}</strong></span>
                        <span>·</span>
                        <span>Approval: <strong className="text-emerald-300">{activeBot.approvalMode}</strong></span>
                        <span>·</span>
                        <span>Skills: <strong>{activeBot.skills.filter((s) => s.enabled).length} active</strong></span>
                      </div>

                      <div className="mt-6 grid grid-cols-1 gap-2.5 text-left sm:grid-cols-2">
                        {[
                          {
                            title: 'Verify isolated fixture health',
                            prompt:
                              'Run the isolated fixture verification checklist from docs/verification/README.md and report runtime invariant status.',
                          },
                          {
                            title: 'Delegate multi-bot release audit',
                            prompt:
                              'Coordinate with @Pip and @Sorrel to audit our latest release changelog, inspect cloud-buy-preview.html, and summarize findings.',
                          },
                          {
                            title: 'Test Approval Card workflow',
                            prompt:
                              'Deploy the production Cloudflare worker and push the release tag (trigger an approval check first).',
                          },
                          {
                            title: 'Inspect DuckDB & Memory notes',
                            prompt:
                              'Summarize your current MEMORY.md instructions and list what connected Composio apps you can use.',
                          },
                        ].map((card) => (
                          <button
                            key={card.title}
                            type="button"
                            onClick={() => handleSendMessage(card.prompt)}
                            className="group rounded-xl border border-zinc-800/90 bg-zinc-900/50 p-3.5 text-left transition hover:border-amber-500/40 hover:bg-zinc-900"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-semibold text-zinc-200 group-hover:text-amber-300">
                                {card.title}
                              </span>
                              <ChevronRight className="h-3.5 w-3.5 text-zinc-500 group-hover:text-amber-400" />
                            </div>
                            <p className="mt-1 line-clamp-2 text-[11px] text-zinc-400">
                              {card.prompt}
                            </p>
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    activeThread.messages.map((msg) => {
                      const senderBot =
                        state.bots.find((b) => b.id === msg.senderBotId) || activeBot;
                      return (
                        <div
                          key={msg.id}
                          className={`flex gap-3.5 ${
                            msg.role === 'user' ? 'justify-end' : 'justify-start'
                          }`}
                        >
                          {msg.role !== 'user' && (
                            <OmbMascot
                              color={senderBot.color}
                              shape={senderBot.shape}
                              expression={senderBot.expression}
                              size="sm"
                              className="mt-0.5"
                            />
                          )}

                          <div
                            className={`max-w-2xl rounded-xl border p-4 ${
                              msg.role === 'user'
                                ? 'border-amber-500/30 bg-amber-500/10 text-zinc-100'
                                : 'border-zinc-800/90 bg-zinc-900/75 text-zinc-200'
                            }`}
                          >
                            <div className="mb-1.5 flex items-center justify-between gap-4">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-semibold text-zinc-100">
                                  {msg.role === 'user'
                                    ? 'You'
                                    : msg.senderName || senderBot.name}
                                </span>
                                {msg.viaCall && (
                                  <span className="rounded bg-emerald-500/20 px-1.5 py-0.5 text-[10px] font-medium text-emerald-300">
                                    Voice Call
                                  </span>
                                )}
                              </div>
                              <span className="font-mono text-[10px] text-zinc-400">
                                {msg.timestamp}
                              </span>
                            </div>

                            {msg.toolCalls && msg.toolCalls.length > 0 && (
                              <div className="mb-2.5 space-y-1.5">
                                {msg.toolCalls.map((tc) => (
                                  <div
                                    key={tc.id}
                                    className="rounded-lg border border-zinc-800 bg-zinc-950/90 p-2.5 font-mono text-[11px]"
                                  >
                                    <div className="flex items-center justify-between">
                                      <span className="flex items-center gap-1.5 font-semibold text-amber-300">
                                        <Terminal className="h-3 w-3" />
                                        {tc.name}
                                      </span>
                                      <span className="text-[10px] text-emerald-400">
                                        {tc.status}
                                      </span>
                                    </div>
                                    <div className="mt-1 truncate text-zinc-400">
                                      $ {tc.args}
                                    </div>
                                    {tc.output && (
                                      <div className="mt-1 text-zinc-300">
                                        → {tc.output}
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}

                            <div className="whitespace-pre-wrap text-xs leading-relaxed">
                              {msg.content}
                            </div>

                            {msg.approvalCard && (
                              <div className="mt-3 rounded-xl border border-amber-500/40 bg-[#16130d] p-3.5">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <AlertTriangle className="h-4 w-4 text-amber-400" />
                                    <span className="text-xs font-semibold text-amber-200">
                                      {msg.approvalCard.toolName} ({msg.approvalCard.scope})
                                    </span>
                                  </div>
                                  <span
                                    className={`rounded px-2 py-0.5 font-mono text-[10px] font-semibold uppercase ${
                                      msg.approvalCard.status === 'pending'
                                        ? 'bg-amber-500/20 text-amber-300'
                                        : msg.approvalCard.status === 'denied'
                                        ? 'bg-red-500/20 text-red-300'
                                        : 'bg-emerald-500/20 text-emerald-300'
                                    }`}
                                  >
                                    {msg.approvalCard.status}
                                  </span>
                                </div>
                                <div className="mt-2 rounded border border-zinc-800 bg-zinc-950 p-2 font-mono text-[11px] text-zinc-200">
                                  {msg.approvalCard.commandOrAction}
                                </div>
                                <div className="mt-1.5 text-[11px] text-zinc-400">
                                  {msg.approvalCard.reason}
                                </div>
                                {msg.approvalCard.status === 'pending' && (
                                  <div className="mt-3 flex flex-wrap items-center gap-2">
                                    <button
                                      type="button"
                                      disabled={isSending}
                                      onClick={() =>
                                        handleResolveApproval(msg.id, 'approved_once')
                                      }
                                      className="flex items-center gap-1 rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-zinc-950 hover:bg-emerald-400 disabled:opacity-50"
                                    >
                                      <Check className="h-3.5 w-3.5" />
                                      Allow Once
                                    </button>
                                    <button
                                      type="button"
                                      disabled={isSending}
                                      onClick={() =>
                                        handleResolveApproval(msg.id, 'approved_session')
                                      }
                                      className="rounded-lg bg-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-200 hover:bg-zinc-700 disabled:opacity-50"
                                    >
                                      Allow for Session
                                    </button>
                                    <button
                                      type="button"
                                      disabled={isSending}
                                      onClick={() =>
                                        handleResolveApproval(msg.id, 'denied')
                                      }
                                      className="flex items-center gap-1 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-300 hover:bg-red-500/20 disabled:opacity-50"
                                    >
                                      <X className="h-3.5 w-3.5" />
                                      Deny
                                    </button>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                <div className="border-t border-zinc-800/80 bg-[#0f1014] p-3.5">
                  {attachedFileNames.length > 0 && (
                    <div className="mb-2 flex flex-wrap gap-1.5">
                      {attachedFileNames.map((fname) => (
                        <span
                          key={fname}
                          className="inline-flex items-center gap-1.5 rounded-md border border-zinc-700 bg-zinc-800 px-2 py-0.5 text-[11px] text-zinc-200"
                        >
                          <Paperclip className="h-3 w-3 text-amber-400" />
                          {fname}
                          <button
                            type="button"
                            onClick={() =>
                              setAttachedFileNames((prev) =>
                                prev.filter((f) => f !== fname)
                              )
                            }
                            className="text-zinc-400 hover:text-zinc-100"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  )}

                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleSendMessage();
                    }}
                    className="flex items-end gap-2 rounded-xl border border-zinc-800 bg-zinc-950 p-2 focus-within:border-amber-500/50"
                  >
                    <button
                      type="button"
                      onClick={() => {
                        const sampleFiles = [
                          'docs/runtime-contract.md',
                          'cloudflare/composio-broker/wrangler.jsonc',
                          'docs/verification/README.md',
                        ];
                        const nextFile =
                          sampleFiles[attachedFileNames.length % sampleFiles.length];
                        if (!attachedFileNames.includes(nextFile)) {
                          setAttachedFileNames((prev) => [...prev, nextFile]);
                        }
                      }}
                      title="Attach workspace file context"
                      className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200"
                    >
                      <Paperclip className="h-4 w-4" />
                    </button>

                    <textarea
                      rows={2}
                      value={promptInput}
                      onChange={(e) => setPromptInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                      placeholder={`Message ${activeBot.name} (${activeBot.title})... Mention @Pip or @Sorrel to coordinate across bots`}
                      className="flex-1 resize-none bg-transparent px-1 py-1 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none"
                    />

                    <div className="flex items-center gap-1.5">
                      {activeBot.approvalMode !== 'ask' && (
                        <button
                          type="button"
                          onClick={() => {
                            updateActiveBot((b) => ({ ...b, approvalMode: 'ask' }));
                          }}
                          title="Switch bot to Ask Approval mode to test Approval Cards"
                          className="hidden sm:inline-flex items-center gap-1 rounded-lg border border-zinc-800 bg-zinc-900 px-2 py-1.5 text-[10px] text-zinc-400 hover:border-amber-500/40 hover:text-amber-300"
                        >
                          Test Ask Mode
                        </button>
                      )}
                      <button
                        type="submit"
                        disabled={isSending || !promptInput.trim()}
                        className="flex items-center gap-1.5 rounded-lg bg-amber-500 px-3.5 py-2 text-xs font-semibold text-zinc-950 transition hover:bg-amber-400 disabled:opacity-40"
                      >
                        <Send className="h-3.5 w-3.5" />
                        {isSending ? 'Running...' : 'Send'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>

              <OmbRightDrawer
                mode={rightDrawer}
                onClose={() => setRightDrawer(null)}
                bot={activeBot}
                state={state}
                onUpdateState={persistState}
              />
            </div>
          </>
        )}

        {activeTab === 'automations' && (
          <AutomationsView
            state={state}
            onUpdateState={persistState}
            onRunRoutineNow={handleRunRoutineNow}
            onTriggerWebhook={handleTriggerWebhook}
            runningRoutineId={runningRoutineId}
            onOpenThread={(threadId) => {
              const target = state.threads.find((t) => t.id === threadId);
              if (target) {
                setSelectedBotId(target.botId);
                setSelectedThreadId(target.id);
              }
              setActiveTab('chat');
            }}
          />
        )}

        {activeTab === 'apps' && (
          <ConnectedAppsView state={state} onUpdateState={persistState} />
        )}

        {activeTab === 'workflows' && (
          <WorkflowsAndSkillsView state={state} onUpdateState={persistState} />
        )}

        {activeTab === 'templates' && (
          <TemplatesAndDataView
            state={state}
            onUpdateState={persistState}
            onSelectBotAndThread={(botId, threadId) => {
              setSelectedBotId(botId);
              setSelectedThreadId(threadId);
              setActiveTab('chat');
            }}
          />
        )}
      </div>

      {showSettings && (
        <SettingsModal
          state={state}
          onClose={() => setShowSettings(false)}
          onUpdateState={persistState}
          onResetWorkspace={handleResetWorkspace}
        />
      )}

      {showNewBot && (
        <NewBotModal
          state={state}
          onClose={() => setShowNewBot(false)}
          onCreateBot={(newBot) => {
            const initThreadId = `thread-${Date.now()}`;
            setSelectedBotId(newBot.id);
            setSelectedThreadId(initThreadId);
            persistState((prev) => ({
              ...prev,
              bots: [...prev.bots, newBot],
              threads: [
                {
                  id: initThreadId,
                  botId: newBot.id,
                  title: `${newBot.name} Main Task`,
                  updatedAt: 'Just now',
                  status: 'idle',
                  messages: [],
                },
                ...prev.threads,
              ],
            }));
            setActiveTab('chat');
          }}
        />
      )}

      {showCommandPalette && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center bg-black/70 pt-24 backdrop-blur-sm"
          onClick={() => setShowCommandPalette(false)}
        >
          <div
            className="w-full max-w-lg overflow-hidden rounded-xl border border-zinc-800 bg-[#121318] shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 border-b border-zinc-800 px-4 py-3">
              <Search className="h-4 w-4 text-amber-400" />
              <input
                type="text"
                autoFocus
                value={commandQuery}
                onChange={(e) => setCommandQuery(e.target.value)}
                placeholder="Jump to bot, tab, workflow, or run command..."
                className="flex-1 bg-transparent text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowCommandPalette(false)}
                className="rounded bg-zinc-800 px-1.5 py-0.5 font-mono text-[10px] text-zinc-400"
              >
                ESC
              </button>
            </div>
            <div className="max-h-80 overflow-y-auto p-2 space-y-1">
              {[
                {
                  label: 'Open Chat & Task Threads',
                  category: 'Navigation',
                  run: () => setActiveTab('chat'),
                },
                {
                  label: 'Open Tasks & Routines (Cron / Webhooks)',
                  category: 'Navigation',
                  run: () => setActiveTab('automations'),
                },
                {
                  label: 'Open Connected Apps (Composio Multi-Account)',
                  category: 'Navigation',
                  run: () => setActiveTab('apps'),
                },
                {
                  label: 'Open Skills, Verification & 13 GitHub Workflows',
                  category: 'Navigation',
                  run: () => setActiveTab('workflows'),
                },
                {
                  label: 'Open Organization Templates, .omb Export & DuckDB',
                  category: 'Navigation',
                  run: () => setActiveTab('templates'),
                },
                {
                  label: 'Create New Bot or Team Chief',
                  category: 'Action',
                  run: () => setShowNewBot(true),
                },
                {
                  label: 'Export Portable Workspace Snapshot (.omb.json)',
                  category: 'Action',
                  run: () => handleQuickExportOmb(),
                },
                ...state.bots.map((b) => ({
                  label: `Switch to Bot: ${b.name} (${b.title})`,
                  category: 'Bots',
                  run: () => handleSelectBot(b.id),
                })),
              ]
                .filter((item) =>
                  item.label.toLowerCase().includes(commandQuery.toLowerCase())
                )
                .map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => {
                      item.run();
                      setShowCommandPalette(false);
                      setCommandQuery('');
                    }}
                    className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs text-zinc-200 hover:bg-zinc-800"
                  >
                    <span className="flex items-center gap-2">
                      <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                      {item.label}
                    </span>
                    <span className="font-mono text-[10px] text-zinc-500">
                      {item.category}
                    </span>
                  </button>
                ))}
            </div>
          </div>
        </div>
      )}

      {showRepoSplit && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
          onClick={() => setShowRepoSplit(false)}
        >
          <div
            className="w-full max-w-2xl overflow-hidden rounded-xl border border-zinc-800 bg-[#111215] text-zinc-100 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-zinc-800 px-6 py-4">
              <div className="flex items-center gap-2.5">
                <Package className="h-4 w-4 text-amber-400" />
                <div>
                  <h2 className="text-sm font-semibold">
                    Two-Part GitHub Repository Push Manager
                  </h2>
                  <p className="text-[11px] text-zinc-400">
                    Push Part 1 (~850 KB) first so GitHub accepts the initial repo, then load &amp; push Part 2 (~1.1 MB).
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowRepoSplit(false)}
                className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4 p-6">
              {repoSplitMsg && (
                <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-2.5 text-xs text-emerald-200">
                  {repoSplitMsg}
                </div>
              )}

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 flex flex-col justify-between gap-3">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-amber-300">
                        Part 1: Core Live App &amp; Workflows
                      </span>
                      <span className="rounded bg-amber-500/20 px-2 py-0.5 font-mono text-[10px] text-amber-300">
                        ~850 KB
                      </span>
                    </div>
                    <p className="mt-1.5 text-[11px] leading-relaxed text-zinc-300">
                      Contains 100% of your custom Mama&apos;s Agent Cloud Workspace (<code className="text-amber-300">apps/docs</code>), live Gemini &amp; Localhost bridge, <code className="text-amber-300">.claude/skills</code>, <code className="text-amber-300">/workflows</code>, and core docs.
                    </p>
                  </div>
                  <div className="space-y-2 pt-2 border-t border-amber-500/20">
                    <button
                      type="button"
                      disabled={repoSplitBusy}
                      onClick={async () => {
                        setRepoSplitBusy(true);
                        try {
                          const res = await fetch('/api/omb/repo-parts', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ action: 'slim_to_part1' }),
                          });
                          const data = (await res.json()) as { message?: string };
                          setRepoSplitMsg(
                            data.message || 'Part 1 active! Click GitHub Publish now.'
                          );
                        } finally {
                          setRepoSplitBusy(false);
                        }
                      }}
                      className="w-full rounded-lg bg-amber-500 px-3 py-2 text-xs font-semibold text-zinc-950 hover:bg-amber-400 disabled:opacity-50"
                    >
                      1. Activate Part 1 in Workspace (Push First)
                    </button>
                    <a
                      href="/api/omb/repo-parts?download=part1"
                      className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-200 hover:bg-zinc-800"
                    >
                      <Download className="h-3.5 w-3.5" />
                      Download Part 1 (.tar.gz)
                    </a>
                  </div>
                </div>

                <div className="rounded-xl border border-sky-500/30 bg-sky-500/5 p-4 flex flex-col justify-between gap-3">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-sky-300">
                        Part 2: Companion, Cloudflare &amp; Electron
                      </span>
                      <span className="rounded bg-sky-500/20 px-2 py-0.5 font-mono text-[10px] text-sky-300">
                        ~1.1 MB
                      </span>
                    </div>
                    <p className="mt-1.5 text-[11px] leading-relaxed text-zinc-300">
                      Contains <code className="text-sky-300">cloudflare/</code>, <code className="text-sky-300">companion/</code>, <code className="text-sky-300">electron/</code>, <code className="text-sky-300">deploy/</code>, and design plans (with the 55 MB of raw video/GIF blobs stripped so GitHub push succeeds).
                    </p>
                  </div>
                  <div className="space-y-2 pt-2 border-t border-sky-500/20">
                    <button
                      type="button"
                      disabled={repoSplitBusy}
                      onClick={async () => {
                        setRepoSplitBusy(true);
                        try {
                          const res = await fetch('/api/omb/repo-parts', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ action: 'restore_part2_code' }),
                          });
                          const data = (await res.json()) as { message?: string };
                          setRepoSplitMsg(
                            data.message ||
                              'Part 2 code restored into workspace! Click GitHub Push now.'
                          );
                        } finally {
                          setRepoSplitBusy(false);
                        }
                      }}
                      className="w-full rounded-lg bg-sky-500 px-3 py-2 text-xs font-semibold text-zinc-950 hover:bg-sky-400 disabled:opacity-50"
                    >
                      2. Load Part 2 Code into Workspace (Push Second)
                    </button>
                    <div className="flex gap-1.5">
                      <a
                        href="/api/omb/repo-parts?download=part2-code"
                        className="flex flex-1 items-center justify-center gap-1 rounded-lg border border-zinc-700 bg-zinc-900 px-2 py-1.5 text-[11px] text-zinc-200 hover:bg-zinc-800"
                      >
                        <Download className="h-3 w-3" />
                        Part 2 Code (1.1 MB)
                      </a>
                      <a
                        href="/api/omb/repo-parts?download=part2-full"
                        className="flex flex-1 items-center justify-center gap-1 rounded-lg border border-zinc-700 bg-zinc-900 px-2 py-1.5 text-[11px] text-zinc-400 hover:bg-zinc-800"
                      >
                        <Download className="h-3 w-3" />
                        Full Media (48 MB)
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
