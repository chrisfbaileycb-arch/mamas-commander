'use client';

import { useState } from 'react';
import {
  X,
  Monitor,
  Terminal,
  Globe,
  Check,
  Undo2,
  Sparkles,
  Search,
  ShieldCheck,
  Brain,
  Wrench,
  UserCheck,
  Sliders,
} from 'lucide-react';
import {
  AGENTS_TOOL_CATALOG,
  MASCOT_COLORS,
  type BotProfile,
  type MascotShape,
  type WorkspaceState,
} from '@/lib/omb-data';
import { OmbMascot } from './omb-mascot';

interface RightDrawerProps {
  mode: 'computer' | 'inspector' | 'profile' | null;
  onClose: () => void;
  bot: BotProfile;
  state: WorkspaceState;
  onUpdateState: (updater: (prev: WorkspaceState) => WorkspaceState) => void;
}

export function OmbRightDrawer({
  mode,
  onClose,
  bot,
  state,
  onUpdateState,
}: RightDrawerProps) {
  const [computerTab, setComputerTab] = useState<'desktop' | 'browser' | 'terminal'>('desktop');
  const [terminalCmd, setTerminalCmd] = useState('pnpm control:omb doctor --isolated');
  const [terminalLogs, setTerminalLogs] = useState<string[]>([
    `$ pwd -> ${bot.workingFolder}`,
    '$ control:omb status -> harness online · runtime.db healthy (I1-I10 green)',
  ]);
  const [browserUrl, setBrowserUrl] = useState('https://github.com/milind-soni/OpenMausBot/releases');
  const [browserSteps, setBrowserSteps] = useState<string[]>([
    '1. Navigated to https://github.com/milind-soni/OpenMausBot/releases (200 OK)',
    '2. Snapshot captured: 0 console errors, 0 failed network requests',
    '3. Verified release assets: OpenMausBot-setup.exe, latest.yml, OpenMausBot.dmg',
  ]);

  const [inspectorTab, setInspectorTab] = useState<'runtime' | 'bridge' | 'invariants'>('runtime');
  const [toolSearchQuery, setToolSearchQuery] = useState('coordinate');
  const [toolTestName, setToolTestName] = useState('list_bots');
  const [toolTestOutput, setToolTestOutput] = useState<string | null>(null);

  const [profileSection, setProfileSection] = useState<'identity' | 'memory' | 'skills' | 'tools'>('identity');
  const [memoryView, setMemoryView] = useState<'main' | 'topics' | 'archive' | 'journal'>('main');
  const [newSkillName, setNewSkillName] = useState('');
  const [newSkillDesc, setNewSkillDesc] = useState('');
  const [newSkillContent, setNewSkillContent] = useState('');
  const [selectorInput, setSelectorInput] = useState(bot.toolSelectors.join('\n'));

  if (!mode) {
    return null;
  }

  const updateBot = (patch: Partial<BotProfile>) => {
    onUpdateState((prev) => ({
      ...prev,
      bots: prev.bots.map((b) => (b.id === bot.id ? { ...b, ...patch } : b)),
    }));
  };

  const memoryLinesCount = bot.memoryMd.split('\n').length;
  const memoryBytesCount = new Blob([bot.memoryMd]).size;
  const linePct = Math.min(100, Math.round((memoryLinesCount / 200) * 100));

  const matchedTools = AGENTS_TOOL_CATALOG.filter((t) => {
    const q = toolSearchQuery.trim().toLowerCase();
    if (!q) return true;
    return (
      t.name.toLowerCase().includes(q) ||
      t.description.toLowerCase().includes(q)
    );
  });

  const handleRunTerminal = () => {
    const cmd = terminalCmd.trim();
    if (!cmd) return;
    const output = cmd.includes('doctor')
      ? '✓ Isolated fixture verified · Port pair healthy · FAKE_CLAUDE_MODE=ok · Invariants I1-I10 passed'
      : cmd.includes('ls')
        ? 'MEMORY.md  memory/  package.json  README.md  runtime.db'
        : `✓ Executed "${cmd}" in ${bot.workingFolder} (${bot.computerMode}) -> exit 0`;
    setTerminalLogs((prev) => [...prev, `$ ${cmd}`, output]);
    setTerminalCmd('');
  };

  const handleCaptureBrowserStep = () => {
    setBrowserSteps((prev) => [
      ...prev,
      `${prev.length + 1}. Snapshot @ ${browserUrl} — DOM settled, 0 page errors, auth session preserved`,
    ]);
  };

  const handleTidyUpMemory = () => {
    const prevMd = bot.memoryMd;
    const lines = prevMd.split('\n');
    const seen = new Set<string>();
    const deduplicated: string[] = [];
    for (const line of lines) {
      const normalized = line.trim().replace(/\.$/, '').toLowerCase();
      if (normalized && seen.has(normalized)) continue;
      if (normalized) seen.add(normalized);
      deduplicated.push(line);
    }
    const tidied = `${deduplicated.join('\n')}\n- 2026-10-19 · from tidy-up · Consolidated duplicate notes and verified 200-line budget.`;
    updateBot({
      memoryMd: tidied,
      memoryJournal: [
        {
          id: `mj-${Date.now()}`,
          timestamp: 'Just now',
          actor: 'tidy',
          summary: 'Ran Tidy up now: deduplicated facts and verified 200-line / 24 KB budget',
          previousMemoryMd: prevMd,
        },
        ...bot.memoryJournal,
      ],
    });
  };

  const handleUndoJournal = (entryId: string) => {
    const entry = bot.memoryJournal.find((j) => j.id === entryId);
    if (!entry || entry.undone) return;
    updateBot({
      memoryMd: entry.previousMemoryMd,
      memoryJournal: bot.memoryJournal.map((j) =>
        j.id === entryId ? { ...j, undone: true } : j,
      ),
    });
  };

  const handleAddSkill = () => {
    if (!newSkillName.trim()) return;
    updateBot({
      skills: [
        ...bot.skills,
        {
          id: `sk-${Date.now()}`,
          name: newSkillName.trim().toLowerCase().replace(/\s+/g, '-'),
          description: newSkillDesc.trim() || 'Custom workspace skill authored in browser.',
          enabled: true,
          source: 'builtin',
          content: newSkillContent.trim() || 'Execute task following canonical verification rules.',
        },
      ],
    });
    setNewSkillName('');
    setNewSkillDesc('');
    setNewSkillContent('');
  };

  return (
    <aside className="w-[380px] shrink-0 border-l border-zinc-800/80 bg-[#0d0d0f] flex flex-col h-full overflow-hidden text-zinc-100">
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-zinc-800/80">
        <div className="flex items-center gap-2">
          {mode === 'computer' && <Monitor className="w-4 h-4 text-emerald-400" />}
          {mode === 'inspector' && <ShieldCheck className="w-4 h-4 text-blue-400" />}
          {mode === 'profile' && <Sliders className="w-4 h-4 text-emerald-400" />}
          <span className="text-sm font-semibold tracking-tight">
            {mode === 'computer' && 'Computer'}
            {mode === 'inspector' && 'Inspector & Job Runtime'}
            {mode === 'profile' && 'Agent profile'}
          </span>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/70 transition-colors"
          aria-label="Close drawer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {mode === 'computer' && (
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-zinc-400">{bot.name}&apos;s screen</span>
              <span className="text-xs font-mono text-zinc-400">
                {bot.computerMode === 'off' ? 'Disabled' : `Active · ${bot.computerMode.toUpperCase()}`}
              </span>
            </div>

            <div className="rounded-xl border border-zinc-800 bg-[#141417] overflow-hidden">
              <div className="flex items-center justify-between px-3 py-2 border-b border-zinc-800/80 bg-zinc-900/60">
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setComputerTab('desktop')}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                      computerTab === 'desktop'
                        ? 'bg-zinc-800 text-zinc-100'
                        : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    Screen
                  </button>
                  <button
                    onClick={() => setComputerTab('browser')}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                      computerTab === 'browser'
                        ? 'bg-zinc-800 text-zinc-100'
                        : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    Browser
                  </button>
                  <button
                    onClick={() => setComputerTab('terminal')}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                      computerTab === 'terminal'
                        ? 'bg-zinc-800 text-zinc-100'
                        : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    Terminal
                  </button>
                </div>
                <span className="text-[11px] font-mono text-zinc-400">1280×800</span>
              </div>

              {computerTab === 'desktop' && (
                <div className="p-4 min-h-[210px] flex flex-col justify-between bg-gradient-to-b from-[#16171b] to-[#101114]">
                  {bot.computerMode === 'off' ? (
                    <div className="my-auto text-center py-8">
                      <Monitor className="w-7 h-7 text-zinc-500 mx-auto mb-2" />
                      <p className="text-xs text-zinc-400">No computer active for {bot.name}</p>
                      <p className="text-[11px] text-zinc-500 mt-1">Select Cloud, Local VM, or VPS below to attach a visual desktop.</p>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-[11px] text-zinc-400 font-mono">
                          <span>noVNC · XFCE4 Managed Desktop</span>
                          <span>{bot.workingFolder}</span>
                        </div>
                        <div className="rounded-lg border border-zinc-800/90 bg-zinc-950/90 p-3 font-mono text-[11px] text-zinc-300 space-y-1.5">
                          <div className="text-emerald-400">$ openmausbot-cua --display :1 --status</div>
                          <div>Display :1 ready · CUA input gate: {bot.approvalMode === 'full' ? 'Authorized (Full Access)' : 'Supervised'}</div>
                          <div>Active window: Chromium ({browserUrl.slice(0, 34)}…)</div>
                          <div className="text-zinc-400">Japanese & UTF-8 glyph pack loaded · 0 dropped frames</div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between pt-3 border-t border-zinc-800/60 mt-3">
                        <span className="text-[11px] text-zinc-400">In-app takeover ready</span>
                        <button
                          onClick={() => setComputerTab('terminal')}
                          className="px-2.5 py-1 rounded-md bg-zinc-800 hover:bg-zinc-700 text-xs font-medium text-zinc-200 transition-colors"
                        >
                          Open Shell
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}

              {computerTab === 'browser' && (
                <div className="p-3 space-y-2.5 bg-[#121215]">
                  <div className="flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                    <input
                      type="text"
                      value={browserUrl}
                      onChange={(e) => setBrowserUrl(e.target.value)}
                      className="flex-1 bg-zinc-900 border border-zinc-800 rounded-md px-2 py-1 text-xs font-mono text-zinc-200 focus:outline-none focus:border-zinc-600"
                    />
                    <button
                      onClick={handleCaptureBrowserStep}
                      className="px-2.5 py-1 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium transition-colors whitespace-nowrap shrink-0"
                    >
                      Snapshot
                    </button>
                  </div>
                  <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-2.5 space-y-1.5 max-h-40 overflow-y-auto">
                    <div className="text-[11px] font-medium text-zinc-400">Recorded Browser Steps & Page Health</div>
                    {browserSteps.map((step, idx) => (
                      <div key={idx} className="text-[11px] font-mono text-zinc-300 leading-relaxed">
                        {step}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {computerTab === 'terminal' && (
                <div className="p-3 space-y-2.5 bg-[#0c0c0e]">
                  <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-2.5 font-mono text-[11px] text-zinc-300 space-y-1 max-h-40 overflow-y-auto">
                    {terminalLogs.map((line, i) => (
                      <div key={i} className={line.startsWith('$') ? 'text-emerald-400' : 'text-zinc-300'}>
                        {line}
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Terminal className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                    <input
                      type="text"
                      value={terminalCmd}
                      onChange={(e) => setTerminalCmd(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleRunTerminal()}
                      placeholder="Run isolated command..."
                      className="flex-1 bg-zinc-900 border border-zinc-800 rounded-md px-2 py-1 text-xs font-mono text-zinc-200 focus:outline-none focus:border-zinc-600"
                    />
                    <button
                      onClick={handleRunTerminal}
                      className="px-2.5 py-1 rounded-md bg-zinc-800 hover:bg-zinc-700 text-xs font-medium text-zinc-100 transition-colors"
                    >
                      Run
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-zinc-800/90 bg-[#141417] p-3.5 space-y-2.5">
            <div className="text-xs font-medium text-zinc-200">
              Cloud & Boat Computer Status
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Give {bot.name} an isolated cloud desktop or self-hosted Linux VPS over Docker SSH transport.
            </p>
            <div className="flex items-center justify-between pt-1 text-xs">
              <span className="text-zinc-400">Managed Cloud Box</span>
              <span className="font-mono text-emerald-400">
                {state.connections.boxApiKeySet ? 'Connected · Ready' : 'Not configured'}
              </span>
            </div>
          </div>

          <div className="rounded-xl border border-zinc-800/90 bg-[#141417] p-3.5 space-y-3">
            <div>
              <h4 className="text-xs font-semibold text-zinc-100">Runs on</h4>
              <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                Pick where {bot.name}&apos;s computer lives. <strong>Local VM</strong> is a CUA-controlled Linux desktop container; <strong>VPS</strong> connects over SSH.
              </p>
            </div>
            <div className="grid grid-cols-5 gap-1 p-1 rounded-lg bg-zinc-900 border border-zinc-800">
              {(
                [
                  { id: 'cloud', label: 'Cloud' },
                  { id: 'local-vm', label: 'Local VM' },
                  { id: 'vps', label: 'VPS' },
                  { id: 'host', label: 'Host' },
                  { id: 'off', label: 'Off' },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => updateBot({ computerMode: opt.id })}
                  className={`py-1.5 px-1 rounded-md text-[11px] font-medium transition-colors whitespace-nowrap shrink-0 ${
                    bot.computerMode === opt.id
                      ? 'bg-zinc-800 text-zinc-100 shadow-xs'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {mode === 'inspector' && (
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="flex items-center gap-1 p-1 rounded-lg bg-zinc-900 border border-zinc-800">
            <button
              onClick={() => setInspectorTab('runtime')}
              className={`flex-1 py-1.5 px-2 rounded-md text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                inspectorTab === 'runtime' ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Assignments ({state.assignments.length})
            </button>
            <button
              onClick={() => setInspectorTab('bridge')}
              className={`flex-1 py-1.5 px-2 rounded-md text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                inspectorTab === 'bridge' ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Tool Bridge
            </button>
            <button
              onClick={() => setInspectorTab('invariants')}
              className={`flex-1 py-1.5 px-2 rounded-md text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                inspectorTab === 'invariants' ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Invariants
            </button>
          </div>

          {inspectorTab === 'runtime' && (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-xs text-zinc-400">
                <span>SQLite runtime.db · Assignment Tree</span>
                <span className="font-mono tabular-nums">WAL mode</span>
              </div>
              {state.assignments.map((asg) => {
                const assignee = state.bots.find((b) => b.id === asg.assigneeBotId);
                return (
                  <div
                    key={asg.id}
                    className="rounded-xl border border-zinc-800/90 bg-[#141417] p-3 space-y-1.5"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-mono text-zinc-300">
                        {asg.depth > 0 ? '↳ ' : ''}
                        {assignee?.name ?? asg.assigneeBotId} · <span className="text-zinc-400">{asg.id}</span>
                      </span>
                      <span
                        className={`font-mono text-[11px] ${
                          asg.status === 'completed'
                            ? 'text-emerald-400'
                            : asg.status === 'needs_input'
                              ? 'text-amber-400'
                              : 'text-blue-400'
                        }`}
                      >
                        {asg.status}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-200 line-clamp-2">{asg.brief}</p>
                    <div className="flex items-center gap-2 text-[11px] text-zinc-400 font-mono pt-1">
                      <span>level: {asg.level}</span>
                      <span>·</span>
                      <span>{asg.levelSource}</span>
                      <span>·</span>
                      <span>origin: {asg.origin}</span>
                    </div>
                    {asg.result && (
                      <div className="text-[11px] text-zinc-400 pt-1 border-t border-zinc-800/70 line-clamp-2">
                        {asg.result}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {inspectorTab === 'bridge' && (
            <div className="space-y-3">
              <div className="rounded-xl border border-zinc-800 bg-[#141417] p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-zinc-100">Agents Tool Bridge</span>
                  <button
                    onClick={() =>
                      onUpdateState((prev) => ({
                        ...prev,
                        features: {
                          ...prev.features,
                          agentsToolBridge: !prev.features.agentsToolBridge,
                        },
                      }))
                    }
                    className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                      state.features.agentsToolBridge
                        ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-zinc-800 text-zinc-400'
                    }`}
                  >
                    {state.features.agentsToolBridge ? 'Enabled (14.8 KB)' : 'Off (52.4 KB)'}
                  </button>
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Lists core tools plus <code className="text-zinc-200">find_tool</code> and <code className="text-zinc-200">use_tool</code>, cutting schema payload by 68% while enforcing identical permission gates.
                </p>
              </div>

              <div className="space-y-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 top-2.5" />
                  <input
                    type="text"
                    value={toolSearchQuery}
                    onChange={(e) => setToolSearchQuery(e.target.value)}
                    placeholder="Test find_tool({ query })..."
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-zinc-100 focus:outline-none focus:border-zinc-600"
                  />
                </div>
                <div className="max-h-52 overflow-y-auto space-y-1.5 pr-1">
                  {matchedTools.map((tool) => (
                    <button
                      key={tool.name}
                      onClick={() => {
                        setToolTestName(tool.name);
                        setToolTestOutput(
                          JSON.stringify(
                            {
                              tool: `mcp__agents__${tool.name}`,
                              bridgedVia: state.features.agentsToolBridge && !tool.alwaysListed ? 'use_tool' : 'direct',
                              readOnlyHint: tool.readOnly,
                              status: 'ok',
                            },
                            null,
                            2,
                          ),
                        );
                      }}
                      className={`w-full text-left rounded-lg border p-2.5 transition-colors ${
                        toolTestName === tool.name
                          ? 'border-emerald-500/50 bg-emerald-950/20'
                          : 'border-zinc-800/80 bg-[#141417] hover:border-zinc-700'
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs font-mono">
                        <span className="text-zinc-100">{tool.name}</span>
                        <span className="text-[10px] text-zinc-400">
                          {tool.alwaysListed ? 'always-listed' : 'via find_tool'} · {tool.readOnly ? 'read-only' : 'write'}
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-400 mt-1 leading-snug">{tool.description}</p>
                    </button>
                  ))}
                </div>
                {toolTestOutput && (
                  <pre className="rounded-lg border border-zinc-800 bg-zinc-950 p-2.5 text-[11px] font-mono text-emerald-300 overflow-x-auto">
                    {toolTestOutput}
                  </pre>
                )}
              </div>
            </div>
          )}

          {inspectorTab === 'invariants' && (
            <div className="space-y-2">
              <div className="text-xs text-zinc-400 mb-1">
                Contract Invariants (<code className="font-mono">server/runtime/invariants.ts</code>)
              </div>
              {[
                { code: 'I1', text: 'No non-terminal assignment without a live owner' },
                { code: 'I2', text: 'Every terminal assignment with reply:resume has 1 report & <=1 wake' },
                { code: 'I3', text: 'No result delivered twice; no brief dispatched twice except rework' },
                { code: 'I4', text: 'Every root ends in a terminal outcome' },
                { code: 'I5', text: 'Nothing claims approved without an allow (expired != completed)' },
                { code: 'I6', text: 'The level a turn ran with equals the level on its record' },
                { code: 'I7', text: 'Every status change writes an append-only event' },
                { code: 'I8', text: 'Restart runs a cut turn again at most once (never after outward action)' },
                { code: 'I9', text: 'Wake happens only when owner is idle on terminal/needs_input/stalled' },
                { code: 'I10', text: 'Runtime never throws into a turn; refusals return typed results' },
              ].map((inv) => (
                <div
                  key={inv.code}
                  className="flex items-start justify-between gap-2 rounded-lg border border-zinc-800/80 bg-[#141417] p-2.5 text-xs"
                >
                  <div>
                    <span className="font-mono font-semibold text-emerald-400 mr-2">{inv.code}</span>
                    <span className="text-zinc-300">{inv.text}</span>
                  </div>
                  <span className="font-mono text-[11px] text-emerald-400 shrink-0">PASS</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {mode === 'profile' && (
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="grid grid-cols-4 gap-1 p-1 rounded-lg bg-zinc-900 border border-zinc-800">
            {(
              [
                { id: 'identity', label: 'Avatar', icon: UserCheck },
                { id: 'memory', label: 'Memory', icon: Brain },
                { id: 'skills', label: 'Skills', icon: Sparkles },
                { id: 'tools', label: 'Access', icon: Wrench },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                onClick={() => setProfileSection(tab.id)}
                className={`py-1.5 px-2 rounded-md text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                  profileSection === tab.id
                    ? 'bg-zinc-800 text-zinc-100'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {profileSection === 'identity' && (
            <div className="space-y-4">
              <div className="rounded-xl border border-zinc-800 bg-[#141417] p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-zinc-200">Avatar</span>
                  <button
                    onClick={() => updateBot({ color: '#10b981', shape: 'mascot', expression: 0 })}
                    className="text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
                  >
                    Reset mascot
                  </button>
                </div>

                <div className="flex justify-center py-3">
                  <OmbMascot
                    color={bot.color}
                    shape={bot.shape}
                    expression={bot.expression}
                    size="xl"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-medium text-zinc-400">Shape</label>
                  <div className="grid grid-cols-4 gap-1 p-1 rounded-lg bg-zinc-900 border border-zinc-800">
                    {(['mascot', 'circle', 'rounded', 'square'] as MascotShape[]).map((sh) => (
                      <button
                        key={sh}
                        onClick={() => updateBot({ shape: sh })}
                        className={`py-1 rounded-md text-xs capitalize transition-colors ${
                          bot.shape === sh
                            ? 'bg-zinc-800 text-zinc-100 font-medium'
                            : 'text-zinc-400 hover:text-zinc-200'
                        }`}
                      >
                        {sh}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-medium text-zinc-400">Expression</label>
                  <div className="grid grid-cols-5 gap-2">
                    {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((expr) => (
                      <button
                        key={expr}
                        onClick={() => updateBot({ expression: expr })}
                        className={`p-2 rounded-lg border flex items-center justify-center transition-colors ${
                          bot.expression === expr
                            ? 'border-blue-500 bg-blue-500/10'
                            : 'border-zinc-800 bg-zinc-900/60 hover:border-zinc-700'
                        }`}
                      >
                        <OmbMascot
                          color={bot.color}
                          shape={bot.shape}
                          expression={expr}
                          size="sm"
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-medium text-zinc-400">Color</label>
                  <div className="flex flex-wrap gap-2">
                    {MASCOT_COLORS.map((col) => (
                      <button
                        key={col}
                        onClick={() => updateBot({ color: col })}
                        className={`w-7 h-7 rounded-full border-2 transition-transform ${
                          bot.color === col ? 'border-white scale-110' : 'border-transparent'
                        }`}
                        style={{ backgroundColor: col }}
                        aria-label={`Select color ${col}`}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-zinc-800 bg-[#141417] p-4 space-y-3">
                <div>
                  <label className="block text-xs text-zinc-400 mb-1">Name</label>
                  <input
                    type="text"
                    value={bot.name}
                    onChange={(e) => updateBot({ name: e.target.value })}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-100"
                  />
                </div>
                <div>
                  <label className="block text-xs text-zinc-400 mb-1">Title & Role</label>
                  <input
                    type="text"
                    value={bot.title}
                    onChange={(e) => updateBot({ title: e.target.value })}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-100"
                  />
                </div>
                <div>
                  <label className="block text-xs text-zinc-400 mb-1">Working folder</label>
                  <input
                    type="text"
                    value={bot.workingFolder}
                    onChange={(e) => updateBot({ workingFolder: e.target.value })}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs font-mono text-zinc-100"
                  />
                </div>
                <div>
                  <label className="block text-xs text-zinc-400 mb-1">Standing instructions</label>
                  <textarea
                    rows={4}
                    value={bot.instructions}
                    onChange={(e) => updateBot({ instructions: e.target.value })}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-100 leading-relaxed"
                  />
                </div>
                {bot.installedPackage && (
                  <div className="pt-2 border-t border-zinc-800 text-[11px] text-zinc-400">
                    From {bot.installedPackage.packageName} {bot.installedPackage.release}
                    {bot.installedPackage.publisher ? ` · ${bot.installedPackage.publisher}` : ''}
                  </div>
                )}
              </div>
            </div>
          )}

          {profileSection === 'memory' && (
            <div className="space-y-3">
              <div className="rounded-xl border border-zinc-800 bg-[#141417] p-3.5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-zinc-100">Let this bot use memory</span>
                  <button
                    onClick={() => updateBot({ memoryEnabled: !bot.memoryEnabled })}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium ${
                      bot.memoryEnabled
                        ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-zinc-800 text-zinc-400'
                    }`}
                  >
                    {bot.memoryEnabled ? 'On' : 'Off'}
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-zinc-300">Memory upkeep (auto-notice & tidy)</span>
                  <button
                    onClick={() => updateBot({ memoryUpkeep: !bot.memoryUpkeep })}
                    className="text-xs font-mono text-zinc-300 hover:text-white"
                  >
                    {bot.memoryUpkeep ? 'Enabled' : 'Paused'}
                  </button>
                </div>

                <div className="pt-2 border-t border-zinc-800/80 space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] font-mono">
                    <span className="text-zinc-300">
                      {memoryLinesCount} / 200 lines · {(memoryBytesCount / 1024).toFixed(1)} / 24.0 KB
                    </span>
                    <span className={linePct >= 80 ? 'text-amber-400' : 'text-emerald-400'}>
                      {linePct}% loaded
                    </span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                    <div
                      className={`h-full transition-all ${
                        linePct >= 100 ? 'bg-red-500' : linePct >= 80 ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.max(4, linePct)}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-zinc-400">
                    Only the first 200 lines load each turn. Credentials are automatically replaced with <code className="text-zinc-300">«redacted N chars»</code>.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between gap-1">
                <div className="flex items-center gap-1 bg-zinc-900 p-1 rounded-lg border border-zinc-800">
                  {(['main', 'topics', 'archive', 'journal'] as const).map((mv) => (
                    <button
                      key={mv}
                      onClick={() => setMemoryView(mv)}
                      className={`px-2 py-1 rounded text-[11px] font-medium capitalize ${
                        memoryView === mv ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      {mv === 'main' ? 'MEMORY.md' : mv}
                    </button>
                  ))}
                </div>
                <button
                  onClick={handleTidyUpMemory}
                  className="px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-medium text-zinc-200 transition-colors whitespace-nowrap shrink-0"
                >
                  Tidy up now
                </button>
              </div>

              {memoryView === 'main' && (
                <textarea
                  rows={10}
                  value={bot.memoryMd}
                  onChange={(e) => updateBot({ memoryMd: e.target.value })}
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-950 p-3 font-mono text-xs text-zinc-200 leading-relaxed focus:outline-none focus:border-zinc-600"
                />
              )}

              {memoryView === 'topics' && (
                <div className="space-y-2">
                  {bot.topics.length === 0 ? (
                    <div className="rounded-xl border border-zinc-800 bg-[#141417] p-4 text-xs text-zinc-400 text-center">
                      No topic files yet. Upkeep creates <code className="text-zinc-300">memory/&lt;topic&gt;.md</code> as conversations grow.
                    </div>
                  ) : (
                    bot.topics.map((tp) => (
                      <div key={tp.name} className="rounded-xl border border-zinc-800 bg-[#141417] p-3 space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-mono font-semibold text-emerald-400">memory/{tp.name}.md</span>
                          <span className="text-[11px] text-zinc-400">{tp.updatedAt}</span>
                        </div>
                        <div className="text-xs font-medium text-zinc-200">{tp.title}</div>
                        <p className="text-xs text-zinc-400 leading-relaxed">{tp.content}</p>
                      </div>
                    ))
                  )}
                </div>
              )}

              {memoryView === 'archive' && (
                <textarea
                  rows={7}
                  value={bot.memoryArchiveMd}
                  onChange={(e) => updateBot({ memoryArchiveMd: e.target.value })}
                  placeholder="memory/archive.md (older or superseded notes)"
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-950 p-3 font-mono text-xs text-zinc-300 leading-relaxed"
                />
              )}

              {memoryView === 'journal' && (
                <div className="space-y-2">
                  {bot.memoryJournal.length === 0 ? (
                    <div className="rounded-xl border border-zinc-800 bg-[#141417] p-4 text-xs text-zinc-400 text-center">
                      No memory journal entries recorded yet.
                    </div>
                  ) : (
                    bot.memoryJournal.map((j) => (
                      <div
                        key={j.id}
                        className="rounded-xl border border-zinc-800 bg-[#141417] p-3 flex items-start justify-between gap-2"
                      >
                        <div className="space-y-1">
                          <div className="text-xs text-zinc-200">{j.summary}</div>
                          <div className="text-[11px] text-zinc-400 font-mono">
                            {j.actor} · {j.timestamp} {j.undone ? '· Undone' : ''}
                          </div>
                        </div>
                        {!j.undone && (
                          <button
                            onClick={() => handleUndoJournal(j.id)}
                            className="flex items-center gap-1 px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-[11px] text-zinc-200 shrink-0"
                          >
                            <Undo2 className="w-3 h-3" />
                            Undo
                          </button>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          )}

          {profileSection === 'skills' && (
            <div className="space-y-3">
              <div className="text-xs text-zinc-400">
                Skills link <code className="text-zinc-200">SKILL.md</code> instructions into {bot.name}&apos;s workspace. Skills from files start switched off; Organization skills start switched on.
              </div>
              {bot.skills.map((sk) => (
                <div key={sk.id} className="rounded-xl border border-zinc-800 bg-[#141417] p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-mono font-semibold text-zinc-100">{sk.name}</span>
                      <span className="text-[11px] text-zinc-400 ml-2">· {sk.source}</span>
                    </div>
                    <button
                      onClick={() =>
                        updateBot({
                          skills: bot.skills.map((s) =>
                            s.id === sk.id ? { ...s, enabled: !s.enabled } : s,
                          ),
                        })
                      }
                      className={`px-2.5 py-0.5 rounded text-xs font-medium ${
                        sk.enabled
                          ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-zinc-800 text-zinc-400'
                      }`}
                    >
                      {sk.enabled ? 'Enabled' : 'Switched off'}
                    </button>
                  </div>
                  <p className="text-xs text-zinc-400">{sk.description}</p>
                  <div className="rounded-lg bg-zinc-950 border border-zinc-800/80 p-2 font-mono text-[11px] text-zinc-300">
                    {sk.content}
                  </div>
                </div>
              ))}

              <div className="rounded-xl border border-zinc-800 bg-[#141417] p-3 space-y-2.5">
                <div className="text-xs font-semibold text-zinc-200">Author new SKILL.md</div>
                <input
                  type="text"
                  value={newSkillName}
                  onChange={(e) => setNewSkillName(e.target.value)}
                  placeholder="Skill name (e.g. release-auditor)"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-zinc-100"
                />
                <input
                  type="text"
                  value={newSkillDesc}
                  onChange={(e) => setNewSkillDesc(e.target.value)}
                  placeholder="Short description"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-zinc-100"
                />
                <textarea
                  rows={3}
                  value={newSkillContent}
                  onChange={(e) => setNewSkillContent(e.target.value)}
                  placeholder="SKILL.md markdown instructions..."
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs font-mono text-zinc-100"
                />
                <button
                  onClick={handleAddSkill}
                  className="w-full py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium transition-colors"
                >
                  Save SKILL.md to Bot
                </button>
              </div>
            </div>
          )}

          {profileSection === 'tools' && (
            <div className="space-y-3">
              <div className="rounded-xl border border-zinc-800 bg-[#141417] p-3.5 space-y-3">
                <div className="text-xs font-semibold text-zinc-100">Access → Tool selection</div>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Reduce tools sent to {bot.name}&apos;s model. Enter one case-sensitive selector per line (<code className="text-zinc-200">native:read</code>, <code className="text-zinc-200">mcp:mail:*</code>).
                </p>
                <div className="grid grid-cols-3 gap-1 p-1 rounded-lg bg-zinc-900 border border-zinc-800">
                  {(
                    [
                      { id: 'all', label: 'All tools' },
                      { id: 'allowlist', label: 'Only allow' },
                      { id: 'excludelist', label: 'Exclude' },
                    ] as const
                  ).map((m) => (
                    <button
                      key={m.id}
                      onClick={() => updateBot({ toolSelectionMode: m.id })}
                      className={`py-1 rounded text-xs font-medium ${
                        bot.toolSelectionMode === m.id
                          ? 'bg-zinc-800 text-zinc-100'
                          : 'text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
                <textarea
                  rows={4}
                  value={selectorInput}
                  onChange={(e) => setSelectorInput(e.target.value)}
                  className="w-full rounded-lg border border-zinc-800 bg-zinc-950 p-2.5 font-mono text-xs text-zinc-200"
                />
                <button
                  onClick={() =>
                    updateBot({
                      toolSelectors: selectorInput
                        .split('\n')
                        .map((s) => s.trim())
                        .filter(Boolean),
                    })
                  }
                  className="w-full py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-medium text-zinc-100 flex items-center justify-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  Save tool selection
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </aside>
  );
}
