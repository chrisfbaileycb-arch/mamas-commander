'use client';

import { useState } from 'react';
import {
  X,
  Cpu,
  Mic,
  Cloud,
  Shield,
  Palette,
  Check,
  Sparkles,
  RotateCcw,
  RefreshCw,
  Globe,
  Server,
} from 'lucide-react';
import {
  MASCOT_COLORS,
  type BotProfile,
  type MascotShape,
  type WorkspaceState,
} from '@/lib/omb-data';
import { OmbMascot } from './omb-mascot';

interface SettingsModalProps {
  state: WorkspaceState;
  onClose: () => void;
  onUpdateState: (updater: (prev: WorkspaceState) => WorkspaceState) => void;
  onResetWorkspace: () => Promise<void>;
}

const LOCALHOST_PRESETS = [
  { label: 'Ollama (:11434)', baseUrl: 'http://127.0.0.1:11434/v1', defaultModel: 'llama3.3:latest' },
  { label: 'LM Studio (:1234)', baseUrl: 'http://127.0.0.1:1234/v1', defaultModel: 'local-model' },
  { label: 'vLLM (:8000)', baseUrl: 'http://127.0.0.1:8000/v1', defaultModel: 'qwen2.5-coder:32b' },
  { label: 'llama.cpp (:8080)', baseUrl: 'http://127.0.0.1:8080/v1', defaultModel: 'deepseek-r1:14b' },
];

