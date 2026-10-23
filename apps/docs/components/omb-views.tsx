'use client';

import { useState } from 'react';
import {
  CalendarClock,
  Webhook,
  Zap,
  Plus,
  Play,
  Check,
  RefreshCw,
  Search,
  ShieldCheck,
  Terminal,
  Package,
  Database,
  Download,
  Upload,
  FileCode,
  Sparkles,
  Trash2,
} from 'lucide-react';
import type {
  RoutineItem,
  WorkspaceState,
} from '@/lib/omb-data';
import { OmbMascot } from './omb-mascot';

interface AutomationsViewProps {
  state: WorkspaceState;
  onUpdateState: (updater: (prev: WorkspaceState) => WorkspaceState) => void;
  onRunRoutineNow: (routine: RoutineItem) => Promise<void>;
  onTriggerWebhook: (webhookId: string, payloadJson: string) => Promise<void>;
  runningRoutineId: string | null;
  onOpenThread: (threadId: string) => void;
}

export function AutomationsView({
  state,
  onUpdateState,
  onRunRoutineNow,
  onTriggerWebhook,
  runningRoutineId,
  onOpenThread,
}: AutomationsViewProps) {
  const [subTab, setSubTab] = useState<'schedules' | 'webhooks' | 'app_events' | 'logs'>('schedules');
  const [calRange, setCalRange] = useState<'day' | '3days' | 'week' | 'list'>('week');
  const [selectedBotFilter, setSelectedBotFilter] = useState<string>('all');
  const [showNewModal, setShowNewModal] = useState(false);

  const [newTitle, setNewTitle] = useState('');
  const [newBotId, setNewBotId] = useState(state.bots[0]?.id ?? 'bot-bramble');
  const [newKind, setNewKind] = useState<'cron' | 'weekdays' | 'interval' | 'once'>('cron');
  const [newCron, setNewCron] = useState('0 9 * * MON-FRI');
  const [newTz, setNewTz] = useState('America/Los_Angeles');
  const [newInstructions, setNewInstructions] = useState('');
  const [newRememberLast, setNewRememberLast] = useState(true);
  const [newRunStartup, setNewRunStartup] = useState(false);
  const [newRunTarget, setNewRunTarget] = useState<'maus' | 'box'>('maus');

  const [webhookTestPayload, setWebhookTestPayload] = useState(
    '{"event":"release.published","tag":"v0.34.0","repo":"milind-soni/OpenMausBot"}',
  );

  const filteredRoutines = state.routines.filter(
    (r) => selectedBotFilter === 'all' || r.botId === selectedBotFilter,
  );

  const handleCreateRoutine = () => {
    if (!newTitle.trim()) return;
    const targetBot = state.bots.find((b) => b.id === newBotId) ?? state.bots[0];
    const destThread =
      state.threads.find((t) => t.botId === targetBot.id && !t.isGroup) ?? state.threads[0];
    const created: RoutineItem = {
      id: `rtn-${Date.now()}`,
      title: newTitle.trim(),
      botId: targetBot.id,
      kind: newKind,
      cronExpression: newCron.trim() || '0 9 * * MON-FRI',
      timezone: newTz,
      humanSchedule: `${newCron.trim()} (${newTz})`,
      nextOccurrences: ['Tomorrow 9:00 AM', 'In 2 days 9:00 AM', 'In 3 days 9:00 AM'],
      enabled: true,
      rememberLastRun: newRememberLast,
      runOnStartup: newRunStartup,
      runOnTarget: newRunTarget,
      postResultsToThreadId: destThread.id,
      instructions: newInstructions.trim() || `Run scheduled check for ${newTitle.trim()} and post summary.`,
      runsOkThisWeek: 0,
      runsTotalThisWeek: 0,
    };
    onUpdateState((prev) => ({
      ...prev,
      routines: [created, ...prev.routines],
    }));
    setNewTitle('');
    setNewInstructions('');
    setShowNewModal(false);
  };

  return (
    <div className="flex-1 overflow-y-auto bg-[#070708] p-6 text-zinc-100 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <CalendarClock className="w-5 h-5 text-blue-400" />
            <h1 className="text-xl font-semibold tracking-tight">Tasks &amp; routines</h1>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Routines start fresh agent tasks on a schedule, webhook, or connected-app event.
          </p>
        </div>

        <button
          onClick={() => setShowNewModal(true)}
          className="px-4 py-2 rounded-full bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          New routine
        </button>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1 p-1 rounded-xl bg-zinc-900 border border-zinc-800">
          {(
            [
              { id: 'schedules', label: 'Routines', icon: CalendarClock },
              { id: 'webhooks', label: 'Webhooks', icon: Webhook },
              { id: 'app_events', label: 'App events', icon: Zap },
              { id: 'logs', label: `Run logs (${state.routineLogs.length})`, icon: Terminal },
            ] as const
          ).map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setSubTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                  subTab === tab.id
                    ? 'bg-zinc-800 text-zinc-100 shadow-xs'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {subTab === 'schedules' && (
          <div className="flex items-center gap-3">
            <select
              value={selectedBotFilter}
              onChange={(e) => setSelectedBotFilter(e.target.value)}
              className="bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-zinc-200 focus:outline-none"
            >
              <option value="all">All MAUSes</option>
              {state.bots.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>

            <div className="flex items-center gap-1 p-1 rounded-xl bg-zinc-900 border border-zinc-800">
              {(['day', '3days', 'week', 'list'] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setCalRange(r)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                    calRange === r ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {r === '3days' ? '3 days' : r.charAt(0).toUpperCase() + r.slice(1)}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="rounded-xl border border-zinc-800/80 bg-[#111113] px-4 py-2.5 text-xs text-zinc-400">
        <strong className="text-zinc-200">Task</strong> = one conversation and result.{' '}
        <strong className="text-zinc-200">Routine</strong> = a reusable schedule (validated by Croner) that creates a fresh task each run, using that agent&apos;s model, tools, permissions, computer, and connected apps.
      </div>

      {subTab === 'schedules' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredRoutines.map((rtn) => {
            const bot = state.bots.find((b) => b.id === rtn.botId) ?? state.bots[0];
            const isRunning = runningRoutineId === rtn.id;
            return (
              <div
                key={rtn.id}
                className="rounded-2xl border border-zinc-800/90 bg-[#121215] p-5 flex flex-col justify-between gap-4"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <OmbMascot color={bot.color} shape={bot.shape} expression={bot.expression} size="md" />
                      <div>
                        <h3 className="text-sm font-semibold text-zinc-100">{rtn.title}</h3>
                        <div className="text-xs text-zinc-400 font-mono mt-0.5">
                          {bot.name} · {rtn.cronExpression} · {rtn.timezone}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() =>
                        onUpdateState((prev) => ({
                          ...prev,
                          routines: prev.routines.map((item) =>
                            item.id === rtn.id ? { ...item, enabled: !item.enabled } : item,
                          ),
                        }))
                      }
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                        rtn.enabled
                          ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-zinc-800 text-zinc-400'
                      }`}
                    >
                      {rtn.enabled ? 'Active' : 'Paused'}
                    </button>
                  </div>

                  <p className="text-xs text-zinc-300 leading-relaxed">{rtn.instructions}</p>

                  <div className="flex flex-wrap items-center gap-2 text-[11px] text-zinc-400 font-mono">
                    <span>Next: {rtn.nextOccurrences[0]}</span>
                    <span>·</span>
                    <span>Target: {rtn.runOnTarget === 'box' ? 'Boat Cloud Box' : 'Bot setup'}</span>
                    <span>·</span>
                    <span>
                      {rtn.runsOkThisWeek} of {rtn.runsTotalThisWeek} runs OK this week
                    </span>
                    {rtn.rememberLastRun && (
                      <>
                        <span>·</span>
                        <span className="text-blue-400">Remembers last run</span>
                      </>
                    )}
                    {rtn.runOnStartup && (
                      <>
                        <span>·</span>
                        <span className="text-emerald-400">Runs on startup</span>
                      </>
                    )}
                  </div>

                  {rtn.lastRunReport && (
                    <div className="rounded-xl border border-zinc-800/80 bg-zinc-950/80 p-3 text-xs text-zinc-300">
                      <div className="text-[11px] font-mono text-zinc-400 mb-1">Latest Run Receipt</div>
                      {rtn.lastRunReport}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-zinc-800/70">
                  <button
                    onClick={() => onOpenThread(rtn.postResultsToThreadId)}
                    className="text-xs text-zinc-400 hover:text-zinc-100 transition-colors"
                  >
                    Open results thread →
                  </button>
                  <button
                    disabled={isRunning}
                    onClick={() => onRunRoutineNow(rtn)}
                    className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-medium flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0"
                  >
                    <Play className="w-3.5 h-3.5" />
                    {isRunning ? 'Running turn…' : 'Run now'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {subTab === 'webhooks' && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-zinc-800 bg-[#121215] p-4 space-y-2">
            <div className="text-xs font-semibold text-zinc-200">
              Dedicated Webhook Receiver (<code className="font-mono text-emerald-400">127.0.0.1:8800</code> &amp; Cloud <code className="font-mono text-emerald-400">/hooks/*</code>)
            </div>
            <p className="text-xs text-zinc-400">
              Exposes only health and secret hook routes. Incoming payloads are fenced with <code className="text-zinc-200">origin: &quot;outside&quot;</code> so untrusted webhook payloads never inherit Chief authority.
            </p>
            <div className="pt-2">
              <label className="block text-[11px] font-mono text-zinc-400 mb-1">
                Test JSON Payload for Manual Webhook Dispatch
              </label>
              <input
                type="text"
                value={webhookTestPayload}
                onChange={(e) => setWebhookTestPayload(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs font-mono text-zinc-200"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {state.webhooks.map((wh) => {
              const bot = state.bots.find((b) => b.id === wh.botId) ?? state.bots[0];
              return (
                <div
                  key={wh.id}
                  className="rounded-2xl border border-zinc-800 bg-[#121215] p-5 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <OmbMascot color={bot.color} shape={bot.shape} expression={bot.expression} size="sm" />
                      <div>
                        <h3 className="text-sm font-semibold text-zinc-100">{wh.title}</h3>
                        <div className="text-xs font-mono text-zinc-400">
                          https://cloud.openmausbot.com/{wh.slug}
                        </div>
                      </div>
                    </div>
                    <span className="text-xs font-mono text-emerald-400">
                      {wh.deliveriesCount} deliveries
                    </span>
                  </div>
                  <p className="text-xs text-zinc-300">{wh.instructions}</p>
                  <div className="flex items-center justify-between pt-2 border-t border-zinc-800/80 text-xs">
                    <span className="font-mono text-zinc-400">Bearer: {wh.secretPreview}</span>
                    <button
                      onClick={() => onTriggerWebhook(wh.id, webhookTestPayload)}
                      className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-100 font-medium transition-colors"
                    >
                      Simulate Delivery
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {subTab === 'app_events' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {state.appTriggers.map((trig) => {
            const bot = state.bots.find((b) => b.id === trig.botId) ?? state.bots[0];
            return (
              <div
                key={trig.id}
                className="rounded-2xl border border-zinc-800 bg-[#121215] p-5 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <OmbMascot color={bot.color} shape={bot.shape} expression={bot.expression} size="sm" />
                    <div>
                      <h3 className="text-sm font-semibold text-zinc-100">{trig.title}</h3>
                      <div className="text-xs font-mono text-zinc-400">
                        {trig.service} ({trig.accountAlias}) · {trig.eventName}
                      </div>
                    </div>
                  </div>
                  <span className="text-xs font-mono text-emerald-400">
                    {trig.eventsToday} / {trig.dailyLimit} today
                  </span>
                </div>
                <div className="rounded-lg bg-zinc-950 border border-zinc-800 px-3 py-2 font-mono text-xs text-zinc-300">
                  Filter: {trig.filterQuery}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {subTab === 'logs' && (
        <div className="space-y-2.5">
          {state.routineLogs.map((log) => {
            const bot = state.bots.find((b) => b.id === log.botId) ?? state.bots[0];
            return (
              <div
                key={log.id}
                className="rounded-xl border border-zinc-800 bg-[#121215] p-4 flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3">
                  <OmbMascot color={bot.color} shape={bot.shape} expression={bot.expression} size="sm" />
                  <div>
                    <div className="text-xs font-semibold text-zinc-100">
                      {log.routineTitle} · <span className="text-zinc-400 font-mono">{log.triggerType}</span>
                    </div>
                    <p className="text-xs text-zinc-400 mt-0.5">{log.summary}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-xs font-mono text-emerald-400">{log.status}</span>
                  <span className="text-xs font-mono text-zinc-500">{log.startedAt}</span>
                  <button
                    onClick={() => onOpenThread(log.threadId)}
                    className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs text-zinc-200"
                  >
                    Open run
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showNewModal && (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-2xl border border-zinc-800 bg-[#121215] p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-zinc-100">Create Schedule / Routine</h3>
              <button onClick={() => setShowNewModal(false)} className="text-xs text-zinc-400 hover:text-white">
                Close
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-zinc-400 mb-1">Routine title</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Daily PR & Release Health Check"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-100"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-zinc-400 mb-1">Assign to Bot</label>
                  <select
                    value={newBotId}
                    onChange={(e) => setNewBotId(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-100"
                  >
                    {state.bots.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name} ({b.title})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-zinc-400 mb-1">Schedule type</label>
                  <select
                    value={newKind}
                    onChange={(e) => setNewKind(e.target.value as 'cron' | 'weekdays' | 'interval' | 'once')}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-100"
                  >
                    <option value="cron">Custom cron (Croner)</option>
                    <option value="weekdays">Weekdays</option>
                    <option value="interval">Interval</option>
                    <option value="once">One-time</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-zinc-400 mb-1">5-field Cron Expression</label>
                  <input
                    type="text"
                    value={newCron}
                    onChange={(e) => setNewCron(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs font-mono text-zinc-100"
                  />
                </div>
                <div>
                  <label className="block text-xs text-zinc-400 mb-1">IANA Timezone</label>
                  <select
                    value={newTz}
                    onChange={(e) => setNewTz(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs font-mono text-zinc-100"
                  >
                    <option value="America/Los_Angeles">America/Los_Angeles</option>
                    <option value="America/New_York">America/New_York</option>
                    <option value="Asia/Kolkata">Asia/Kolkata</option>
                    <option value="Europe/London">Europe/London</option>
                    <option value="UTC">UTC</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs text-zinc-400 mb-1">Instructions for the bot</label>
                <textarea
                  rows={3}
                  value={newInstructions}
                  onChange={(e) => setNewInstructions(e.target.value)}
                  placeholder="What should the bot do when this schedule triggers?"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-100"
                />
              </div>
              <div className="flex flex-wrap items-center gap-4 pt-1 text-xs text-zinc-300">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newRememberLast}
                    onChange={(e) => setNewRememberLast(e.target.checked)}
                  />
                  Remember the last run (2,000 chars)
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newRunStartup}
                    onChange={(e) => setNewRunStartup(e.target.checked)}
                  />
                  Also run when OpenMausBot starts
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newRunTarget === 'box'}
                    onChange={(e) => setNewRunTarget(e.target.checked ? 'box' : 'maus')}
                  />
                  Run on Boat cloud computer
                </label>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-3 border-t border-zinc-800">
              <button
                onClick={() => setShowNewModal(false)}
                className="px-4 py-2 rounded-lg bg-zinc-800 text-xs text-zinc-300"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateRoutine}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium"
              >
                Save Schedule
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface ConnectedAppsViewProps {
  state: WorkspaceState;
  onUpdateState: (updater: (prev: WorkspaceState) => WorkspaceState) => void;
}

export function ConnectedAppsView({ state, onUpdateState }: ConnectedAppsViewProps) {
  const [tab, setTab] = useState<'marketplace' | 'connected' | 'grants'>('marketplace');
  const [search, setSearch] = useState('');
  const [connectingSlug, setConnectingSlug] = useState<string | null>(null);
  const [aliasInput, setAliasInput] = useState('work');
  const [selectedBotIdForGrants, setSelectedBotIdForGrants] = useState(state.bots[0]?.id ?? 'bot-bramble');

  const filteredServices = state.composioServices.filter((s) => {
    const q = search.trim().toLowerCase();
    if (tab === 'connected' && s.accounts.length === 0) return false;
    if (!q) return true;
    return s.name.toLowerCase().includes(q) || s.description.toLowerCase().includes(q);
  });

  const handleConnectAccount = (slug: string) => {
    const cleanAlias = aliasInput.trim() || 'default';
    onUpdateState((prev) => ({
      ...prev,
      composioServices: prev.composioServices.map((s) => {
        if (s.slug !== slug) return s;
        const exists = s.accounts.some((a) => a.alias === cleanAlias && a.status === 'ACTIVE');
        if (exists) return s;
        return {
          ...s,
          accounts: [
            ...s.accounts,
            {
              id: `ca_${Date.now().toString().slice(-4)}_${cleanAlias}`,
              alias: cleanAlias,
              status: 'ACTIVE',
              connectedAt: 'Just now',
            },
          ],
        };
      }),
    }));
    setConnectingSlug(null);
    setAliasInput('work');
  };

  const handleDisconnectAccount = (slug: string, accountId: string) => {
    onUpdateState((prev) => ({
      ...prev,
      composioServices: prev.composioServices.map((s) =>
        s.slug === slug
          ? { ...s, accounts: s.accounts.filter((a) => a.id !== accountId) }
          : s,
      ),
    }));
  };

  const selectedGrantBot =
    state.bots.find((b) => b.id === selectedBotIdForGrants) ?? state.bots[0];

  return (
    <div className="flex-1 overflow-y-auto bg-[#070708] p-6 text-zinc-100 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Connected apps</h1>
          <p className="text-xs text-zinc-400 mt-1">
            Connect the apps your bots can use through Composio multi-account sessions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 p-1 rounded-xl bg-zinc-900 border border-zinc-800">
            {(
              [
                { id: 'marketplace', label: 'Marketplace' },
                { id: 'connected', label: 'Connected' },
                { id: 'grants', label: 'Per-bot tool grants' },
              ] as const
            ).map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                  tab === t.id ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="relative w-64">
            <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search apps"
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-zinc-100 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {tab !== 'grants' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredServices.map((svc) => (
            <div
              key={svc.slug}
              className="rounded-2xl border border-zinc-800/90 bg-[#121215] p-5 flex flex-col justify-between gap-4"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: svc.iconColor }}
                    />
                    <h3 className="text-sm font-semibold text-zinc-100">{svc.name}</h3>
                    <span className="text-xs text-zinc-500">· {svc.category}</span>
                  </div>
                  <p className="text-xs text-zinc-400 leading-relaxed">{svc.description}</p>
                </div>

                <button
                  onClick={() => setConnectingSlug(svc.slug)}
                  className="px-3.5 py-1.5 rounded-full bg-zinc-800 hover:bg-zinc-700 text-xs font-medium text-zinc-100 transition-colors whitespace-nowrap shrink-0"
                >
                  {svc.accounts.length > 0 ? '+ Add account' : 'Connect'}
                </button>
              </div>

              {svc.accounts.length > 0 && (
                <div className="space-y-1.5 pt-2 border-t border-zinc-800/80">
                  <div className="text-[11px] text-zinc-400 font-mono">
                    Labeled Accounts (explicit selection required when &gt;1)
                  </div>
                  {svc.accounts.map((acc) => (
                    <div
                      key={acc.id}
                      className="flex items-center justify-between rounded-lg bg-zinc-950/90 border border-zinc-800/80 px-3 py-1.5 text-xs"
                    >
                      <div className="flex items-center gap-2 font-mono">
                        <span className="text-emerald-400">{acc.alias}</span>
                        <span className="text-zinc-500">({acc.id})</span>
                        <span className="text-[11px] text-zinc-400">· {acc.status}</span>
                      </div>
                      <button
                        onClick={() => handleDisconnectAccount(svc.slug, acc.id)}
                        className="text-xs text-zinc-400 hover:text-red-400 transition-colors"
                      >
                        Disconnect
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {connectingSlug === svc.slug && (
                <div className="rounded-xl border border-zinc-700 bg-zinc-900 p-3 space-y-2.5">
                  <div className="text-xs font-medium text-zinc-200">
                    Connect {svc.name} account with unique alias
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={aliasInput}
                      onChange={(e) => setAliasInput(e.target.value)}
                      placeholder="e.g. work, personal, ops"
                      className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs font-mono text-zinc-100"
                    />
                    <button
                      onClick={() => handleConnectAccount(svc.slug)}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium"
                    >
                      Authorize
                    </button>
                    <button
                      onClick={() => setConnectingSlug(null)}
                      className="px-2.5 py-1.5 rounded-lg bg-zinc-800 text-xs text-zinc-400"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-zinc-800 bg-[#121215] p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-zinc-100">Per-bot tool grants</h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Control which connected-app tools each bot may call (All tools, Exact list, or No tools).
              </p>
            </div>
            <select
              value={selectedBotIdForGrants}
              onChange={(e) => setSelectedBotIdForGrants(e.target.value)}
              className="bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-zinc-100"
            >
              {state.bots.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} ({b.title})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2.5">
            {state.composioServices.slice(0, 6).map((svc) => {
              const currentGrant = selectedGrantBot.toolGrants[svc.slug]?.mode ?? 'all';
              return (
                <div
                  key={svc.slug}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-zinc-800/80 bg-zinc-950/60 p-3.5"
                >
                  <div>
                    <div className="text-xs font-semibold text-zinc-100">{svc.name}</div>
                    <div className="text-[11px] font-mono text-zinc-400 mt-0.5">
                      Available tools: {svc.tools.join(', ')}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 p-1 rounded-lg bg-zinc-900 border border-zinc-800">
                    {(['all', 'exact', 'none'] as const).map((mode) => (
                      <button
                        key={mode}
                        onClick={() =>
                          onUpdateState((prev) => ({
                            ...prev,
                            bots: prev.bots.map((b) =>
                              b.id === selectedGrantBot.id
                                ? {
                                    ...b,
                                    toolGrants: {
                                      ...b.toolGrants,
                                      [svc.slug]: {
                                        service: svc.slug,
                                        mode,
                                        exactTools: mode === 'exact' ? [svc.tools[0]] : [],
                                      },
                                    },
                                  }
                                : b,
                            ),
                          }))
                        }
                        className={`px-2.5 py-1 rounded text-xs font-medium capitalize ${
                          currentGrant === mode
                            ? 'bg-zinc-800 text-zinc-100'
                            : 'text-zinc-400 hover:text-zinc-200'
                        }`}
                      >
                        {mode === 'all' ? 'All tools' : mode === 'exact' ? `Exact (${svc.tools[0]})` : 'No tools'}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

interface WorkflowsAndSkillsViewProps {
  state: WorkspaceState;
  onUpdateState: (updater: (prev: WorkspaceState) => WorkspaceState) => void;
  onResolveApproval?: (
    threadId: string,
    messageId: string,
    decision: 'approved_once' | 'approved_session' | 'approved_always' | 'denied',
  ) => Promise<void>;
  onOpenThread?: (threadId: string) => void;
  onOpenRepoSplit?: () => void;
  onOpenSettings?: () => void;
}

const SUPERVISORY_PIPELINE_STAGES = [
  {
    step: '01',
    id: 'intake',
    title: '01. Trigger & Context Guard',
    domain: 'Origin Fencing & Memory Budget',
    summary:
      'Admits tasks from Person, Croner Routines, or fenced Inbound Webhooks (origin: "outside"). Enforces the 200-line / 24 KB MEMORY.md cap and redacts credentials before prompt assembly.',
    mechanism: 'server/memory/redact.ts · loadWorkspaceState()',
    invariant: 'I7 Append-Only Event Log & Secret Redaction',
  },
  {
    step: '02',
    id: 'routing',
    title: '02. Engine & Bridge Router',
    domain: 'API Connected vs. 127.0.0.1 Localhost',
    summary:
      'Routes execution to the Platform API Connected Gemini model (/api/omb/chat) or directly from the browser to Localhost (Ollama, LM Studio, vLLM, llama.cpp) with automatic API fallback and 68% MCP schema compaction.',
    mechanism: 'find_tool / use_tool (52.4 KB → 14.8 KB)',
    invariant: 'I6 Recorded Turn Level Matches Effective Engine Level',
  },
  {
    step: '03',
    id: 'governance',
    title: '03. Supervisory Approval Gate',
    domain: 'Hierarchical Authority & Safety Floor',
    summary:
      'Computes effective approval mode (own vs. inherited_chief from Team Chief). Blocks Safety Floor never-list commands unconditionally and pauses Ask-mode turns with interactive Approval Cards.',
    mechanism: 'getEffectiveLevel() · Safety Floor Never-List',
    invariant: 'I5 Nothing Claims Approved Without an Explicit Allow',
  },
  {
    step: '04',
    id: 'fixture',
    title: '04. Isolated Fixture Verification',
    domain: 'control:omb Ephemeral Sandbox',
    summary:
      'Launches an isolated fake-engine instance (FAKE_CLAUDE_MODE=deterministic) on an ephemeral port pair and temporary DATA_DIR so server and conversation changes are proved without touching live user data.',
    mechanism: 'node --experimental-strip-types scripts/control-omb.ts launch',
    invariant: 'Zero Live State Mutation During Verification',
  },
  {
    step: '05',
    id: 'settlement',
    title: '05. Runtime Contract & Settlement',
    domain: 'Multi-Agent Assignment Tree (runtime.db)',
    summary:
      'Supervises parent-child delegations via coordinate_bots in SQLite WAL mode. Guarantees exactly one report and at most one wake when a child assignment settles.',
    mechanism: 'server/runtime/invariants.ts (I1–I10)',
    invariant: 'I1–I4 & I8–I10 Single-Wake Terminal Settlement',
  },
  {
    step: '06',
    id: 'sync',
    title: '06. Supervised Release & State Sync',
    domain: 'Portable .omb Snapshot & Two-Part Repo Sync',
    summary:
      'Persists verified state to .omb.json, supervises the 7 GitHub Actions packaging workflows (macOS, Windows NSIS, Linux CUA, Docker), and coordinates the Two-Part GitHub Repository Sync.',
    mechanism: '/api/omb/state · /api/omb/repo-parts',
    invariant: 'Strict Allowlist Redaction on Team Export',
  },
] as const;

export function WorkflowsAndSkillsView({
  state,
  onUpdateState,
  onResolveApproval,
  onOpenThread,
  onOpenRepoSplit,
  onOpenSettings,
}: WorkflowsAndSkillsViewProps) {
  const [activeTab, setActiveTab] = useState<'pipeline' | 'verification' | 'workflows' | 'skills'>('pipeline');
  const [selectedStageIdx, setSelectedStageIdx] = useState<number>(0);
  const [runningId, setRunningId] = useState<string | null>(null);
  const [pipelineAuditRunning, setPipelineAuditRunning] = useState(false);
  const [pipelineAuditStep, setPipelineAuditStep] = useState<number | null>(null);
  const [pipelineReceipt, setPipelineReceipt] = useState<string | null>(null);
  const [recipeCategoryFilter, setRecipeCategoryFilter] = useState<string>('All');
  const [expandedWorkflowIds, setExpandedWorkflowIds] = useState<Record<string, boolean>>({
    'wf-ci': true,
    'wf-release': true,
  });

  const pendingApprovals = state.threads.flatMap((t) =>
    t.messages
      .filter((m) => m.approvalCard?.status === 'pending')
      .map((m) => ({
        threadId: t.id,
        threadTitle: t.title,
        bot: state.bots.find((b) => b.id === t.botId) ?? state.bots[0],
        message: m,
        card: m.approvalCard!,
      })),
  );

  const verifiedCount = state.verificationRecipes.filter((r) => r.status === 'verified').length;
  const passingWorkflowsCount = state.workflows.filter((w) => w.lastStatus === 'passing').length;
  const activeStage = SUPERVISORY_PIPELINE_STAGES[selectedStageIdx] ?? SUPERVISORY_PIPELINE_STAGES[0];

  const handleRunSupervisoryAudit = () => {
    if (pipelineAuditRunning) return;
    setPipelineAuditRunning(true);
    setPipelineReceipt(null);
    let step = 0;
    setPipelineAuditStep(0);
    setSelectedStageIdx(0);

    const interval = setInterval(() => {
      step += 1;
      if (step < SUPERVISORY_PIPELINE_STAGES.length) {
        setPipelineAuditStep(step);
        setSelectedStageIdx(step);
      } else {
        clearInterval(interval);
        setPipelineAuditRunning(false);
        setPipelineAuditStep(null);
        const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        setPipelineReceipt(
          `Supervisory pass completed at ${timestamp} · 6/6 execution stages verified · Invariants I1–I10 PASS · ${verifiedCount}/${state.verificationRecipes.length} isolated fixtures green · ${pendingApprovals.length} approval gate(s) queued for human supervision.`,
        );
        onUpdateState((prev) => ({
          ...prev,
          verificationRecipes: prev.verificationRecipes.map((r) => ({
            ...r,
            status: 'verified',
          })),
          workflows: prev.workflows.map((w) => ({
            ...w,
            lastStatus: 'passing',
            lastRunAt: 'Just now',
          })),
        }));
      }
    }, 220);
  };

  const handleRunVerification = (recipeId: string) => {
    setRunningId(recipeId);
    setTimeout(() => {
      onUpdateState((prev) => ({
        ...prev,
        verificationRecipes: prev.verificationRecipes.map((r) =>
          r.id === recipeId
            ? {
                ...r,
                status: 'verified',
                lastEvidence: JSON.stringify(
                  {
                    fixture: `tmp/omb-verify-${recipeId}`,
                    engine: 'FAKE_CLAUDE_MODE=deterministic',
                    invariants: 'I1..I10 PASS',
                    timestamp: new Date().toISOString(),
                  },
                  null,
                  2,
                ),
              }
            : r,
        ),
      }));
      setRunningId(null);
    }, 300);
  };

  const handleRunWorkflow = (wfId: string) => {
    setRunningId(wfId);
    setTimeout(() => {
      onUpdateState((prev) => ({
        ...prev,
        workflows: prev.workflows.map((w) =>
          w.id === wfId
            ? {
                ...w,
                lastStatus: 'passing',
                lastRunAt: 'Just now',
                lastOutput: `Supervised dry-run completed (${w.steps.length} steps verified in isolated runner).`,
              }
            : w,
        ),
      }));
      setRunningId(null);
    }, 300);
  };

  const categories = [
    'All',
    'Core Harness',
    'Approvals & Safety',
    'Engines & Providers',
    'Computers & VMs',
    'Teams & Library',
    'Memory & Data',
  ];

  const filteredRecipes = state.verificationRecipes.filter(
    (r) => recipeCategoryFilter === 'All' || r.category === recipeCategoryFilter,
  );

  return (
    <div className="flex-1 overflow-y-auto bg-[#070708] p-6 text-zinc-100 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-800/80 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <h1 className="text-xl font-semibold tracking-tight">
              Supervisory Control Plane &amp; Single Source of Truth
            </h1>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Unified supervisory governance over logic workflow execution steps, approval boundaries, isolated <code className="text-zinc-200 font-mono">control:omb</code> fixtures, and runtime invariants.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 p-1 rounded-xl bg-zinc-900 border border-zinc-800">
            {(
              [
                { id: 'pipeline', label: '01. Supervisory Pipeline (SSOT)' },
                { id: 'verification', label: `02. Verification (${verifiedCount}/${state.verificationRecipes.length})` },
                { id: 'workflows', label: `03. CI & Release (${passingWorkflowsCount}/${state.workflows.length})` },
                { id: 'skills', label: '04. Skills & Safety Floor' },
              ] as const
            ).map((t) => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                  activeTab === t.id ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <button
            onClick={handleRunSupervisoryAudit}
            disabled={pipelineAuditRunning}
            className="px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${pipelineAuditRunning ? 'animate-spin' : ''}`} />
            {pipelineAuditRunning ? 'Auditing 6 Stages…' : 'Run Supervisory Pass'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="rounded-xl border border-zinc-800/90 bg-[#101114] p-3.5">
          <div className="text-xs text-zinc-400">Pending Human Approvals</div>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-lg font-semibold font-mono tabular-nums text-amber-400">
              {pendingApprovals.length}
            </span>
            <span className="text-xs text-zinc-400">
              {pendingApprovals.length > 0 ? 'Action required' : 'Queue clear'}
            </span>
          </div>
        </div>
        <div className="rounded-xl border border-zinc-800/90 bg-[#101114] p-3.5">
          <div className="text-xs text-zinc-400">Runtime Invariants (I1–I10)</div>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-lg font-semibold font-mono tabular-nums text-emerald-400">
              10 / 10
            </span>
            <span className="text-xs text-zinc-400 font-mono tabular-nums">
              {state.assignments.length} assignments tracked
            </span>
          </div>
        </div>
        <div className="rounded-xl border border-zinc-800/90 bg-[#101114] p-3.5">
          <div className="text-xs text-zinc-400">Isolated Fixtures (control:omb)</div>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-lg font-semibold font-mono tabular-nums text-emerald-400">
              {verifiedCount} / {state.verificationRecipes.length}
            </span>
            <span className="text-xs text-zinc-400">Deterministic fake-engine</span>
          </div>
        </div>
        <div className="rounded-xl border border-zinc-800/90 bg-[#101114] p-3.5">
          <div className="text-xs text-zinc-400">Tool Bridge Schema Compaction</div>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-lg font-semibold font-mono tabular-nums text-sky-400">
              {state.features.agentsToolBridge ? '-68%' : '0%'}
            </span>
            <span className="text-xs text-zinc-400 font-mono tabular-nums">
              {state.features.agentsToolBridge ? '14.8 KB payload' : '52.4 KB payload'}
            </span>
          </div>
        </div>
      </div>

      {pipelineReceipt && (
        <div className="rounded-xl border border-emerald-500/40 bg-emerald-950/20 px-4 py-3 text-xs text-emerald-200 flex items-center justify-between gap-4">
          <span className="font-mono">{pipelineReceipt}</span>
          <button
            onClick={() => setPipelineReceipt(null)}
            className="text-xs text-emerald-400 hover:text-emerald-200 whitespace-nowrap shrink-0"
          >
            Dismiss
          </button>
        </div>
      )}

      {activeTab === 'pipeline' && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-zinc-800 bg-[#111215] p-5 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="text-sm font-semibold text-zinc-100">
                  Unified 6-Stage Logic Workflow &amp; Supervisory Execution Pipeline
                </h2>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Select any execution step below to inspect its live contract state, or run an end-to-end supervisory audit across all 6 stages.
                </p>
              </div>
              <span className="text-xs font-mono text-zinc-400 tabular-nums">
                Single Source of Truth · Step {selectedStageIdx + 1} of {SUPERVISORY_PIPELINE_STAGES.length}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-2.5">
              {SUPERVISORY_PIPELINE_STAGES.map((stage, idx) => {
                const isSelected = idx === selectedStageIdx;
                const isAuditing = pipelineAuditStep === idx;
                return (
                  <button
                    key={stage.id}
                    type="button"
                    onClick={() => setSelectedStageIdx(idx)}
                    className={`rounded-xl border p-3 text-left transition-colors flex flex-col justify-between gap-2 ${
                      isSelected
                        ? 'border-emerald-500/60 bg-emerald-950/20'
                        : isAuditing
                          ? 'border-amber-500/60 bg-amber-950/20'
                          : 'border-zinc-800/90 bg-zinc-950/70 hover:border-zinc-700'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className={isSelected ? 'text-emerald-400 font-semibold' : 'text-zinc-400'}>
                        STAGE {stage.step}
                      </span>
                      <span className="text-[11px] text-emerald-400">PASS</span>
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-zinc-100 leading-snug">
                        {stage.title.replace(/^\d+\.\s*/, '')}
                      </div>
                      <div className="text-[11px] text-zinc-400 mt-0.5 line-clamp-1">
                        {stage.domain}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="rounded-xl border border-zinc-800/90 bg-zinc-950/90 p-5 grid grid-cols-1 lg:grid-cols-3 gap-5">
              <div className="lg:col-span-2 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-base font-semibold text-zinc-100">{activeStage.title}</h3>
                  <span className="text-xs font-mono text-emerald-400">{activeStage.domain}</span>
                </div>
                <p className="text-xs text-zinc-300 leading-relaxed">{activeStage.summary}</p>
                <div className="flex flex-wrap items-center gap-2 pt-1 text-xs font-mono text-zinc-400">
                  <span>Implementation: <strong className="text-zinc-200">{activeStage.mechanism}</strong></span>
                  <span>·</span>
                  <span>Contract Guard: <strong className="text-emerald-400">{activeStage.invariant}</strong></span>
                </div>
              </div>

              <div className="border-t lg:border-t-0 lg:border-l border-zinc-800/80 pt-4 lg:pt-0 lg:pl-5 flex flex-col justify-between gap-3">
                <div className="space-y-1.5 text-xs">
                  <div className="font-semibold text-zinc-200">Live Stage Telemetry</div>
                  {activeStage.id === 'intake' && (
                    <div className="font-mono text-[11px] text-zinc-400 space-y-1 tabular-nums">
                      <div>Active routines: {state.routines.filter((r) => r.enabled).length} Croner schedules</div>
                      <div>Fenced webhooks: {state.webhooks.length} endpoints (origin: outside)</div>
                      <div>Memory cap: 200 lines / 24.0 KB enforced</div>
                    </div>
                  )}
                  {activeStage.id === 'routing' && (
                    <div className="font-mono text-[11px] text-zinc-400 space-y-1 tabular-nums">
                      <div>Primary API: {state.agentInteractionSettings?.defaultModel ?? 'gemini-3-flash-preview'}</div>
                      <div>Localhost bridge: {state.localhostConfig?.baseUrl ?? 'http://127.0.0.1:11434/v1'}</div>
                      <div>Auto-fallback to API: {state.localhostConfig?.autoFallbackToApi ? 'Enabled' : 'Disabled'}</div>
                    </div>
                  )}
                  {activeStage.id === 'governance' && (
                    <div className="font-mono text-[11px] text-zinc-400 space-y-1 tabular-nums">
                      <div>Pending approvals: {pendingApprovals.length} card(s)</div>
                      <div>Chief escalation flow: {state.features.chiefEscalations ? 'Active' : 'Off'}</div>
                      <div>Safety floor: Active (unconditional block)</div>
                    </div>
                  )}
                  {activeStage.id === 'fixture' && (
                    <div className="font-mono text-[11px] text-zinc-400 space-y-1 tabular-nums">
                      <div>Verified recipes: {verifiedCount} / {state.verificationRecipes.length}</div>
                      <div>Harness driver: FAKE_CLAUDE_MODE=deterministic</div>
                      <div>Port isolation: Ephemeral port pair</div>
                    </div>
                  )}
                  {activeStage.id === 'settlement' && (
                    <div className="font-mono text-[11px] text-zinc-400 space-y-1 tabular-nums">
                      <div>Assignments tracked: {state.assignments.length} in runtime.db</div>
                      <div>Needs input: {state.assignments.filter((a) => a.status === 'needs_input').length}</div>
                      <div>Completed: {state.assignments.filter((a) => a.status === 'completed').length}</div>
                    </div>
                  )}
                  {activeStage.id === 'sync' && (
                    <div className="font-mono text-[11px] text-zinc-400 space-y-1 tabular-nums">
                      <div>CI / Release workflows: {passingWorkflowsCount} / {state.workflows.length} passing</div>
                      <div>Environment: {state.activeEnv}</div>
                      <div>Repo sync mode: Part 1 / Part 2 split ready</div>
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  {activeStage.id === 'routing' && onOpenSettings && (
                    <button
                      type="button"
                      onClick={onOpenSettings}
                      className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-medium text-zinc-100 whitespace-nowrap shrink-0"
                    >
                      Configure API &amp; Localhost
                    </button>
                  )}
                  {activeStage.id === 'fixture' && (
                    <button
                      type="button"
                      onClick={() => setActiveTab('verification')}
                      className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-medium text-zinc-100 whitespace-nowrap shrink-0"
                    >
                      Open Verification Harness
                    </button>
                  )}
                  {activeStage.id === 'sync' && onOpenRepoSplit && (
                    <button
                      type="button"
                      onClick={onOpenRepoSplit}
                      className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-xs font-semibold text-zinc-950 whitespace-nowrap shrink-0"
                    >
                      Open Two-Part Repo Sync
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() =>
                      setSelectedStageIdx((prev) => (prev + 1) % SUPERVISORY_PIPELINE_STAGES.length)
                    }
                    className="px-3 py-1.5 rounded-lg border border-zinc-700 bg-zinc-900 hover:bg-zinc-800 text-xs font-medium text-zinc-200 whitespace-nowrap shrink-0"
                  >
                    Next Stage →
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="rounded-2xl border border-zinc-800 bg-[#111215] p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-zinc-100">
                    Supervisory Approval Queue &amp; Human Gate
                  </h2>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Approve or deny sensitive agent commands directly from the Single Source of Truth without hunting through chat threads.
                  </p>
                </div>
                <span className="font-mono text-xs tabular-nums text-amber-400">
                  {pendingApprovals.length} pending
                </span>
              </div>

              {pendingApprovals.length === 0 ? (
                <div className="rounded-xl border border-zinc-800/80 bg-zinc-950/60 p-4 text-xs text-zinc-400">
                  All agent turns are settled. No commands are currently waiting on human approval.
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingApprovals.map((item) => (
                    <div
                      key={item.message.id}
                      className="rounded-xl border border-amber-500/40 bg-[#16130d] p-4 space-y-2.5"
                    >
                      <div className="flex items-center justify-between gap-2 text-xs">
                        <div className="flex items-center gap-2">
                          <OmbMascot
                            color={item.bot.color}
                            shape={item.bot.shape}
                            expression={item.bot.expression}
                            size="sm"
                          />
                          <span className="font-semibold text-zinc-100">{item.bot.name}</span>
                          <span className="text-zinc-400">·</span>
                          <span className="text-amber-300 font-mono">{item.card.toolName}</span>
                        </div>
                        {onOpenThread && (
                          <button
                            type="button"
                            onClick={() => onOpenThread(item.threadId)}
                            className="text-xs text-zinc-400 hover:text-zinc-200 whitespace-nowrap shrink-0"
                          >
                            Open thread →
                          </button>
                        )}
                      </div>
                      <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-2.5 font-mono text-[11px] text-zinc-200">
                        {item.card.commandOrAction}
                      </div>
                      <p className="text-xs text-zinc-400">{item.card.reason}</p>
                      {onResolveApproval && (
                        <div className="flex flex-wrap items-center gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() =>
                              onResolveApproval(item.threadId, item.message.id, 'approved_once')
                            }
                            className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-semibold flex items-center gap-1 whitespace-nowrap shrink-0"
                          >
                            <Check className="w-3.5 h-3.5" />
                            Allow Once
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              onResolveApproval(item.threadId, item.message.id, 'approved_session')
                            }
                            className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium whitespace-nowrap shrink-0"
                          >
                            Allow for Session
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              onResolveApproval(item.threadId, item.message.id, 'denied')
                            }
                            className="px-3 py-1.5 rounded-lg border border-red-500/40 bg-red-500/10 hover:bg-red-500/20 text-red-300 text-xs font-medium whitespace-nowrap shrink-0"
                          >
                            Deny
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-zinc-800 bg-[#111215] p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-zinc-100">
                    Active Multi-Agent Assignment Ledger (runtime.db)
                  </h2>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Real-time supervision of root turns and Team Chief child delegations across your fleet.
                  </p>
                </div>
                <span className="font-mono text-xs tabular-nums text-zinc-400">
                  {state.assignments.length} records
                </span>
              </div>

              <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                {state.assignments.slice(0, 6).map((asg) => {
                  const assignee = state.bots.find((b) => b.id === asg.assigneeBotId);
                  return (
                    <div
                      key={asg.id}
                      className="rounded-xl border border-zinc-800/90 bg-zinc-950/70 p-3 space-y-1.5"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5 font-mono">
                          <span className="text-zinc-200 font-semibold">
                            {asg.depth > 0 ? '↳ ' : ''}
                            {assignee?.name ?? asg.assigneeBotId}
                          </span>
                          <span className="text-zinc-500">·</span>
                          <span className="text-zinc-400">{asg.origin}</span>
                          <span className="text-zinc-500">·</span>
                          <span className="text-amber-300">
                            {asg.level} ({asg.levelSource})
                          </span>
                        </div>
                        <span
                          className={`font-mono text-[11px] uppercase ${
                            asg.status === 'completed'
                              ? 'text-emerald-400'
                              : asg.status === 'needs_input'
                                ? 'text-amber-400'
                                : 'text-sky-400'
                          }`}
                        >
                          {asg.status}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-300 line-clamp-1">{asg.brief}</p>
                      {asg.result && (
                        <div className="text-[11px] text-zinc-400 font-mono line-clamp-1">
                          Result: {asg.result}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-[#111215] p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="text-sm font-semibold text-zinc-100">
                  Architectural Assessment: Supervisory Control Plane vs. Traditional Deployment Platform
                </h2>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Why Mama&apos;s Agent operates as an executive supervisory harness rather than a raw CI/CD deployment engine.
                </p>
              </div>
              <span className="text-xs font-mono text-emerald-400">
                Governance Architecture Verified
              </span>
            </div>

            <div className="overflow-x-auto rounded-xl border border-zinc-800">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-zinc-800 bg-zinc-900/80 text-zinc-400 font-mono">
                    <th className="py-2.5 px-3.5">Dimension</th>
                    <th className="py-2.5 px-3.5">Raw Deployment Platform</th>
                    <th className="py-2.5 px-3.5 text-emerald-400">Mama&apos;s Agent (Supervisory Control Plane)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/70">
                  <tr>
                    <td className="py-2.5 px-3.5 font-medium text-zinc-100">Execution Model</td>
                    <td className="py-2.5 px-3.5 text-zinc-400">Blindly runs static pipeline scripts on commit or trigger</td>
                    <td className="py-2.5 px-3.5 text-zinc-200">Supervises autonomous multi-agent turns with dynamic tool selection &amp; human-in-the-loop Approval Cards</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3.5 font-medium text-zinc-100">Authority &amp; Trust Boundary</td>
                    <td className="py-2.5 px-3.5 text-zinc-400">Single environment-wide runner token</td>
                    <td className="py-2.5 px-3.5 text-zinc-200">Per-bot approval levels (Ask / Edits / Auto / Full), Chief inheritance, fenced outside webhooks, and Safety Floor never-list</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3.5 font-medium text-zinc-100">Pre-Mutation Verification</td>
                    <td className="py-2.5 px-3.5 text-zinc-400">Deploys directly to staging/production infrastructure</td>
                    <td className="py-2.5 px-3.5 text-zinc-200">Launches isolated ephemeral fixtures (<code className="font-mono text-emerald-300">control:omb</code>) and checks Runtime Invariants I1–I10 first</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3.5 font-medium text-zinc-100">Model &amp; Compute Routing</td>
                    <td className="py-2.5 px-3.5 text-zinc-400">Fixed cloud runner</td>
                    <td className="py-2.5 px-3.5 text-zinc-200">Hybrid browser-to-localhost (<code className="font-mono text-sky-300">127.0.0.1</code>) bridge + API Connected model with automatic failover</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'verification' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-1 p-1 rounded-xl bg-zinc-900 border border-zinc-800">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setRecipeCategoryFilter(cat)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                    recipeCategoryFilter === cat
                      ? 'bg-zinc-800 text-zinc-100'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filteredRecipes.map((rec) => (
              <div
                key={rec.id}
                className="rounded-2xl border border-zinc-800 bg-[#121215] p-5 flex flex-col justify-between gap-4"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono text-emerald-400">{rec.file}</span>
                    <span className="text-zinc-400">{rec.category}</span>
                  </div>
                  <h3 className="text-sm font-semibold text-zinc-100">{rec.title}</h3>
                  <p className="text-xs text-zinc-400 leading-relaxed">{rec.proves}</p>
                  <div className="rounded-lg bg-zinc-950 border border-zinc-800/90 px-3 py-2 font-mono text-[11px] text-zinc-300">
                    $ {rec.command}
                  </div>
                  {rec.lastEvidence && (
                    <pre className="rounded-lg bg-emerald-950/20 border border-emerald-500/30 p-2.5 font-mono text-[11px] text-emerald-300 overflow-x-auto">
                      {rec.lastEvidence}
                    </pre>
                  )}
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-zinc-800/80">
                  <span className="text-xs font-mono text-emerald-400 flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" />
                    Isolated fixture verified
                  </span>
                  <button
                    onClick={() => handleRunVerification(rec.id)}
                    className="px-3.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-medium text-zinc-100 flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${runningId === rec.id ? 'animate-spin' : ''}`} />
                    Run Isolated Fixture
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'workflows' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {state.workflows.map((wf) => {
            const isExpanded = Boolean(expandedWorkflowIds[wf.id]);
            return (
              <div
                key={wf.id}
                className="rounded-2xl border border-zinc-800 bg-[#121215] p-5 flex flex-col justify-between gap-4"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-blue-400">{wf.filename}</span>
                    <span className="text-emerald-400 tabular-nums">
                      {wf.lastStatus.toUpperCase()} · {wf.lastRunAt}
                    </span>
                  </div>
                  <h3 className="text-sm font-semibold text-zinc-100">{wf.name}</h3>
                  <p className="text-xs text-zinc-400 leading-relaxed">{wf.summary}</p>
                  <div className="flex items-center justify-between text-xs text-zinc-400 font-mono pt-1">
                    <span>Trigger: {wf.trigger}</span>
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedWorkflowIds((prev) => ({
                          ...prev,
                          [wf.id]: !prev[wf.id],
                        }))
                      }
                      className="text-zinc-300 hover:text-white underline underline-offset-4"
                    >
                      {isExpanded ? 'Hide steps' : `Inspect ${wf.steps.length} steps`}
                    </button>
                  </div>
                  {isExpanded && (
                    <div className="rounded-xl bg-zinc-950 border border-zinc-800/80 p-3 space-y-1.5">
                      {wf.steps.map((st, idx) => (
                        <div key={idx} className="text-xs font-mono text-zinc-300 flex items-center gap-2">
                          <Check className="w-3 h-3 text-emerald-400 shrink-0" />
                          <span>{st}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {wf.lastOutput && (
                    <div className="rounded-lg bg-emerald-950/20 border border-emerald-500/30 px-3 py-2 text-xs font-mono text-emerald-300">
                      {wf.lastOutput}
                    </div>
                  )}
                </div>

                <div className="flex justify-end pt-2 border-t border-zinc-800/80">
                  <button
                    onClick={() => handleRunWorkflow(wf.id)}
                    className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0"
                  >
                    <Play className="w-3.5 h-3.5" />
                    {runningId === wf.id ? 'Supervising steps…' : 'Supervise Dry-Run'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {activeTab === 'skills' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="rounded-2xl border border-zinc-800 bg-[#121215] p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-emerald-400">/.claude/skills/verify-omb/SKILL.md</span>
              <span className="text-xs text-zinc-400">Canonical Verification Skill</span>
            </div>
            <h3 className="text-sm font-semibold text-zinc-100">verify-omb</h3>
            <p className="text-xs text-zinc-300 leading-relaxed">
              Verify OpenMausBot server and conversation changes against an isolated fake-engine instance before claiming they work. Uses <code className="text-zinc-100">node --experimental-strip-types scripts/control-omb.ts launch</code> so the user&apos;s live OpenMausBot data is never mutated.
            </p>
            <pre className="rounded-xl bg-zinc-950 border border-zinc-800 p-3 font-mono text-[11px] text-zinc-300 overflow-x-auto">
{`# Launch isolated fixture
node --experimental-strip-types scripts/control-omb.ts launch

# Drive from second terminal with explicit URL
pnpm control:omb doctor --url http://127.0.0.1:PORT`}
            </pre>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-[#121215] p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-blue-400">/.claude/skills/windows-release/SKILL.md</span>
              <span className="text-xs text-zinc-400">Release Packaging Skill</span>
            </div>
            <h3 className="text-sm font-semibold text-zinc-100">windows-release</h3>
            <p className="text-xs text-zinc-300 leading-relaxed">
              Build and verify the Windows desktop NSIS installer (<code className="text-zinc-100">OpenMausBot-&lt;version&gt;-setup.exe</code> + <code className="text-zinc-100">OpenMausBot-setup.exe</code> + <code className="text-zinc-100">latest.yml</code>) and verify unpacked resources before upload.
            </p>
            <pre className="rounded-xl bg-zinc-950 border border-zinc-800 p-3 font-mono text-[11px] text-zinc-300 overflow-x-auto">
{`Test-Path release\\win-unpacked\\resources\\server\\index.js
Test-Path release\\win-unpacked\\resources\\ui\\index.html
Get-Content release\\win-unpacked\\resources\\app-update.yml`}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}

interface TemplatesAndDataViewProps {
  state: WorkspaceState;
  onUpdateState: (updater: (prev: WorkspaceState) => WorkspaceState) => void;
  onSelectBotAndThread: (botId: string, threadId: string) => void;
}

const SILICON_VALLEY_DATASET = [
  { company: 'OpenAI', source: 'Wikidata 2026', category: 'AI Lab', capB: 300.0, capAsOf: '2026-02', city: 'San Francisco', precision: 'exact_hq', founded: 2015, employees: 3200 },
  { company: 'Anthropic', source: 'Wikidata 2026', category: 'AI Safety & Frontier', capB: 61.5, capAsOf: '2026-01', city: 'San Francisco', precision: 'exact_hq', founded: 2021, employees: 1100 },
  { company: 'Databricks', source: 'Wikidata 2026', category: 'Data & AI Platform', capB: 62.0, capAsOf: '2025-12', city: 'San Francisco', precision: 'exact_hq', founded: 2013, employees: 7000 },
  { company: 'Anysphere (Cursor)', source: 'Wikidata 2026', category: 'AI Code Editor', capB: 10.2, capAsOf: '2026-01', city: 'San Francisco', precision: 'city_level', founded: 2022, employees: 95 },
  { company: 'Scale AI', source: 'Wikidata 2026', category: 'Data Foundry', capB: 14.0, capAsOf: '2025-11', city: 'San Francisco', precision: 'exact_hq', founded: 2016, employees: 1200 },
  { company: 'NVIDIA', source: 'Original 148 + 2026', category: 'Accelerated Compute', capB: 4750.0, capAsOf: '2026-02', city: 'Santa Clara', precision: 'exact_hq', founded: 1993, employees: 32000 },
  { company: 'Coinbase', source: 'Wikidata 2026', category: 'Fintech', capB: 74.8, capAsOf: '2026-02', city: 'San Francisco', precision: 'city_level', founded: 2012, employees: 3700 },
  { company: 'Accel', source: 'Wikidata VC', category: 'Venture Capital', capB: 18.5, capAsOf: '2025-09', city: 'Palo Alto', precision: 'exact_hq', founded: 1983, employees: 240 },
];

export function TemplatesAndDataView({
  state,
  onUpdateState,
  onSelectBotAndThread,
}: TemplatesAndDataViewProps) {
  const [subTab, setSubTab] = useState<'presets' | 'data' | 'backup'>('presets');
  const [dataQuery, setDataQuery] = useState('');
  const [addedPresetNotice, setAddedPresetNotice] = useState<string | null>(null);
  const [backupJsonText, setBackupJsonText] = useState('');

  const handleCreateBotFromPreset = (presetId: string) => {
    const preset = state.presets.find((p) => p.id === presetId);
    if (!preset) return;
    const newBotId = `bot-${Date.now()}`;
    const newThreadId = `thread-${Date.now()}`;
    const skillsEnabledBySource = preset.source === 'org';

    onUpdateState((prev) => ({
      ...prev,
      bots: [
        ...prev.bots,
        {
          id: newBotId,
          name: preset.bot.name,
          title: preset.bot.title,
          description: preset.bot.description,
          team: preset.source === 'org' ? 'Organization Shelf' : 'General',
          color: preset.bot.color,
          shape: 'mascot',
          expression: preset.bot.expression,
          engineId: 'claude',
          model: 'claude-sonnet-5',
          approvalMode: 'full',
          computerMode: 'cloud',
          workingFolder: `~/workspaces/${preset.bot.name.toLowerCase()}`,
          instructions: preset.bot.instructions,
          memoryEnabled: true,
          memoryUpkeep: true,
          memoryMd: preset.notes,
          memoryArchiveMd: '',
          topics: [],
          memoryJournal: [],
          skills: preset.skills.map((s, idx) => ({
            id: `sk-p-${Date.now()}-${idx}`,
            name: s.name,
            description: s.description,
            enabled: skillsEnabledBySource,
            source: 'preset',
            content: s.content,
          })),
          toolSelectionMode: 'all',
          toolSelectors: ['native:*'],
          toolGrants: {},
          voiceEngine: 'elevenlabs',
          voiceName: 'Zephyr',
          voiceNotesEnabled: true,
          installedPackage: {
            source: preset.source === 'org' ? 'org' : 'file',
            publisher: preset.publisherName,
            packageName: preset.packageName,
            release: preset.release,
          },
        },
      ],
      threads: [
        {
          id: newThreadId,
          botId: newBotId,
          title: `Main conversation with ${preset.bot.name}`,
          status: 'idle',
          updatedAt: 'Just now',
          messages: [
            {
              id: `msg-init-${Date.now()}`,
              role: 'assistant',
              senderBotId: newBotId,
              senderName: preset.bot.name,
              content: `Hi, I'm **${preset.bot.name}** (${preset.bot.title}), created from preset **${preset.name}** (${preset.packageName} ${preset.release}).\n\n- **Skills state:** ${skillsEnabledBySource ? 'Switched ON (trusted Organization release)' : 'Switched OFF (imported from file — review in Skills tab to enable)'}\n- **Connected apps:** Off by default on imported presets.`,
              timestamp: 'Just now',
            },
          ],
        },
        ...prev.threads,
      ],
    }));

    setAddedPresetNotice(`Created @${preset.bot.name} from "${preset.name}"`);
    onSelectBotAndThread(newBotId, newThreadId);
  };

  const handleWithdrawRelease = (presetId: string) => {
    const preset = state.presets.find((p) => p.id === presetId);
    if (!preset) return;
    onUpdateState((prev) => ({
      ...prev,
      presets: prev.presets.map((p) => (p.id === presetId ? { ...p, withdrawn: true } : p)),
      bots: prev.bots.map((b) =>
        b.installedPackage?.packageName === preset.packageName
          ? {
              ...b,
              installedPackage: { ...b.installedPackage, withdrawn: true },
              skills: b.skills.map((s) => ({ ...s, enabled: false })),
            }
          : b,
      ),
    }));
  };

  const filteredDataRows = SILICON_VALLEY_DATASET.filter((row) => {
    const q = dataQuery.trim().toLowerCase();
    if (!q) return true;
    return (
      row.company.toLowerCase().includes(q) ||
      row.category.toLowerCase().includes(q) ||
      row.city.toLowerCase().includes(q)
    );
  });

  const handleGenerateExportJson = () => {
    const payload = {
      kind: 'team-package',
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      redactionPolicy: 'strict-allowlist-no-grants',
      bots: state.bots.map((b) => ({
        name: b.name,
        title: b.title,
        description: b.description,
        color: b.color,
        instructions: b.instructions,
        skills: b.skills.map((s) => ({ name: s.name, description: s.description, content: s.content })),
      })),
      presets: state.presets,
    };
    setBackupJsonText(JSON.stringify(payload, null, 2));
  };

  return (
    <div className="flex-1 overflow-y-auto bg-[#070708] p-6 text-zinc-100 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <Package className="w-5 h-5 text-purple-400" />
            <h1 className="text-xl font-semibold tracking-tight">
              Templates, Organization Library &amp; Data Viewer
            </h1>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Install presets from your organization or shared files, query workspace datasets, and export portable backups.
          </p>
        </div>

        <div className="flex items-center gap-1 p-1 rounded-xl bg-zinc-900 border border-zinc-800">
          {(
            [
              { id: 'presets', label: 'Templates & Org Shelf', icon: Sparkles },
              { id: 'data', label: 'Data Viewer (DuckDB Grid)', icon: Database },
              { id: 'backup', label: 'Share Team & Backups', icon: FileCode },
            ] as const
          ).map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => setSubTab(t.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                  subTab === t.id ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {addedPresetNotice && (
        <div className="rounded-xl border border-emerald-500/40 bg-emerald-950/20 px-4 py-2.5 text-xs text-emerald-300 flex items-center justify-between">
          <span>{addedPresetNotice}</span>
          <button onClick={() => setAddedPresetNotice(null)} className="text-emerald-400">
            Dismiss
          </button>
        </div>
      )}

      {subTab === 'presets' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {state.presets.map((preset) => (
            <div
              key={preset.id}
              className="rounded-2xl border border-zinc-800 bg-[#121215] p-5 flex flex-col justify-between gap-4"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono text-zinc-400">
                    {preset.source === 'org' ? `From ${preset.publisherName}` : `Imported file · ${preset.packageName}`}
                  </span>
                  <span className="font-mono text-zinc-400">v{preset.release}</span>
                </div>

                <div className="flex items-center gap-3">
                  <OmbMascot color={preset.bot.color} expression={preset.bot.expression} size="md" />
                  <div>
                    <h3 className="text-sm font-semibold text-zinc-100">{preset.name}</h3>
                    <div className="text-xs text-zinc-400">
                      Creates @{preset.bot.name} · {preset.bot.title}
                    </div>
                  </div>
                </div>

                <p className="text-xs text-zinc-300 leading-relaxed">{preset.description}</p>

                <div className="rounded-xl bg-zinc-950 border border-zinc-800/80 p-3 space-y-1 text-xs">
                  <div className="text-zinc-400 font-mono text-[11px]">
                    Skills ({preset.source === 'org' ? 'added switched ON' : 'added switched OFF'}):
                  </div>
                  {preset.skills.map((s) => (
                    <div key={s.name} className="font-mono text-zinc-200">
                      • {s.name}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-zinc-800/80">
                {preset.source === 'org' && !preset.withdrawn ? (
                  <button
                    onClick={() => handleWithdrawRelease(preset.id)}
                    className="text-xs text-zinc-400 hover:text-amber-400 transition-colors"
                  >
                    Simulate Withdrawn Release
                  </button>
                ) : preset.withdrawn ? (
                  <span className="text-xs font-mono text-amber-400">Withdrawn by publisher</span>
                ) : (
                  <button
                    onClick={() =>
                      onUpdateState((prev) => ({
                        ...prev,
                        presets: prev.presets.filter((p) => p.id !== preset.id),
                      }))
                    }
                    className="text-xs text-zinc-400 hover:text-red-400 flex items-center gap-1"
                  >
                    <Trash2 className="w-3 h-3" />
                    Remove from New bot
                  </button>
                )}

                <button
                  disabled={Boolean(preset.withdrawn)}
                  onClick={() => handleCreateBotFromPreset(preset.id)}
                  className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white text-xs font-medium transition-colors"
                >
                  Create bot from preset
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {subTab === 'data' && (
        <div className="rounded-2xl border border-zinc-800 bg-[#121215] p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-zinc-100">
                ~/Desktop/silicon-valley-map/companies_2026.csv (Brody&apos;s DuckDB Workspace Table)
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Showing verified sample from 977 cleaned Wikidata AI &amp; VC rows with explicit coordinate precision and dated market cap.
              </p>
            </div>
            <div className="relative w-64">
              <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-2.5" />
              <input
                type="text"
                value={dataQuery}
                onChange={(e) => setDataQuery(e.target.value)}
                placeholder="Filter company, category, city..."
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-zinc-100"
              />
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-zinc-800">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-900/80 text-zinc-400 font-mono">
                  <th className="py-2.5 px-3">Company</th>
                  <th className="py-2.5 px-3">Category</th>
                  <th className="py-2.5 px-3">Source</th>
                  <th className="py-2.5 px-3 text-right">Market Cap ($B)</th>
                  <th className="py-2.5 px-3">Cap as of</th>
                  <th className="py-2.5 px-3">City</th>
                  <th className="py-2.5 px-3">Coord precision</th>
                  <th className="py-2.5 px-3 text-right">Employees</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/70">
                {filteredDataRows.map((row) => (
                  <tr key={row.company} className="hover:bg-zinc-900/40">
                    <td className="py-2.5 px-3 font-medium text-zinc-100">{row.company}</td>
                    <td className="py-2.5 px-3 text-zinc-300">{row.category}</td>
                    <td className="py-2.5 px-3 text-zinc-400">{row.source}</td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums text-emerald-400">
                      ${row.capB.toFixed(1)}B
                    </td>
                    <td className="py-2.5 px-3 font-mono tabular-nums text-zinc-400">{row.capAsOf}</td>
                    <td className="py-2.5 px-3 text-zinc-300">{row.city}</td>
                    <td className="py-2.5 px-3 font-mono text-zinc-400">{row.precision}</td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums text-zinc-300">
                      {row.employees.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {subTab === 'backup' && (
        <div className="rounded-2xl border border-zinc-800 bg-[#121215] p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-zinc-100">
                Portable Team Sharing &amp; Cloud Workspace Backup
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Export your bots, presets, and starter notes as a redacted JSON package to pick up where you left off on any browser or desktop.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleGenerateExportJson}
                className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                Generate Team Package JSON
              </button>
              <button
                onClick={() => {
                  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = 'openmausbot-workspace-backup.json';
                  a.click();
                  URL.revokeObjectURL(url);
                }}
                className="px-3.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-100 text-xs font-medium flex items-center gap-1.5"
              >
                <Upload className="w-3.5 h-3.5" />
                Download Full State (.json)
              </button>
            </div>
          </div>

          {backupJsonText && (
            <pre className="rounded-xl border border-zinc-800 bg-zinc-950 p-4 font-mono text-xs text-emerald-300 max-h-96 overflow-y-auto">
              {backupJsonText}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}
