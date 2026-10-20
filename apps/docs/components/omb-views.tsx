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
}

export function WorkflowsAndSkillsView({
  state,
  onUpdateState,
}: WorkflowsAndSkillsViewProps) {
  const [activeTab, setActiveTab] = useState<'verification' | 'workflows' | 'skills'>('verification');
  const [runningId, setRunningId] = useState<string | null>(null);

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
    }, 350);
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
                lastOutput: `✓ All ${w.steps.length} pipeline steps completed cleanly in isolated runner.`,
              }
            : w,
        ),
      }));
      setRunningId(null);
    }, 400);
  };

  return (
    <div className="flex-1 overflow-y-auto bg-[#070708] p-6 text-zinc-100 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <h1 className="text-xl font-semibold tracking-tight">
              Repository Workflows, Verification &amp; Agent Skills
            </h1>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Run isolated <code className="text-zinc-200">pnpm control:omb</code> verification fixtures, inspect GitHub Actions workflows, and test <code className="text-zinc-200">.claude/skills</code> live.
          </p>
        </div>

        <div className="flex items-center gap-1 p-1 rounded-xl bg-zinc-900 border border-zinc-800">
          {(
            [
              { id: 'verification', label: 'Verification Harness (control:omb)' },
              { id: 'workflows', label: 'GitHub Workflows (.github/workflows)' },
              { id: 'skills', label: 'Agent Skills (.claude/skills)' },
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
      </div>

      {activeTab === 'verification' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {state.verificationRecipes.map((rec) => (
            <div
              key={rec.id}
              className="rounded-2xl border border-zinc-800 bg-[#121215] p-5 flex flex-col justify-between gap-4"
            >
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-emerald-400">{rec.file}</span>
                  <span className="text-xs text-zinc-400">{rec.category}</span>
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
                  className="px-3.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-medium text-zinc-100 flex items-center gap-1.5 transition-colors"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${runningId === rec.id ? 'animate-spin' : ''}`} />
                  Run Isolated Fixture
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'workflows' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {state.workflows.map((wf) => (
            <div
              key={wf.id}
              className="rounded-2xl border border-zinc-800 bg-[#121215] p-5 flex flex-col justify-between gap-4"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-blue-400">{wf.filename}</span>
                  <span className="text-xs font-mono text-emerald-400">
                    {wf.lastStatus.toUpperCase()} · {wf.lastRunAt}
                  </span>
                </div>
                <h3 className="text-sm font-semibold text-zinc-100">{wf.name}</h3>
                <p className="text-xs text-zinc-400 leading-relaxed">{wf.summary}</p>
                <div className="rounded-xl bg-zinc-950 border border-zinc-800/80 p-3 space-y-1.5">
                  <div className="text-[11px] font-mono text-zinc-400">Trigger: {wf.trigger}</div>
                  {wf.steps.map((st, idx) => (
                    <div key={idx} className="text-xs font-mono text-zinc-300 flex items-center gap-2">
                      <Check className="w-3 h-3 text-emerald-400 shrink-0" />
                      <span>{st}</span>
                    </div>
                  ))}
                </div>
                {wf.lastOutput && (
                  <div className="rounded-lg bg-emerald-950/20 border border-emerald-500/30 px-3 py-2 text-xs font-mono text-emerald-300">
                    {wf.lastOutput}
                  </div>
                )}
              </div>

              <div className="flex justify-end pt-2 border-t border-zinc-800/80">
                <button
                  onClick={() => handleRunWorkflow(wf.id)}
                  className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium flex items-center gap-1.5 transition-colors"
                >
                  <Play className="w-3.5 h-3.5" />
                  {runningId === wf.id ? 'Executing steps…' : 'Trigger Workflow Dry-Run'}
                </button>
              </div>
            </div>
          ))}
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