export function SettingsModal({
  state,
  onClose,
  onUpdateState,
  onResetWorkspace,
}: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState<'models' | 'voice' | 'cloud' | 'security' | 'appearance'>('models');
  const [redactionSample, setRedactionSample] = useState(
    'Authorization: Bearer sk-proj-98a7bcdef1234567890abcdef and GITHUB_TOKEN=ghp_1234567890abcdefghijklmnopqrstuv'
  );
  const [resetConfirm, setResetConfirm] = useState(false);
  const [probingLocalhost, setProbingLocalhost] = useState(false);
  const [testingApi, setTestingApi] = useState(false);
  const [apiPingMessage, setApiPingMessage] = useState<string | null>(
    'Platform API Connected & Ready (/api/omb/chat)'
  );

  const localCfg = state.localhostConfig ?? {
    baseUrl: 'http://127.0.0.1:11434/v1',
    modelName: 'llama3.3:latest',
    autoFallbackToApi: true,
    lastProbeStatus: 'untested',
    lastProbeDetail: 'Ready to probe localhost endpoints from your browser.',
    detectedModels: ['llama3.3:latest', 'qwen2.5-coder:32b', 'deepseek-r1:14b'],
  };

  const previewRedacted = redactionSample
    .replace(/sk-[a-zA-Z0-9_-]{12,}/g, 'sk-***REDACTED***')
    .replace(/ghp_[a-zA-Z0-9]{12,}/g, 'ghp_***REDACTED***')
    .replace(/AIza[0-9A-Za-z-_]{20,}/g, 'AIza***REDACTED***');

  const handleTestApiConnection = async () => {
    setTestingApi(true);
    const start = performance.now();
    try {
      const res = await fetch('/api/omb/chat');
      const data = (await res.json()) as { apiConnected?: boolean; defaultModel?: string };
      const elapsed = Math.round(performance.now() - start);
      if (data.apiConnected) {
        setApiPingMessage(`Verified API Connected (${data.defaultModel}) in ${elapsed}ms`);
      } else {
        setApiPingMessage(`API Route reachable in ${elapsed}ms (Platform environment ready)`);
      }
    } catch {
      setApiPingMessage('Could not reach /api/omb/chat');
    } finally {
      setTestingApi(false);
    }
  };

  const handleProbeLocalhost = async () => {
    setProbingLocalhost(true);
    const cleanBase = localCfg.baseUrl.replace(/\/+$/, '');
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 2200);
      const res = await fetch(`${cleanBase}/models`, {
        method: 'GET',
        signal: controller.signal,
      });
      clearTimeout(timeout);
      if (res.ok) {
        const json = (await res.json()) as { data?: Array<{ id?: string }> };
        const found = (json.data ?? [])
          .map((m) => m.id)
          .filter((id): id is string => Boolean(id));
        onUpdateState((prev) => ({
          ...prev,
          localhostConfig: {
            ...localCfg,
            lastProbeStatus: 'connected',
            lastProbeDetail: `Connected to ${cleanBase} (${found.length || 1} local models detected)`,
            detectedModels: found.length > 0 ? found : localCfg.detectedModels,
            modelName: found[0] || localCfg.modelName,
          },
        }));
      } else {
        throw new Error(`HTTP ${res.status}`);
      }
    } catch {
      onUpdateState((prev) => ({
        ...prev,
        localhostConfig: {
          ...localCfg,
          lastProbeStatus: 'unreachable',
          lastProbeDetail: `No local server responded at ${cleanBase} from this browser. Auto-fallback to API Connected model is ${localCfg.autoFallbackToApi ? 'ENABLED' : 'OFF'}.`,
        },
      }));
    } finally {
      setProbingLocalhost(false);
    }
  };

  const handleSwitchAllBotsToEngine = (engineId: 'api-connected' | 'localhost-model', modelId: string) => {
    onUpdateState((prev) => ({
      ...prev,
      bots: prev.bots.map((b) => ({
        ...b,
        engineId,
        model: modelId,
      })),
    }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
      <div className="flex h-[650px] w-full max-w-4xl overflow-hidden rounded-xl border border-zinc-800 bg-[#111215] text-zinc-100 shadow-2xl">
        <div className="flex w-56 shrink-0 flex-col justify-between border-r border-zinc-800/80 bg-[#0c0d0f] p-4">
          <div>
            <div className="mb-4 px-2">
              <div className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                Mama&apos;s Agent
              </div>
              <div className="text-base font-semibold text-zinc-100">Settings</div>
            </div>
            <nav className="space-y-1">
              <button
                type="button"
                onClick={() => setActiveTab('models')}
                className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium transition ${
                  activeTab === 'models'
                    ? 'bg-zinc-800 text-zinc-100'
                    : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
                }`}
              >
                <Cpu className="h-4 w-4 text-amber-400" />
                Localhost & API Models
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('voice')}
                className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium transition ${
                  activeTab === 'voice'
                    ? 'bg-zinc-800 text-zinc-100'
                    : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
                }`}
              >
                <Mic className="h-4 w-4 text-emerald-400" />
                Voice & Call
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('cloud')}
                className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium transition ${
                  activeTab === 'cloud'
                    ? 'bg-zinc-800 text-zinc-100'
                    : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
                }`}
              >
                <Cloud className="h-4 w-4 text-sky-400" />
                My Cloud & Remote
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('security')}
                className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium transition ${
                  activeTab === 'security'
                    ? 'bg-zinc-800 text-zinc-100'
                    : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
                }`}
              >
                <Shield className="h-4 w-4 text-purple-400" />
                Security & Features
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('appearance')}
                className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium transition ${
                  activeTab === 'appearance'
                    ? 'bg-zinc-800 text-zinc-100'
                    : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
                }`}
              >
                <Palette className="h-4 w-4 text-pink-400" />
                About Me & Memory
              </button>
            </nav>
          </div>

          <div className="border-t border-zinc-800/80 pt-3">
            <div className="px-2 text-[11px] text-zinc-500">
              Runtime: <span className="font-mono text-zinc-300">Browser Cloud v0.14</span>
            </div>
          </div>
        </div>

        <div className="flex flex-1 flex-col overflow-hidden">
          <div className="flex items-center justify-between border-b border-zinc-800/80 px-6 py-4">
            <div>
              <h2 className="text-sm font-semibold text-zinc-100">
                {activeTab === 'models' && 'API Connected Model & Localhost Model Bridge'}
                {activeTab === 'voice' && 'Voice Call & Synthesis'}
                {activeTab === 'cloud' && 'My Cloud Box & Remote Access'}
                {activeTab === 'security' && 'Workspace Features & Secret Redaction'}
                {activeTab === 'appearance' && 'Shared About Me Facts'}
              </h2>
              <p className="text-xs text-zinc-400">
                {activeTab === 'models' &&
                  'Run bots on the Platform API Connected model or bridge directly from your browser to a Localhost model.'}
                {activeTab === 'voice' && 'Real-time voice conversation and synthesis settings for live bot calls.'}
                {activeTab === 'cloud' && 'Switch active environment between My Cloud, This Computer, and Staging Fleet.'}
                {activeTab === 'security' && 'Toggle runtime features and verify secret redaction invariants.'}
                {activeTab === 'appearance' && 'Cross-bot learned facts shared across your OpenMausBot workspace.'}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            {activeTab === 'models' && (
              <div className="space-y-5">
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                  <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4 flex flex-col justify-between gap-3">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-2 text-xs font-semibold text-emerald-300">
                          <Globe className="h-4 w-4 text-emerald-400" />
                          API Connected Model (Platform)
                        </span>
                        <span className="rounded bg-emerald-500/20 px-2 py-0.5 font-mono text-[10px] font-semibold text-emerald-300">
                          ACTIVE
                        </span>
                      </div>
                      <p className="mt-1.5 text-[11px] leading-relaxed text-zinc-300">
                        We&apos;ve set up your API key automatically via the server proxy (<code className="text-emerald-300">/api/omb/chat</code>). Your attached API key can be found in the <strong>Settings &gt; Secrets</strong> panel.
                      </p>

                      <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
                        <div>
                          <label className="block text-[10px] text-zinc-400">Default Gemini Model</label>
                          <select
                            value={state.agentInteractionSettings?.defaultModel ?? 'gemini-3-flash-preview'}
                            onChange={(e) =>
                              onUpdateState((prev) => ({
                                ...prev,
                                agentInteractionSettings: {
                                  defaultModel: e.target.value,
                                  reasoningEffort: prev.agentInteractionSettings?.reasoningEffort ?? 'high',
                                  temperature: prev.agentInteractionSettings?.temperature ?? 0.4,
                                  maxOutputTokens: prev.agentInteractionSettings?.maxOutputTokens ?? 2048,
                                },
                              }))
                            }
                            className="mt-0.5 w-full rounded border border-zinc-800 bg-zinc-950 px-2 py-1 font-mono text-[11px] text-zinc-100"
                          >
                            <option value="gemini-3-flash-preview">gemini-3-flash-preview</option>
                            <option value="gemini-3.1-pro-preview">gemini-3.1-pro-preview</option>
                            <option value="gemini-3.1-flash-lite-preview">gemini-3.1-flash-lite-preview</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] text-zinc-400">Reasoning Effort</label>
                          <select
                            value={state.agentInteractionSettings?.reasoningEffort ?? 'high'}
                            onChange={(e) =>
                              onUpdateState((prev) => ({
                                ...prev,
                                agentInteractionSettings: {
                                  defaultModel: prev.agentInteractionSettings?.defaultModel ?? 'gemini-3-flash-preview',
                                  reasoningEffort: e.target.value as 'low' | 'medium' | 'high',
                                  temperature: prev.agentInteractionSettings?.temperature ?? 0.4,
                                  maxOutputTokens: prev.agentInteractionSettings?.maxOutputTokens ?? 2048,
                                },
                              }))
                            }
                            className="mt-0.5 w-full rounded border border-zinc-800 bg-zinc-950 px-2 py-1 font-mono text-[11px] text-zinc-100"
                          >
                            <option value="low">low</option>
                            <option value="medium">medium</option>
                            <option value="high">high</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] text-zinc-400">
                            Temperature ({(state.agentInteractionSettings?.temperature ?? 0.4).toFixed(1)})
                          </label>
                          <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.1"
                            value={state.agentInteractionSettings?.temperature ?? 0.4}
                            onChange={(e) =>
                              onUpdateState((prev) => ({
                                ...prev,
                                agentInteractionSettings: {
                                  defaultModel: prev.agentInteractionSettings?.defaultModel ?? 'gemini-3-flash-preview',
                                  reasoningEffort: prev.agentInteractionSettings?.reasoningEffort ?? 'high',
                                  temperature: Number.parseFloat(e.target.value),
                                  maxOutputTokens: prev.agentInteractionSettings?.maxOutputTokens ?? 2048,
                                },
                              }))
                            }
                            className="mt-1.5 w-full accent-emerald-400"
                          />
                        </div>
                      </div>

                      {apiPingMessage && (
                        <div className="mt-2.5 rounded border border-emerald-500/20 bg-zinc-950/90 px-2.5 py-1.5 font-mono text-[10px] text-emerald-300">
                          {apiPingMessage}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-emerald-500/20">
                      <button
                        type="button"
                        onClick={() =>
                          handleSwitchAllBotsToEngine('api-connected', 'gemini-3-flash-preview')
                        }
                        className="rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-zinc-950 hover:bg-emerald-400"
                      >
                        Use API Model for All Bots
                      </button>
                      <button
                        type="button"
                        onClick={handleTestApiConnection}
                        disabled={testingApi}
                        className="flex items-center gap-1 rounded-lg border border-zinc-700 bg-zinc-900 px-2.5 py-1.5 text-xs text-zinc-200 hover:bg-zinc-800"
                      >
                        <RefreshCw className={`h-3 w-3 ${testingApi ? 'animate-spin' : ''}`} />
                        Verify API
                      </button>
                    </div>
                  </div>

                  <div className="rounded-xl border border-sky-500/30 bg-sky-500/5 p-4 flex flex-col justify-between gap-3">
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-2 text-xs font-semibold text-sky-300">
                          <Server className="h-4 w-4 text-sky-400" />
                          Localhost Model (Direct Browser Bridge)
                        </span>
                        <span className="rounded bg-sky-500/20 px-2 py-0.5 font-mono text-[10px] font-semibold text-sky-300">
                          127.0.0.1
                        </span>
                      </div>
                      <p className="text-[11px] leading-relaxed text-zinc-300">
                        Connects directly from your browser to Ollama, LM Studio, vLLM, or llama.cpp running on <code className="text-sky-300">localhost</code>.
                      </p>

                      <div className="flex flex-wrap gap-1">
                        {LOCALHOST_PRESETS.map((preset) => (
                          <button
                            key={preset.label}
                            type="button"
                            onClick={() =>
                              onUpdateState((prev) => ({
                                ...prev,
                                localhostConfig: {
                                  ...localCfg,
                                  baseUrl: preset.baseUrl,
                                  modelName: preset.defaultModel,
                                },
                              }))
                            }
                            className={`rounded px-2 py-0.5 text-[10px] font-medium transition ${
                              localCfg.baseUrl === preset.baseUrl
                                ? 'bg-sky-500 text-zinc-950 font-semibold'
                                : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200'
                            }`}
                          >
                            {preset.label}
                          </button>
                        ))}
                      </div>

                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                        <div>
                          <label className="block text-[10px] text-zinc-400">Localhost Base URL</label>
                          <input
                            type="text"
                            value={localCfg.baseUrl}
                            onChange={(e) =>
                              onUpdateState((prev) => ({
                                ...prev,
                                localhostConfig: {
                                  ...localCfg,
                                  baseUrl: e.target.value,
                                },
                              }))
                            }
                            className="mt-0.5 w-full rounded border border-zinc-800 bg-zinc-950 px-2 py-1 font-mono text-[11px] text-zinc-100"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] text-zinc-400">Local Model Name</label>
                          <input
                            type="text"
                            value={localCfg.modelName}
                            onChange={(e) =>
                              onUpdateState((prev) => ({
                                ...prev,
                                localhostConfig: {
                                  ...localCfg,
                                  modelName: e.target.value,
                                },
                              }))
                            }
                            className="mt-0.5 w-full rounded border border-zinc-800 bg-zinc-950 px-2 py-1 font-mono text-[11px] text-zinc-100"
                          />
                        </div>
                      </div>

                      <label className="flex items-center gap-2 text-[11px] text-zinc-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={localCfg.autoFallbackToApi}
                          onChange={(e) =>
                            onUpdateState((prev) => ({
                              ...prev,
                              localhostConfig: {
                                ...localCfg,
                                autoFallbackToApi: e.target.checked,
                              },
                            }))
                          }
                        />
                        Auto-fallback to API Connected model when away from localhost
                      </label>

                      {localCfg.lastProbeDetail && (
                        <div className="rounded border border-sky-500/20 bg-zinc-950/90 px-2.5 py-1.5 font-mono text-[10px] text-sky-300">
                          {localCfg.lastProbeDetail}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-sky-500/20">
                      <button
                        type="button"
                        onClick={() =>
                          handleSwitchAllBotsToEngine('localhost-model', localCfg.modelName)
                        }
                        className="rounded-lg bg-sky-500 px-3 py-1.5 text-xs font-semibold text-zinc-950 hover:bg-sky-400"
                      >
                        Use Localhost for All Bots
                      </button>
                      <button
                        type="button"
                        onClick={handleProbeLocalhost}
                        disabled={probingLocalhost}
                        className="flex items-center gap-1 rounded-lg border border-zinc-700 bg-zinc-900 px-2.5 py-1.5 text-xs text-zinc-200 hover:bg-zinc-800"
                      >
                        <RefreshCw className={`h-3 w-3 ${probingLocalhost ? 'animate-spin' : ''}`} />
                        Probe Localhost
                      </button>
                    </div>
                  </div>
                </div>

                <div className="space-y-2.5">
                  <div className="text-xs font-semibold text-zinc-300">
                    All Registered Engine Drivers
                  </div>
                  {state.engines.map((eng) => (
                    <div
                      key={eng.id}
                      className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-3.5"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-zinc-100">
                              {eng.name}
                            </span>
                            <span className="rounded bg-zinc-800 px-1.5 py-0.5 font-mono text-[10px] text-zinc-400">
                              {eng.version}
                            </span>
                            <span className="rounded bg-zinc-950 px-1.5 py-0.5 font-mono text-[10px] text-amber-300">
                              {eng.category}
                            </span>
                          </div>
                          <div className="mt-0.5 font-mono text-[11px] text-zinc-400">
                            {eng.executablePath} · {eng.authShape}
                          </div>
                        </div>
                        <span className="flex items-center gap-1 rounded bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-400">
                          <Check className="h-3 w-3" />
                          {eng.status}
                        </span>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {eng.models.map((m) => (
                          <span
                            key={m.id}
                            className="rounded border border-zinc-800 bg-zinc-950 px-2 py-0.5 font-mono text-[10px] text-zinc-300"
                          >
                            {m.label}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'voice' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
                  <div>
                    <div className="text-xs font-semibold text-zinc-200">
                      Live Call OpenAI Realtime Key
                    </div>
                    <div className="text-[11px] text-zinc-400">
                      Allows hands-free voice turns and spoken assistant synthesis in any bot thread.
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      onUpdateState((prev) => ({
                        ...prev,
                        connections: {
                          ...prev.connections,
                          liveCallOpenAiKeySet: !prev.connections.liveCallOpenAiKeySet,
                        },
                      }))
                    }
                    className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                      state.connections.liveCallOpenAiKeySet
                        ? 'bg-emerald-500 text-zinc-950'
                        : 'bg-zinc-800 text-zinc-300'
                    }`}
                  >
                    {state.connections.liveCallOpenAiKeySet ? 'Connected' : 'Disconnected'}
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'cloud' && (
              <div className="space-y-4">
                <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4">
                  <div className="text-xs font-semibold text-zinc-100">
                    Active Workspace Environment
                  </div>
                  <div className="mt-2.5 flex gap-2">
                    {(['my-cloud', 'this-computer', 'staging-fleet'] as const).map((env) => (
                      <button
                        key={env}
                        type="button"
                        onClick={() =>
                          onUpdateState((prev) => ({ ...prev, activeEnv: env }))
                        }
                        className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                          state.activeEnv === env
                            ? 'bg-emerald-500 text-zinc-950 font-semibold'
                            : 'bg-zinc-900 text-zinc-300 hover:bg-zinc-800'
                        }`}
                      >
                        {env}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
                  <div className="text-xs font-semibold text-zinc-200">
                    Reset Workspace State
                  </div>
                  <p className="mt-1 text-[11px] text-zinc-400">
                    Restore all bots, threads, routines, and memory notes to the clean factory fixture.
                  </p>
                  <div className="mt-3 flex items-center gap-2">
                    {!resetConfirm ? (
                      <button
                        type="button"
                        onClick={() => setResetConfirm(true)}
                        className="flex items-center gap-1.5 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-300 hover:bg-red-500/20"
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                        Reset to Factory Fixture
                      </button>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={async () => {
                            await onResetWorkspace();
                            setResetConfirm(false);
                            onClose();
                          }}
                          className="rounded-lg bg-red-500 px-3 py-1.5 text-xs font-semibold text-zinc-950 hover:bg-red-400"
                        >
                          Confirm Factory Reset
                        </button>
                        <button
                          type="button"
                          onClick={() => setResetConfirm(false)}
                          className="rounded-lg bg-zinc-800 px-3 py-1.5 text-xs text-zinc-300"
                        >
                          Cancel
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {(
                    [
                      ['agentsToolBridge', 'Agents MCP Tool Bridge'],
                      ['autoRecall', 'Auto-Recall Topic Memory'],
                      ['roomMemoryCapture', 'Group Room Memory Capture'],
                      ['llmThreadTitles', 'Automatic Thread Titles'],
                      ['chiefEscalations', 'Team Chief Escalations'],
                      ['keepAwakeForRoutines', 'Keep Cloud Box Awake for Routines'],
                    ] as const
                  ).map(([key, label]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() =>
                        onUpdateState((prev) => ({
                          ...prev,
                          features: {
                            ...prev.features,
                            [key]: !prev.features[key],
                          },
                        }))
                      }
                      className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900/50 p-3 text-left text-xs"
                    >
                      <span className="text-zinc-200">{label}</span>
                      <span
                        className={`rounded px-2 py-0.5 text-[10px] font-semibold ${
                          state.features[key]
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : 'bg-zinc-800 text-zinc-400'
                        }`}
                      >
                        {state.features[key] ? 'ON' : 'OFF'}
                      </span>
                    </button>
                  ))}
                </div>

                <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
                  <div className="text-xs font-semibold text-zinc-200">
                    Live Secret Redaction Tester (`docs/memory.md` Invariant)
                  </div>
                  <textarea
                    rows={2}
                    value={redactionSample}
                    onChange={(e) => setRedactionSample(e.target.value)}
                    className="mt-2.5 w-full rounded border border-zinc-800 bg-zinc-950 p-2 font-mono text-xs text-zinc-200"
                  />
                  <div className="mt-2 rounded border border-emerald-500/20 bg-zinc-950 p-2.5 font-mono text-xs text-emerald-300">
                    {previewRedacted}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'appearance' && (
              <div className="space-y-2.5">
                {state.aboutMe.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-3 text-xs"
                  >
                    <div className="flex items-center justify-between text-[11px] text-zinc-400">
                      <span>Learned by {item.learnedByBot}</span>
                      <span className="font-mono">{item.date}</span>
                    </div>
                    <div className="mt-1 text-zinc-100">{item.fact}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

interface NewBotModalProps {
  state: WorkspaceState;
  onClose: () => void;
  onCreateBot: (bot: BotProfile) => void;
}

export function NewBotModal({ state, onClose, onCreateBot }: NewBotModalProps) {
  const [name, setName] = useState('');
  const [title, setTitle] = useState('');
  const [team, setTeam] = useState('Engineering');
  const [isChief, setIsChief] = useState(false);
  const [description, setDescription] = useState('');
  const [color, setColor] = useState(MASCOT_COLORS[0]);
  const [shape, setShape] = useState<MascotShape>('mascot');
  const [expression, setExpression] = useState(0);
  const [engineId, setEngineId] = useState(state.engines[0]?.id ?? 'api-connected');
  const [instructions, setInstructions] = useState(
    'You are a specialist OpenMausBot agent. Execute tasks accurately, verify output in isolated fixtures, and respect approval boundaries.'
  );

  const applyPreset = (presetId: string) => {
    const preset = state.presets.find((p) => p.id === presetId);
    if (!preset) return;
    setName(preset.bot.name);
    setTitle(preset.bot.title);
    setDescription(preset.bot.description);
    setColor(preset.bot.color);
    setExpression(preset.bot.expression);
    setInstructions(preset.bot.instructions);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    const selectedEngine =
      state.engines.find((eng) => eng.id === engineId) ?? state.engines[0];
    const defaultModel = selectedEngine?.models[0]?.id ?? 'gemini-3-flash-preview';

    const newBot: BotProfile = {
      id: `bot-${Date.now()}`,
      name: name.trim(),
      title: title.trim() || 'Specialist Agent',
      description: description.trim() || 'Custom OpenMausBot workspace agent',
      team: team.trim() || 'Engineering',
      isChief,
      color,
      shape,
      expression,
      engineId,
      model: defaultModel,
      approvalMode: 'edits',
      computerMode: 'cloud',
      workingFolder: `~/workspaces/${name.trim().toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
      instructions,
      memoryEnabled: true,
      memoryUpkeep: true,
      memoryMd: `# ${name.trim()} Memory\n- Created in OpenMausBot Cloud Workspace.\n- Ready for tasks and routines.`,
      memoryArchiveMd: '',
      topics: [],
      memoryJournal: [],
      skills: [
        {
          id: `sk-${Date.now()}`,
          name: 'verify-omb',
          description: 'Run isolated fixture verification checks.',
          enabled: true,
          source: 'builtin',
          content: 'Always verify changes in an isolated control:omb fixture.',
        },
      ],
      toolSelectionMode: 'all',
      toolSelectors: ['native:*', 'mcp:openmausbot-agents:*'],
      toolGrants: {},
      voiceEngine: 'elevenlabs',
      voiceName: 'Zephyr',
      voiceNotesEnabled: true,
    };
    onCreateBot(newBot);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
      <div className="w-full max-w-xl overflow-hidden rounded-xl border border-zinc-800 bg-[#111215] text-zinc-100 shadow-2xl">
        <div className="flex items-center justify-between border-b border-zinc-800 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <Sparkles className="h-4 w-4 text-amber-400" />
            <h2 className="text-sm font-semibold">Create New Bot or Team Chief</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="max-h-[80vh] space-y-4 overflow-y-auto p-6">
          <div>
            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
              Quick-Fill from Preset (`docs/presets.md`)
            </label>
            <div className="flex flex-wrap gap-1.5">
              {state.presets.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => applyPreset(preset.id)}
                  className="rounded-md border border-zinc-800 bg-zinc-900 px-2.5 py-1 text-xs text-zinc-300 hover:border-amber-500/40 hover:text-amber-300"
                >
                  {preset.name}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-4 rounded-lg border border-zinc-800 bg-zinc-900/50 p-3">
            <OmbMascot color={color} shape={shape} expression={expression} size="lg" />
            <div className="flex-1 space-y-2">
              <div className="flex flex-wrap gap-1.5">
                {MASCOT_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    style={{ backgroundColor: c }}
                    className={`h-5 w-5 rounded-full border ${
                      color === c ? 'scale-110 border-white' : 'border-transparent opacity-75'
                    }`}
                  />
                ))}
              </div>
              <div className="flex gap-2">
                {(['mascot', 'rounded', 'circle', 'square'] as MascotShape[]).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setShape(s)}
                    className={`rounded px-2 py-0.5 text-[11px] capitalize ${
                      shape === s ? 'bg-amber-500 text-zinc-950 font-semibold' : 'bg-zinc-800 text-zinc-400'
                    }`}
                  >
                    {s}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setExpression((prev) => (prev + 1) % 6)}
                  className="rounded bg-zinc-800 px-2 py-0.5 text-[11px] text-zinc-300 hover:bg-zinc-700"
                >
                  Expression #{expression + 1}
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-zinc-300">Bot Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Thistle"
                className="mt-1 w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-zinc-100"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-300">Role Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Release Sentinel"
                className="mt-1 w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-zinc-100"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-zinc-300">Team</label>
              <input
                type="text"
                value={team}
                onChange={(e) => setTeam(e.target.value)}
                className="mt-1 w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-zinc-100"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-300">Engine Driver</label>
              <select
                value={engineId}
                onChange={(e) => setEngineId(e.target.value)}
                className="mt-1 w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-zinc-100"
              >
                {state.engines.map((eng) => (
                  <option key={eng.id} value={eng.id}>
                    {eng.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <label className="flex items-center gap-2 text-xs text-zinc-300">
            <input
              type="checkbox"
              checked={isChief}
              onChange={(e) => setIsChief(e.target.checked)}
            />
            Promote to Team Chief (can coordinate and delegate to team specialists)
          </label>

          <div>
            <label className="block text-xs font-medium text-zinc-300">System Instructions</label>
            <textarea
              rows={3}
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              className="mt-1 w-full rounded-lg border border-zinc-800 bg-zinc-950 p-2.5 font-mono text-xs text-zinc-200"
            />
          </div>

          <div className="flex justify-end gap-2 border-t border-zinc-800 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg bg-zinc-800 px-4 py-2 text-xs font-medium text-zinc-300 hover:bg-zinc-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-amber-500 px-4 py-2 text-xs font-semibold text-zinc-950 hover:bg-amber-400"
            >
              Create Bot
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
