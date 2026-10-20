export type ApprovalMode = 'ask' | 'edits' | 'auto' | 'full' | 'custom';

export type MascotShape = 'mascot' | 'circle' | 'rounded' | 'square';

export interface BotSkill {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  source: 'builtin' | 'file' | 'org' | 'preset';
  packageRef?: string;
  content: string;
}

export interface MemoryTopic {
  name: string;
  title: string;
  description: string;
  aliases: string[];
  content: string;
  updatedAt: string;
}

export interface MemoryJournalEntry {
  id: string;
  timestamp: string;
  actor: 'bot' | 'upkeep' | 'person' | 'tidy';
  summary: string;
  previousMemoryMd: string;
  undone?: boolean;
}

export interface ToolGrant {
  service: string;
  mode: 'all' | 'exact' | 'none';
  exactTools: string[];
}

export interface BotProfile {
  id: string;
  name: string;
  title: string;
  description: string;
  team: string;
  isChief?: boolean;
  color: string;
  shape: MascotShape;
  expression: number;
  engineId: string;
  model: string;
  accountLabel?: string;
  approvalMode: ApprovalMode;
  computerMode: 'cloud' | 'local-vm' | 'vps' | 'host' | 'off';
  workingFolder: string;
  instructions: string;
  memoryEnabled: boolean;
  memoryUpkeep: boolean;
  memoryMd: string;
  memoryArchiveMd: string;
  topics: MemoryTopic[];
  memoryJournal: MemoryJournalEntry[];
  skills: BotSkill[];
  toolSelectionMode: 'all' | 'allowlist' | 'excludelist';
  toolSelectors: string[];
  toolGrants: Record<string, ToolGrant>;
  voiceEngine: 'elevenlabs' | 'fish' | 'mac' | 'chatterbox';
  voiceName: string;
  voiceNotesEnabled: boolean;
  installedPackage?: {
    source: 'org' | 'file';
    publisher?: string;
    packageName: string;
    release: string;
    withdrawn?: boolean;
  };
}

export interface ToolCallItem {
  id: string;
  name: string;
  bridgedFrom?: string;
  args: string;
  status: 'running' | 'completed' | 'needs_approval' | 'denied';
  output?: string;
}

export interface ApprovalCardData {
  id: string;
  toolName: string;
  commandOrAction: string;
  reason: string;
  scope: string;
  isReadOnlyMcp?: boolean;
  status: 'pending' | 'approved_once' | 'approved_session' | 'approved_always' | 'denied';
  decidedBy?: 'person' | 'voice' | 'full_access';
}

export interface QuestionCardData {
  id: string;
  question: string;
  subtitle?: string;
  options: { key: string; label: string }[];
  answered?: string;
  dismissed?: boolean;
}

export interface ChangeReceiptData {
  id: string;
  summary: string;
  details: string;
  undone?: boolean;
  undoPayload?: {
    type: 'memory' | 'skill' | 'routine' | 'profile';
    targetBotId: string;
    previousValue: string;
  };
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  senderBotId?: string;
  senderName?: string;
  content: string;
  timestamp: string;
  pinned?: boolean;
  viaCall?: boolean;
  voiceNoteText?: string;
  toolCalls?: ToolCallItem[];
  approvalCard?: ApprovalCardData;
  questionCard?: QuestionCardData;
  changeReceipt?: ChangeReceiptData;
  usage?: {
    uncachedInput: number;
    cachedInput: number;
    output: number;
    costUsd: number;
  };
}

export interface ConversationThread {
  id: string;
  botId: string;
  isGroup?: boolean;
  groupMemberIds?: string[];
  heldBotIds?: string[];
  folder?: string;
  title: string;
  modelOverride?: { engineId: string; model: string };
  approvalModeOverride?: ApprovalMode;
  status: 'idle' | 'running' | 'needs_input';
  unread?: boolean;
  updatedAt: string;
  messages: ChatMessage[];
}

export interface RoutineRunLog {
  id: string;
  routineId: string;
  routineTitle: string;
  botId: string;
  startedAt: string;
  status: 'queued' | 'running' | 'waiting' | 'completed' | 'missed' | 'failed' | 'cancelled';
  triggerType: 'schedule' | 'manual' | 'startup' | 'webhook' | 'app_event';
  summary: string;
  threadId: string;
}

export interface RoutineItem {
  id: string;
  title: string;
  botId: string;
  kind: 'cron' | 'weekdays' | 'interval' | 'once';
  cronExpression: string;
  timezone: string;
  humanSchedule: string;
  nextOccurrences: string[];
  enabled: boolean;
  rememberLastRun: boolean;
  runOnStartup: boolean;
  runOnTarget: 'maus' | 'box';
  postResultsToThreadId: string;
  instructions: string;
  runsOkThisWeek: number;
  runsTotalThisWeek: number;
  lastRunReport?: string;
}

export interface WebhookEndpoint {
  id: string;
  title: string;
  botId: string;
  slug: string;
  secretPreview: string;
  enabled: boolean;
  instructions: string;
  lastTriggeredAt?: string;
  deliveriesCount: number;
}

export interface AppEventTrigger {
  id: string;
  title: string;
  botId: string;
  service: string;
  accountAlias: string;
  eventName: string;
  filterQuery: string;
  enabled: boolean;
  eventsToday: number;
  dailyLimit: number;
}

export interface ConnectedAccount {
  id: string;
  alias: string;
  status: 'ACTIVE' | 'EXPIRED' | 'INITIATED';
  connectedAt: string;
}

export interface ComposioServiceItem {
  slug: string;
  name: string;
  category: string;
  description: string;
  iconColor: string;
  tools: string[];
  accounts: ConnectedAccount[];
}

export interface RuntimeAssignment {
  id: string;
  rootId: string;
  parentId: string | null;
  depth: number;
  origin: 'person' | 'routine' | 'outside';
  requester: string;
  chief: boolean;
  assigneeBotId: string;
  assigneeThreadId: string;
  mode: 'work' | 'consult' | 'notify';
  reply: 'resume' | 'poll' | 'none';
  status: 'queued' | 'running' | 'waiting' | 'needs_input' | 'resume' | 'completed' | 'failed' | 'cancelled';
  outcome?: string;
  level: ApprovalMode;
  levelSource: 'own' | 'inherited_chief' | 'capped_engine';
  executions: number;
  restarts: number;
  brief: string;
  result?: string;
  evidence: {
    okToolCalls: number;
    outwardActions: string[];
    errors: string[];
  };
  updatedAt: string;
}

export interface PresetItem {
  id: string;
  source: 'org' | 'file' | 'builtin';
  key: string;
  name: string;
  description: string;
  packageName: string;
  release: string;
  publisherName?: string;
  withdrawn?: boolean;
  bot: {
    name: string;
    title: string;
    description: string;
    color: string;
    expression: number;
    instructions: string;
  };
  skills: { name: string; description: string; content: string }[];
  playbooks: string[];
  notes: string;
}

export interface EngineCatalogItem {
  id: string;
  name: string;
  category: 'cloud' | 'local';
  version: string;
  authShape: string;
  status: 'ready' | 'signed_out' | 'offline_fallback';
  executablePath: string;
  supportsEditsMode: boolean;
  supportsAutoReview: boolean;
  bridgedToolsEligible: boolean;
  accounts?: { id: string; label: string; configDir: string; active?: boolean }[];
  models: { id: string; label: string; isDefault?: boolean; effortOptions?: string[] }[];
}

export interface RepoWorkflowItem {
  id: string;
  filename: string;
  name: string;
  trigger: string;
  summary: string;
  steps: string[];
  lastStatus: 'passing' | 'ready' | 'running';
  lastRunAt?: string;
  lastOutput?: string;
}

export interface VerificationRecipeItem {
  id: string;
  file: string;
  title: string;
  category: 'Core Harness' | 'Approvals & Safety' | 'Engines & Providers' | 'Computers & VMs' | 'Teams & Library' | 'Memory & Data';
  command: string;
  proves: string;
  status: 'verified' | 'ready';
  lastEvidence?: string;
}

export interface LocalhostConfig {
  baseUrl: string;
  modelName: string;
  autoFallbackToApi: boolean;
  lastProbeStatus?: 'connected' | 'unreachable' | 'untested';
  lastProbeDetail?: string;
  detectedModels?: string[];
}

export interface AgentInteractionSettings {
  defaultModel: string;
  reasoningEffort: 'low' | 'medium' | 'high';
  temperature: number;
  maxOutputTokens: number;
}

export interface WorkspaceState {
  activeEnv: 'my-cloud' | 'this-computer' | 'staging-fleet';
  cloudSyncBannerDismissed: boolean;
  localhostConfig?: LocalhostConfig;
  agentInteractionSettings?: AgentInteractionSettings;
  features: {
    agentsToolBridge: boolean;
    autoRecall: boolean;
    roomMemoryCapture: boolean;
    llmThreadTitles: boolean;
    chiefEscalations: boolean;
    keepAwakeForRoutines: boolean;
  };
  aboutMe: {
    id: string;
    date: string;
    learnedByBot: string;
    fact: string;
  }[];
  connections: {
    composioProjectKeySet: boolean;
    boxApiKeySet: boolean;
    mistralApiKeySet: boolean;
    openCodeGoKeySet: boolean;
    liveCallOpenAiKeySet: boolean;
  };
  engines: EngineCatalogItem[];
  bots: BotProfile[];
  threads: ConversationThread[];
  routines: RoutineItem[];
  routineLogs: RoutineRunLog[];
  webhooks: WebhookEndpoint[];
  appTriggers: AppEventTrigger[];
  composioServices: ComposioServiceItem[];
  assignments: RuntimeAssignment[];
  presets: PresetItem[];
  workflows: RepoWorkflowItem[];
  verificationRecipes: VerificationRecipeItem[];
}

export const MASCOT_COLORS = [
  '#10b981',
  '#3b82f6',
  '#ef4444',
  '#f59e0b',
  '#8b5cf6',
  '#06b6d4',
  '#ec4899',
  '#eab308',
  '#14b8a6',
  '#f97316',
];

export const AGENTS_TOOL_CATALOG = [
  { name: 'coordinate_bots', alwaysListed: true, readOnly: false, description: 'Delegate work, consult, or send one-way notices to specialist teammates with runtime tracking.' },
  { name: 'assignment_status', alwaysListed: false, readOnly: true, description: 'Inspect one assignment status, outcome, and result or all pending child assignments.' },
  { name: 'list_bots', alwaysListed: true, readOnly: true, description: 'List bots in the workspace with their titles, engines, teams, and availability.' },
  { name: 'list_rooms', alwaysListed: true, readOnly: true, description: 'List multi-bot groups and rooms with member rosters.' },
  { name: 'list_room_targets', alwaysListed: true, readOnly: true, description: 'List valid @mention targets inside the current shared room.' },
  { name: 'post_to_room', alwaysListed: true, readOnly: false, description: 'Post a final summary or message directly into an authorized group room.' },
  { name: 'list_threads', alwaysListed: false, readOnly: true, description: 'List threads belonging to the current bot.' },
  { name: 'start_thread', alwaysListed: false, readOnly: false, description: 'Open a new parallel task thread on the current bot.' },
  { name: 'close_thread', alwaysListed: false, readOnly: false, description: 'Archive or close a finished task thread.' },
  { name: 'session_search', alwaysListed: false, readOnly: true, description: 'Search across the bot’s past transcripts, memory archive, and daily turn logs.' },
  { name: 'session_read', alwaysListed: false, readOnly: true, description: 'Read bounded transcript passages from a matching conversation.' },
  { name: 'memory_update', alwaysListed: true, readOnly: false, description: 'Add, update, or organize facts in MEMORY.md and topic notes within the 200-line budget.' },
  { name: 'select_computer', alwaysListed: true, readOnly: false, description: 'Bind the current turn to Cloud, Local VM, VPS over SSH, or Host computer.' },
  { name: 'attach_file', alwaysListed: true, readOnly: false, description: 'Attach a generated file, chart, or artifact from the working folder to the reply.' },
  { name: 'tool_result_read', alwaysListed: true, readOnly: true, description: 'Page through bounded output from a large prior tool execution.' },
  { name: 'request_credential', alwaysListed: true, readOnly: false, description: 'Park the turn and surface a secure credential input card to the user.' },
  { name: 'request_sign_in', alwaysListed: true, readOnly: false, description: 'Park the turn and request browser or OAuth sign-in on the active computer.' },
  { name: 'fill_login', alwaysListed: true, readOnly: false, description: 'Fill an authenticated login from the user’s approved vault into the active browser.' },
  { name: 'send_voice_note', alwaysListed: true, readOnly: false, description: 'Synthesize a spoken voice note (up to 1,000 chars) and attach it with caption.' },
  { name: 'list_triggers', alwaysListed: false, readOnly: true, description: 'List scheduled cron routines, webhooks, and Composio app-event triggers.' },
  { name: 'create_trigger', alwaysListed: false, readOnly: false, description: 'Create a validated cron routine, interval schedule, or app-event trigger.' },
  { name: 'skills_list', alwaysListed: false, readOnly: true, description: 'List installed and offered SKILL.md packages on this bot.' },
  { name: 'skill_author', alwaysListed: false, readOnly: false, description: 'Create or update a SKILL.md instruction file in the bot’s workspace.' },
  { name: 'list_team_setup', alwaysListed: false, readOnly: true, description: 'Read current team roster, Chief assignments, and available model variants.' },
  { name: 'create_bot', alwaysListed: false, readOnly: false, description: 'Create a specialist teammate in the Chief’s authorized team.' },
  { name: 'raise_escalation', alwaysListed: false, readOnly: false, description: 'Park on a human-only gate and notify the Chief of Staff or workspace owner.' },
  { name: 'find_tool', alwaysListed: true, readOnly: true, description: 'Search hidden tools in the catalog by keyword when agentsToolBridge is enabled.' },
  { name: 'use_tool', alwaysListed: true, readOnly: false, description: 'Execute a discovered catalog tool through the same permission and validation gate.' },
];

export const INITIAL_WORKSPACE_STATE: WorkspaceState = {
  activeEnv: 'my-cloud',
  cloudSyncBannerDismissed: false,
  localhostConfig: {
    baseUrl: 'http://127.0.0.1:11434/v1',
    modelName: 'llama3.3:latest',
    autoFallbackToApi: true,
    lastProbeStatus: 'untested',
    lastProbeDetail: 'Ready to probe 127.0.0.1:11434 (Ollama), :1234 (LM Studio), or :8000 (vLLM)',
    detectedModels: ['llama3.3:latest', 'qwen2.5-coder:32b', 'deepseek-r1:14b'],
  },
  agentInteractionSettings: {
    defaultModel: 'gemini-3-flash-preview',
    reasoningEffort: 'high',
    temperature: 0.4,
    maxOutputTokens: 2048,
  },
  features: {
    agentsToolBridge: true,
    autoRecall: true,
    roomMemoryCapture: true,
    llmThreadTitles: true,
    chiefEscalations: true,
    keepAwakeForRoutines: true,
  },
  aboutMe: [
    {
      id: 'am-1',
      date: '2026-10-18',
      learnedByBot: 'Bramble',
      fact: 'Prefers deploying and testing agent workflows directly from the browser so work stays synced anywhere.',
    },
    {
      id: 'am-2',
      date: '2026-10-19',
      learnedByBot: 'Clive',
      fact: 'Values concise, high-signal engineering summaries with explicit verification receipts.',
    },
  ],
  connections: {
    composioProjectKeySet: true,
    boxApiKeySet: true,
    mistralApiKeySet: true,
    openCodeGoKeySet: false,
    liveCallOpenAiKeySet: true,
  },
  engines: [
    {
      id: 'api-connected',
      name: 'API Connected (Platform)',
      category: 'cloud',
      version: 'Live Platform API',
      authShape: 'Platform API Connected (/api/omb/chat)',
      status: 'ready',
      executablePath: '/api/omb/chat',
      supportsEditsMode: true,
      supportsAutoReview: true,
      bridgedToolsEligible: true,
      models: [
        { id: 'gemini-3-flash-preview', label: 'Gemini 3 Flash (API Connected)', isDefault: true, effortOptions: ['low', 'medium', 'high'] },
        { id: 'gemini-3.1-pro-preview', label: 'Gemini 3.1 Pro (API Connected)', effortOptions: ['medium', 'high'] },
        { id: 'gemini-3.1-flash-lite-preview', label: 'Gemini 3.1 Flash Lite (API Connected)' },
      ],
    },
    {
      id: 'localhost-model',
      name: 'Localhost Model (127.0.0.1)',
      category: 'local',
      version: 'Direct Browser → Localhost Bridge',
      authShape: 'Localhost HTTP (Ollama / LM Studio / vLLM)',
      status: 'ready',
      executablePath: 'http://127.0.0.1:11434/v1',
      supportsEditsMode: true,
      supportsAutoReview: true,
      bridgedToolsEligible: true,
      models: [
        { id: 'llama3.3:latest', label: 'Llama 3.3 70B (Localhost :11434)', isDefault: true },
        { id: 'qwen2.5-coder:32b', label: 'Qwen 2.5 Coder 32B (Localhost :11434)' },
        { id: 'deepseek-r1:14b', label: 'DeepSeek R1 14B (Localhost :11434)' },
        { id: 'local-model', label: 'LM Studio / vLLM Active Model (:1234 / :8000)' },
      ],
    },
    {
      id: 'claude',
      name: 'Claude',
      category: 'cloud',
      version: '2.1.266 (Claude Code)',
      authShape: 'Claude CLI login',
      status: 'ready',
      executablePath: '/usr/local/bin/claude',
      supportsEditsMode: true,
      supportsAutoReview: true,
      bridgedToolsEligible: true,
      accounts: [
        { id: 'acc-default', label: 'Default (Work)', configDir: '~/.claude', active: true },
        { id: 'acc-personal', label: 'Personal', configDir: '~/.claude-personal' },
      ],
      models: [
        { id: 'claude-sonnet-5', label: 'Claude Sonnet 5', isDefault: true, effortOptions: ['low', 'medium', 'high'] },
        { id: 'claude-fable-5', label: 'Claude Fable 5', effortOptions: ['medium', 'high'] },
        { id: 'claude-opus-5', label: 'Claude Opus 5', effortOptions: ['medium', 'high'] },
        { id: 'claude-haiku-4.5', label: 'Claude Haiku 4.5' },
      ],
    },
    {
      id: 'antigravity',
      name: 'Antigravity',
      category: 'cloud',
      version: '1.9.4 (Official ACP)',
      authShape: 'Google account via ACP server',
      status: 'ready',
      executablePath: '/usr/local/bin/antigravity-acp',
      supportsEditsMode: true,
      supportsAutoReview: false,
      bridgedToolsEligible: false,
      models: [
        { id: 'gemini-3.8-flash', label: 'Gemini 3.8 Flash', isDefault: true, effortOptions: ['low', 'medium', 'high'] },
        { id: 'gemini-3.1-pro', label: 'Gemini 3.1 Pro (High)', effortOptions: ['medium', 'high'] },
      ],
    },
    {
      id: 'codex',
      name: 'Codex',
      category: 'cloud',
      version: '0.18.2 (Codex CLI)',
      authShape: 'ChatGPT Plan OAuth / API',
      status: 'ready',
      executablePath: '/usr/local/bin/codex',
      supportsEditsMode: false,
      supportsAutoReview: true,
      bridgedToolsEligible: false,
      models: [
        { id: 'gpt-6-astra', label: 'GPT-6 Astra', isDefault: true, effortOptions: ['low', 'medium', 'high'] },
        { id: 'gpt-6-sol', label: 'GPT-6 Sol', effortOptions: ['medium', 'high'] },
        { id: 'gpt-6-luna', label: 'GPT-6 Luna', effortOptions: ['low', 'medium'] },
      ],
    },
    {
      id: 'grok',
      name: 'Grok',
      category: 'cloud',
      version: '1.0.41 (Grok CLI)',
      authShape: 'Grok CLI login',
      status: 'ready',
      executablePath: '/usr/local/bin/grok',
      supportsEditsMode: true,
      supportsAutoReview: true,
      bridgedToolsEligible: false,
      models: [
        { id: 'grok-4', label: 'Grok 4', isDefault: true },
        { id: 'grok-build', label: 'Grok Build' },
      ],
    },
    {
      id: 'cursor',
      name: 'Cursor',
      category: 'cloud',
      version: '0.49.1 (Cursor Agent)',
      authShape: 'Cursor CLI login',
      status: 'ready',
      executablePath: '/usr/local/bin/cursor-agent',
      supportsEditsMode: false,
      supportsAutoReview: true,
      bridgedToolsEligible: false,
      models: [
        { id: 'cursor-fast', label: 'Cursor Composer Fast', isDefault: true },
        { id: 'cursor-deep', label: 'Cursor Deep Review' },
      ],
    },
    {
      id: 'mistral',
      name: 'Mistral (API)',
      category: 'cloud',
      version: 'v1 Chat Completions',
      authShape: 'Workspace API Key',
      status: 'ready',
      executablePath: 'https://api.mistral.ai/v1/models',
      supportsEditsMode: false,
      supportsAutoReview: false,
      bridgedToolsEligible: true,
      models: [
        { id: 'mistral-large-latest', label: 'Mistral Large 2', isDefault: true },
        { id: 'codestral-latest', label: 'Codestral' },
      ],
    },
    {
      id: 'pi',
      name: 'Pi (Local)',
      category: 'local',
      version: '0.9.8 (Native Driver)',
      authShape: 'Local daemon',
      status: 'ready',
      executablePath: '/usr/local/bin/pi',
      supportsEditsMode: false,
      supportsAutoReview: false,
      bridgedToolsEligible: false,
      models: [
        { id: 'qwen-3-coder-32b', label: 'Qwen 3 Coder 32B (Local)', isDefault: true },
        { id: 'llama-4-scout-local', label: 'Llama 4 Scout 17B (Local)' },
      ],
    },
  ],
  bots: [
    {
      id: 'bot-bramble',
      name: 'Bramble',
      title: 'Workspace generalist & workflow runner',
      description: 'First-run companion bot that triages projects, runs browser & repo tasks, and coordinates routines.',
      team: 'General',
      color: '#10b981',
      shape: 'mascot',
      expression: 2,
      engineId: 'claude',
      model: 'claude-sonnet-5',
      accountLabel: 'Default (Work)',
      approvalMode: 'full',
      computerMode: 'cloud',
      workingFolder: '~/workspaces/bramble',
      instructions: 'Be direct, pragmatic, and action-oriented. Use tools when needed, keep MEMORY.md concise, and surface clear verification receipts.',
      memoryEnabled: true,
      memoryUpkeep: true,
      memoryMd: [
        '# Bramble Memory',
        '- 2026-10-18 · from chat "Setup" (noticed) · Running in OpenMausBot Cloud Web Workspace so workflows can be tested from any browser.',
        '- 2026-10-19 · from chat "Onboarding" (noticed) · Default approval level is Full access (per T3 Code & OpenMausBot runtime contract).',
        '- 2026-10-19 · from tidy-up · Keep verification runs isolated using fake-engine fixtures before claiming server changes work.',
      ].join('\n'),
      memoryArchiveMd: [
        '# Archived Memory',
        '- ~~2026-09-12 · Old localhost-only setup note~~ · superseded 2026-10-18 · moved 2026-10-18',
      ].join('\n'),
      topics: [
        {
          name: 'architecture',
          title: 'OpenMausBot Runtime & Architecture',
          description: 'Notes on the SQLite job runtime, agents tool bridge, and approval modes.',
          aliases: ['runtime', 'contract', 'bridge', 'mcp'],
          content: 'The job runtime uses a single Assignment record in runtime.db with invariants I1-I10. With agentsToolBridge enabled, turns receive 12 core tools plus find_tool and use_tool, cutting catalog JSON by 68%.',
          updatedAt: '2026-10-19',
        },
      ],
      memoryJournal: [
        {
          id: 'mj-1',
          timestamp: 'Today 6:02 PM',
          actor: 'upkeep',
          summary: 'Noticed browser deployment preference and filed architecture topic note',
          previousMemoryMd: '# Bramble Memory\n- 2026-10-18 · Initial workspace note.',
        },
      ],
      skills: [
        {
          id: 'sk-verify-omb',
          name: 'verify-omb',
          description: 'Verify OpenMausBot server and conversation changes against an isolated fake-engine instance.',
          enabled: true,
          source: 'builtin',
          content: 'Follow the canonical instructions in docs/verification/README.md. Use pnpm control:omb launch in an isolated temp data directory and verify both action and resulting state.',
        },
        {
          id: 'sk-browser-cua',
          name: 'browser-computer-use',
          description: 'Operate the attached Cloud or Local VM browser and collect page health snapshots.',
          enabled: true,
          source: 'builtin',
          content: 'Use select_computer and browser snapshot tools to inspect DOM state, console errors, and network requests.',
        },
      ],
      toolSelectionMode: 'all',
      toolSelectors: ['native:*', 'mcp:agents:*'],
      toolGrants: {
        gmail: { service: 'gmail', mode: 'all', exactTools: [] },
        github: { service: 'github', mode: 'all', exactTools: [] },
        slack: { service: 'slack', mode: 'exact', exactTools: ['SLACK_SEND_MESSAGE', 'SLACK_LIST_CHANNELS'] },
      },
      voiceEngine: 'elevenlabs',
      voiceName: 'Zephyr',
      voiceNotesEnabled: true,
    },
    {
      id: 'bot-clive',
      name: 'Clive',
      title: 'Chief of Staff',
      description: 'Coordinates Engineering & Ops specialists via coordinate_bots. Clive’s approval level flows down to delegated work.',
      team: 'Core Engineering',
      isChief: true,
      color: '#3b82f6',
      shape: 'mascot',
      expression: 0,
      engineId: 'codex',
      model: 'gpt-6-astra',
      approvalMode: 'full',
      computerMode: 'cloud',
      workingFolder: '~/workspaces/clive-chief',
      instructions: 'You are Clive, Chief of Staff for Core Engineering. Break complex goals into narrow assignments for Brody (Data/Research), GitScout (Repo/CI), and Emaily (Comms), then synthesize their verified evidence.',
      memoryEnabled: true,
      memoryUpkeep: true,
      memoryMd: [
        '# Clive Chief Memory',
        '- 2026-10-19 · Team roster: @Brody (Data & Wikidata analyst), @GitScout (GitHub workflows & releases), @Emaily (Gmail & Slack triage).',
        '- 2026-10-19 · Chief level inheritance active: work delegated from Full access runs teammates at Full access.',
      ].join('\n'),
      memoryArchiveMd: '',
      topics: [],
      memoryJournal: [],
      skills: [
        {
          id: 'sk-team-coord',
          name: 'chief-team-coordinator',
          description: 'Decompose multi-agent goals with coordinate_bots and audit assignment_status.',
          enabled: true,
          source: 'org',
          packageRef: 'org:openmausbot/core-team@2.4.0',
          content: 'Use coordinate_bots with clear done_when criteria. Prefer consult: true for read-only questions and thread: "new" for parallel execution.',
        },
      ],
      toolSelectionMode: 'all',
      toolSelectors: ['native:*'],
      toolGrants: {
        github: { service: 'github', mode: 'all', exactTools: [] },
        linear: { service: 'linear', mode: 'all', exactTools: [] },
      },
      voiceEngine: 'mac',
      voiceName: 'Daniel',
      voiceNotesEnabled: true,
      installedPackage: {
        source: 'org',
        publisher: 'OpenMausBot Core',
        packageName: 'Engineering Command',
        release: '2.4.0',
      },
    },
    {
      id: 'bot-brody',
      name: 'Brody',
      title: 'Data & Research Specialist',
      description: 'Builds clean datasets, runs DuckDB queries, and verifies entity provenance across sources.',
      team: 'Core Engineering',
      color: '#ef4444',
      shape: 'mascot',
      expression: 4,
      engineId: 'antigravity',
      model: 'gemini-3.1-pro',
      approvalMode: 'full',
      computerMode: 'local-vm',
      workingFolder: '~/Desktop/silicon-valley-map',
      instructions: 'Verify dataset schemas, flag survivorship bias or inconsistent timestamps, and output clean tabular summaries.',
      memoryEnabled: true,
      memoryUpkeep: true,
      memoryMd: [
        '# Brody Memory',
        '- 2026-10-19 · Completed Silicon Valley AI & VC dataset normalization (977 verified rows after filtering city-ID collisions).',
      ].join('\n'),
      memoryArchiveMd: '',
      topics: [],
      memoryJournal: [],
      skills: [
        {
          id: 'sk-duckdb',
          name: 'duckdb-data-verifier',
          description: 'Run analytical SQL queries and export clean CSV/TSV snapshots.',
          enabled: true,
          source: 'builtin',
          content: 'Inspect column cardinality, null ratios, and date provenance before joining external tables.',
        },
      ],
      toolSelectionMode: 'all',
      toolSelectors: ['native:*'],
      toolGrants: {
        google_sheets: { service: 'google_sheets', mode: 'all', exactTools: [] },
      },
      voiceEngine: 'elevenlabs',
      voiceName: 'Puck',
      voiceNotesEnabled: false,
    },
    {
      id: 'bot-gitscout',
      name: 'GitScout',
      title: 'CI, Packaging & Release Engineer',
      description: 'Monitors GitHub Actions workflows, Windows NSIS & macOS builds, and runs verification fixtures.',
      team: 'Core Engineering',
      color: '#10b981',
      shape: 'mascot',
      expression: 5,
      engineId: 'claude',
      model: 'claude-sonnet-5',
      approvalMode: 'ask',
      computerMode: 'vps',
      workingFolder: '~/repos/openmausbot',
      instructions: 'Guard release integrity. Check latest.yml sha512 hashes, verify server/index.js and ui/index.html exist in unpacked builds, and run isolated control:omb fixtures.',
      memoryEnabled: true,
      memoryUpkeep: true,
      memoryMd: [
        '# GitScout Memory',
        '- 2026-10-19 · Windows release must upload both OpenMausBot-<version>-setup.exe and OpenMausBot-setup.exe plus latest.yml.',
        '- 2026-10-19 · Approval mode is Ask for approval so release commands always show an interactive confirmation card.',
      ].join('\n'),
      memoryArchiveMd: '',
      topics: [],
      memoryJournal: [],
      skills: [
        {
          id: 'sk-win-rel',
          name: 'windows-release',
          description: 'Build and verify the Windows desktop NSIS installer + latest.yml update feed.',
          enabled: true,
          source: 'builtin',
          content: 'Check release/win-unpacked/resources/server/index.js, ui/index.html, and app-update.yml before publishing to GitHub releases.',
        },
      ],
      toolSelectionMode: 'allowlist',
      toolSelectors: ['native:read', 'native:edit', 'native:bash', 'mcp:github:*'],
      toolGrants: {
        github: { service: 'github', mode: 'all', exactTools: [] },
        sentry: { service: 'sentry', mode: 'all', exactTools: [] },
      },
      voiceEngine: 'chatterbox',
      voiceName: 'chatterbox-turbo',
      voiceNotesEnabled: true,
    },
    {
      id: 'bot-emaily',
      name: 'Emaily',
      title: 'Inbox, Calendar & Connected Apps Triage',
      description: 'Manages multi-account Gmail (`work` & `personal`), Slack channels, and morning executive briefs.',
      team: 'Operations',
      color: '#14b8a6',
      shape: 'mascot',
      expression: 1,
      engineId: 'claude',
      model: 'claude-sonnet-5',
      approvalMode: 'auto',
      computerMode: 'off',
      workingFolder: '~/workspaces/emaily',
      instructions: 'Keep work and personal Gmail accounts strictly separated by their Composio alias. Summarize action items clearly.',
      memoryEnabled: true,
      memoryUpkeep: true,
      memoryMd: [
        '# Emaily Memory',
        '- 2026-10-19 · Connected Gmail aliases: "work" (ca_901_work) and "personal" (ca_902_personal). Always specify account alias explicitly.',
      ].join('\n'),
      memoryArchiveMd: '',
      topics: [],
      memoryJournal: [],
      skills: [],
      toolSelectionMode: 'all',
      toolSelectors: ['native:*'],
      toolGrants: {
        gmail: { service: 'gmail', mode: 'exact', exactTools: ['GMAIL_FETCH_EMAILS', 'GMAIL_CREATE_DRAFT', 'GMAIL_SEND_EMAIL'] },
        google_calendar: { service: 'google_calendar', mode: 'all', exactTools: [] },
        slack: { service: 'slack', mode: 'all', exactTools: [] },
      },
      voiceEngine: 'fish',
      voiceName: 'Kore',
      voiceNotesEnabled: true,
    },
  ],
  threads: [
    {
      id: 'thread-bramble-main',
      botId: 'bot-bramble',
      folder: 'Workspace Setup',
      title: 'Getting started & live workflows',
      status: 'idle',
      updatedAt: '6:02 PM',
      messages: [
        {
          id: 'msg-b1',
          role: 'assistant',
          senderBotId: 'bot-bramble',
          senderName: 'Bramble',
          content: "Hey — I'm Bramble. Nice to meet you.\n\nYou're running the live **OpenMausBot Cloud Web Platform** right in your browser. Every tab in the sidebar—**Bots & Groups**, **Tasks & Routines**, **Connected Apps**, **Skills & Workflows**, **Templates & Org Library**, and **Data & Files**—is live and wired to the job runtime. Pick a focus below or send me any task to test out a workflow!",
          timestamp: 'Today 6:02 PM',
          questionCard: {
            id: 'q-onboarding-1',
            question: 'What do you mostly want help with?',
            subtitle: "Pick whatever's closest; we can always expand from there.",
            options: [
              { key: 'A', label: 'Work & projects (Run multi-bot engineering & repo workflows)' },
              { key: 'B', label: 'Writing & research (Analyze datasets, docs & web snapshots)' },
              { key: 'C', label: 'Life admin (Automate routines, Gmail triage & schedules)' },
              { key: 'D', label: 'A bit of everything (Full tour of OpenMausBot capabilities)' },
            ],
          },
          usage: {
            uncachedInput: 410,
            cachedInput: 1840,
            output: 96,
            costUsd: 0.0021,
          },
        },
      ],
    },
    {
      id: 'thread-brody-main',
      botId: 'bot-brody',
      folder: 'Datasets',
      title: 'Silicon Valley AI & VC Map (977 rows)',
      status: 'idle',
      updatedAt: '3:06 PM',
      messages: [
        {
          id: 'msg-br1',
          role: 'user',
          content: 'Clean and merge the Silicon Valley company map with the latest 2025-2026 AI startups and VC firms from Wikidata, and flag any schema caveats.',
          timestamp: 'Today 3:04 PM',
        },
        {
          id: 'msg-br2',
          role: 'assistant',
          senderBotId: 'bot-brody',
          senderName: 'Brody',
          content: [
            'Updated `~/Desktop/silicon-valley-map/companies_2026.csv` — this fills the biggest gap in the c. 2021 map.',
            '',
            '**OpenAI, Anthropic, Databricks, Scale AI, Anysphere (Cursor), Coinbase, Affirm, Allbirds, AngelList** are all now in, plus VC firms like Accel and 500 Global.',
            '',
            '**Columns:** `Company · Source · Category · Market Cap ($B) · Cap as of · City · Coord precision · Latitude · Longitude · Website · Founded · Employees · Industry`',
            '',
            'Four things to know before you use it:',
            '- **Coordinates differ in precision by source.** The original 148 have exact HQ coords; the new rows have city-level coords (`Coord precision` column).',
            '- **Market cap is dated per row.** Kept `Cap as of` so every figure is self-documenting.',
            '- **Notability filter:** Requiring >=4 sitelinks drops contamination (like St. Petersburg, Russia city-ID collision) leaving **977 clean rows**.',
          ].join('\n'),
          timestamp: 'Today 3:06 PM',
          toolCalls: [
            {
              id: 'tc-brody-1',
              name: 'mcp__agents__tool_result_read',
              bridgedFrom: 'use_tool',
              args: '{"dataset":"silicon_valley_wikidata_merged.parquet","rows":977}',
              status: 'completed',
              output: 'Verified 977 clean rows across 3 sheets (Companies, Summary, Notes).',
            },
          ],
          changeReceipt: {
            id: 'cr-brody-1',
            summary: 'Brody saved a fact to MEMORY.md: Silicon Valley AI & VC dataset normalization (977 rows)',
            details: 'Added line: - 2026-10-19 · Completed Silicon Valley AI & VC dataset normalization (977 verified rows after filtering city-ID collisions).',
          },
          usage: {
            uncachedInput: 1280,
            cachedInput: 4920,
            output: 342,
            costUsd: 0.0084,
          },
        },
      ],
    },
    {
      id: 'thread-gitscout-main',
      botId: 'bot-gitscout',
      folder: 'Releases & CI',
      title: 'v0.34.0 Release & Verification Check',
      status: 'needs_input',
      updatedAt: '4:15 PM',
      messages: [
        {
          id: 'msg-gs1',
          role: 'user',
          content: 'Verify the v0.34.0 Windows release artifacts and run the isolated control:omb doctor check before uploading to GitHub Releases.',
          timestamp: 'Today 4:14 PM',
        },
        {
          id: 'msg-gs2',
          role: 'assistant',
          senderBotId: 'bot-gitscout',
          senderName: 'GitScout',
          content: 'I checked `release/win-unpacked/resources/` against the `windows-release` skill preconditions:\n\n1. `server/index.js` — present (harness server bundle verified)\n2. `ui/index.html` — present (renderer bundle verified)\n3. `app-update.yml` — points at `milind-soni/OpenMausBot` with no `publisherName` lock\n\nBecause this thread is in **Ask for approval** mode, please approve the isolated `control:omb` verification & release upload command below:',
          timestamp: 'Today 4:15 PM',
          approvalCard: {
            id: 'app-gs-1',
            toolName: 'Bash',
            commandOrAction: 'node --experimental-strip-types scripts/control-omb.ts doctor --isolated && gh release upload v0.34.0 release/OpenMausBot-0.34.0-setup.exe release/latest.yml',
            reason: 'Run isolated control:omb doctor verification and attach verified NSIS installer + latest.yml to v0.34.0 draft.',
            scope: '~/repos/openmausbot (VPS over SSH)',
            status: 'pending',
          },
          usage: {
            uncachedInput: 890,
            cachedInput: 2100,
            output: 185,
            costUsd: 0.0042,
          },
        },
      ],
    },
    {
      id: 'thread-clive-main',
      botId: 'bot-clive',
      folder: 'Command',
      title: 'Coordinate Q4 Engineering & Ops Sprint',
      status: 'idle',
      updatedAt: '5:20 PM',
      messages: [
        {
          id: 'msg-c1',
          role: 'assistant',
          senderBotId: 'bot-clive',
          senderName: 'Clive',
          content: "I'm Clive, Chief of Staff for **Core Engineering**. When you give me a high-level goal, I use `coordinate_bots` to dispatch bounded assignments to **@Brody**, **@GitScout**, and **@Emaily**. Because my conversation is set to **Full access**, my approval level automatically flows down to the work threads I open on teammates.",
          timestamp: 'Today 5:20 PM',
        },
      ],
    },
    {
      id: 'thread-group-launch',
      botId: 'bot-clive',
      isGroup: true,
      groupMemberIds: ['bot-clive', 'bot-bramble', 'bot-brody', 'bot-gitscout', 'bot-emaily'],
      heldBotIds: [],
      title: '#product-launch-room',
      status: 'idle',
      updatedAt: '5:45 PM',
      messages: [
        {
          id: 'msg-gl1',
          role: 'assistant',
          senderBotId: 'bot-clive',
          senderName: 'Clive',
          content: 'Welcome to **#product-launch-room**. All 5 agents share context here. You can @mention a specific specialist (e.g. `@Brody` or `@GitScout`), write `stop @Bot` to hold a member, or give me a team goal and I will coordinate the room.',
          timestamp: 'Today 5:45 PM',
          usage: {
            uncachedInput: 320,
            cachedInput: 1100,
            output: 64,
            costUsd: 0.0015,
          },
        },
      ],
    },
  ],
  routines: [
    {
      id: 'rtn-morning-brief',
      title: 'Morning Inbox, GitHub & CI Briefing',
      botId: 'bot-emaily',
      kind: 'cron',
      cronExpression: '0 9 * * MON-FRI',
      timezone: 'America/Los_Angeles',
      humanSchedule: 'Weekdays at 9:00 AM',
      nextOccurrences: ['Tomorrow at 9:00 AM', 'Thu at 9:00 AM', 'Fri at 9:00 AM'],
      enabled: true,
      rememberLastRun: true,
      runOnStartup: true,
      runOnTarget: 'maus',
      postResultsToThreadId: 'thread-bramble-main',
      instructions: 'Check work Gmail unread threads, summarize open GitHub PRs needing review, and post a 5-bullet digest.',
      runsOkThisWeek: 4,
      runsTotalThisWeek: 4,
      lastRunReport: 'All 4 weekday runs succeeded. Latest digest triaged 12 emails and 3 PRs.',
    },
    {
      id: 'rtn-nightly-verify',
      title: 'Nightly Isolated Harness Verification (control:omb)',
      botId: 'bot-gitscout',
      kind: 'cron',
      cronExpression: '30 2 * * *',
      timezone: 'UTC',
      humanSchedule: 'Daily at 02:30 UTC',
      nextOccurrences: ['Tonight at 02:30 UTC', 'Tomorrow at 02:30 UTC', 'Fri at 02:30 UTC'],
      enabled: true,
      rememberLastRun: true,
      runOnStartup: false,
      runOnTarget: 'box',
      postResultsToThreadId: 'thread-gitscout-main',
      instructions: 'Launch disposable fake-engine fixture with scripts/control-omb.ts, verify invariants I1-I10, and report any regression.',
      runsOkThisWeek: 7,
      runsTotalThisWeek: 7,
      lastRunReport: 'Passed all 10 runtime contract invariants (I1-I10) in 14.2s.',
    },
    {
      id: 'rtn-monthly-report',
      title: 'First-of-Month Usage Ledger & Cost Audit',
      botId: 'bot-brody',
      kind: 'cron',
      cronExpression: '0 9 1 * *',
      timezone: 'Asia/Kolkata',
      humanSchedule: '1st of every month at 9:00 AM (Asia/Kolkata)',
      nextOccurrences: ['Nov 1, 2026 9:00 AM', 'Dec 1, 2026 9:00 AM', 'Jan 1, 2027 9:00 AM'],
      enabled: true,
      rememberLastRun: false,
      runOnStartup: false,
      runOnTarget: 'maus',
      postResultsToThreadId: 'thread-brody-main',
      instructions: 'Aggregate token cache split and spend cap ledger across all workspace bots and export a monthly summary table.',
      runsOkThisWeek: 1,
      runsTotalThisWeek: 1,
    },
  ],
  routineLogs: [
    {
      id: 'rlog-1',
      routineId: 'rtn-morning-brief',
      routineTitle: 'Morning Inbox, GitHub & CI Briefing',
      botId: 'bot-emaily',
      startedAt: 'Today 9:00 AM',
      status: 'completed',
      triggerType: 'schedule',
      summary: 'Triaged 8 work emails, flagged 2 urgent PR reviews, and posted digest to main thread.',
      threadId: 'thread-bramble-main',
    },
    {
      id: 'rlog-2',
      routineId: 'rtn-nightly-verify',
      routineTitle: 'Nightly Isolated Harness Verification (control:omb)',
      botId: 'bot-gitscout',
      startedAt: 'Today 2:30 AM',
      status: 'completed',
      triggerType: 'schedule',
      summary: 'Verified runtime.db invariants I1-I10 and agentsToolBridge 68% catalog compression.',
      threadId: 'thread-gitscout-main',
    },
  ],
  webhooks: [
    {
      id: 'wh-github-pr',
      title: 'GitHub Pull Request & Release Hook',
      botId: 'bot-gitscout',
      slug: 'hooks/wh_gh_release_9f8a2c',
      secretPreview: 'whsec_89f2••••••••••••4c1a',
      enabled: true,
      instructions: 'Inspect incoming GitHub webhook payload (fenced as untrusted outside lineage), check CI status, and notify #product-launch-room.',
      lastTriggeredAt: 'Today 1:15 PM',
      deliveriesCount: 18,
    },
    {
      id: 'wh-stripe-ops',
      title: 'Cloud Billing & Provisioning Alert',
      botId: 'bot-clive',
      slug: 'hooks/wh_cloud_ops_3d7e1b',
      secretPreview: 'whsec_3d7e••••••••••••9b04',
      enabled: true,
      instructions: 'Route high-priority customer workspace provisioning events to Clive for team triage.',
      lastTriggeredAt: 'Yesterday 6:40 PM',
      deliveriesCount: 7,
    },
  ],
  appTriggers: [
    {
      id: 'at-gmail-urgent',
      title: 'Urgent Customer Mail Watcher',
      botId: 'bot-emaily',
      service: 'gmail',
      accountAlias: 'work',
      eventName: 'GMAIL_NEW_EMAIL_RECEIVED',
      filterQuery: 'label:inbox subject:(urgent OR incident OR release)',
      enabled: true,
      eventsToday: 14,
      dailyLimit: 2000,
    },
    {
      id: 'at-slack-mentions',
      title: 'Slack #engineering-escalations Trigger',
      botId: 'bot-clive',
      service: 'slack',
      accountAlias: 'work-hq',
      eventName: 'SLACK_CHANNEL_MESSAGE',
      filterQuery: 'channel:#engineering-escalations',
      enabled: true,
      eventsToday: 6,
      dailyLimit: 2000,
    },
  ],
  composioServices: [
    {
      slug: 'gmail',
      name: 'Gmail',
      category: 'Email & Calendar',
      description: 'Read, draft, label, and send emails with multi-account isolation.',
      iconColor: '#ea4335',
      tools: ['GMAIL_FETCH_EMAILS', 'GMAIL_SEND_EMAIL', 'GMAIL_CREATE_DRAFT', 'GMAIL_ADD_LABEL'],
      accounts: [
        { id: 'ca_901_work', alias: 'work', status: 'ACTIVE', connectedAt: '2026-10-12' },
        { id: 'ca_902_personal', alias: 'personal', status: 'ACTIVE', connectedAt: '2026-10-14' },
      ],
    },
    {
      slug: 'github',
      name: 'GitHub',
      category: 'Developer Tools',
      description: 'Issues, pull requests, release assets, workflow runs, and code search.',
      iconColor: '#f4f4f5',
      tools: ['GITHUB_LIST_PULL_REQUESTS', 'GITHUB_CREATE_ISSUE', 'GITHUB_GET_RELEASE', 'GITHUB_DISPATCH_WORKFLOW'],
      accounts: [
        { id: 'ca_903_gh', alias: 'maintainers', status: 'ACTIVE', connectedAt: '2026-10-10' },
      ],
    },
    {
      slug: 'slack',
      name: 'Slack',
      category: 'Messaging',
      description: 'Post channel updates, read threads, and respond to team incidents.',
      iconColor: '#e01e5a',
      tools: ['SLACK_SEND_MESSAGE', 'SLACK_LIST_CHANNELS', 'SLACK_READ_THREAD'],
      accounts: [
        { id: 'ca_904_slack', alias: 'work-hq', status: 'ACTIVE', connectedAt: '2026-10-11' },
      ],
    },
    {
      slug: 'google_calendar',
      name: 'Google Calendar',
      category: 'Email & Calendar',
      description: 'Inspect availability, schedule team reviews, and manage recurring events.',
      iconColor: '#3b82f6',
      tools: ['GCAL_LIST_EVENTS', 'GCAL_CREATE_EVENT', 'GCAL_FIND_FREE_SLOTS'],
      accounts: [
        { id: 'ca_905_gcal', alias: 'work', status: 'ACTIVE', connectedAt: '2026-10-12' },
      ],
    },
    {
      slug: 'google_sheets',
      name: 'Google Sheets',
      category: 'Data & Docs',
      description: 'Read and update structured spreadsheets, financial ledgers, and metrics.',
      iconColor: '#10b981',
      tools: ['GSHEETS_READ_RANGE', 'GSHEETS_APPEND_ROWS', 'GSHEETS_CREATE_SHEET'],
      accounts: [
        { id: 'ca_906_sheets', alias: 'analytics', status: 'ACTIVE', connectedAt: '2026-10-15' },
      ],
    },
    {
      slug: 'notion',
      name: 'Notion',
      category: 'Data & Docs',
      description: 'Centralize wiki pages, engineering specs, and release checklists.',
      iconColor: '#a1a1aa',
      tools: ['NOTION_SEARCH_PAGES', 'NOTION_APPEND_BLOCKS', 'NOTION_QUERY_DATABASE'],
      accounts: [],
    },
    {
      slug: 'linear',
      name: 'Linear',
      category: 'Developer Tools',
      description: 'Triage engineering issues, cycle velocity, and incident escalations.',
      iconColor: '#6366f1',
      tools: ['LINEAR_LIST_ISSUES', 'LINEAR_CREATE_ISSUE', 'LINEAR_UPDATE_STATE'],
      accounts: [
        { id: 'ca_907_linear', alias: 'eng-team', status: 'ACTIVE', connectedAt: '2026-10-16' },
      ],
    },
    {
      slug: 'sentry',
      name: 'Sentry',
      category: 'Developer Tools',
      description: 'Monitor stack traces, release regressions, and crash-free sessions.',
      iconColor: '#ec4899',
      tools: ['SENTRY_LIST_ISSUES', 'SENTRY_GET_EVENT_TRACE'],
      accounts: [],
    },
    {
      slug: 'supabase',
      name: 'Supabase',
      category: 'Infrastructure',
      description: 'Inspect project tables, edge functions, and database health.',
      iconColor: '#10b981',
      tools: ['SUPABASE_LIST_PROJECTS', 'SUPABASE_RUN_QUERY'],
      accounts: [],
    },
    {
      slug: 'perplexity',
      name: 'Perplexity AI',
      category: 'Research',
      description: 'Grounded web research and citation verification for research bots.',
      iconColor: '#06b6d4',
      tools: ['PERPLEXITY_SEARCH_WEB'],
      accounts: [],
    },
  ],
  assignments: [
    {
      id: 'asg-root-101',
      rootId: 'asg-root-101',
      parentId: null,
      depth: 0,
      origin: 'person',
      requester: 'person:owner',
      chief: true,
      assigneeBotId: 'bot-clive',
      assigneeThreadId: 'thread-clive-main',
      mode: 'work',
      reply: 'resume',
      status: 'completed',
      outcome: 'completed',
      level: 'full',
      levelSource: 'own',
      executions: 1,
      restarts: 0,
      brief: 'Audit Silicon Valley AI dataset and prepare v0.34.0 release checklist',
      result: 'Coordinated @Brody (977 clean rows) and @GitScout (v0.34.0 release preflight queued).',
      evidence: {
        okToolCalls: 2,
        outwardActions: [],
        errors: [],
      },
      updatedAt: 'Today 4:10 PM',
    },
    {
      id: 'asg-child-102',
      rootId: 'asg-root-101',
      parentId: 'asg-root-101',
      depth: 1,
      origin: 'person',
      requester: 'bot:bot-clive',
      chief: true,
      assigneeBotId: 'bot-brody',
      assigneeThreadId: 'thread-brody-main',
      mode: 'work',
      reply: 'resume',
      status: 'completed',
      outcome: 'completed',
      level: 'full',
      levelSource: 'inherited_chief',
      executions: 1,
      restarts: 0,
      brief: 'Normalize Wikidata Silicon Valley AI & VC companies and document coordinate precision.',
      result: 'Produced 977 verified rows in companies_2026.csv after removing city-ID collisions.',
      evidence: {
        okToolCalls: 3,
        outwardActions: [],
        errors: [],
      },
      updatedAt: 'Today 3:06 PM',
    },
    {
      id: 'asg-child-103',
      rootId: 'asg-root-101',
      parentId: 'asg-root-101',
      depth: 1,
      origin: 'person',
      requester: 'bot:bot-clive',
      chief: false,
      assigneeBotId: 'bot-gitscout',
      assigneeThreadId: 'thread-gitscout-main',
      mode: 'work',
      reply: 'resume',
      status: 'needs_input',
      outcome: 'Waiting on Bash approval card',
      level: 'ask',
      levelSource: 'own',
      executions: 1,
      restarts: 0,
      brief: 'Verify v0.34.0 Windows NSIS build and run control:omb doctor.',
      evidence: {
        okToolCalls: 1,
        outwardActions: [],
        errors: [],
      },
      updatedAt: 'Today 4:15 PM',
    },
  ],
  presets: [
    {
      id: 'preset-org-chief',
      source: 'org',
      key: 'engineering-chief',
      name: 'Chief of Staff (Engineering)',
      description: 'Coordinates multi-agent engineering rooms, delegates subtasks, and enforces verification receipts.',
      packageName: 'Engineering Command',
      release: '2.4.0',
      publisherName: 'OpenMausBot Core',
      bot: {
        name: 'Atlas',
        title: 'Engineering Chief of Staff',
        description: 'Delegates architecture, testing, and release tasks across specialist bots.',
        color: '#3b82f6',
        expression: 0,
        instructions: 'Decompose complex engineering requests with coordinate_bots, track assignment_status, and verify all outputs against docs/verification/README.md.',
      },
      skills: [
        {
          name: 'chief-team-coordinator',
          description: 'Multi-agent delegation and assignment tree verification.',
          content: 'Use coordinate_bots with explicit done_when criteria.',
        },
        {
          name: 'verify-omb',
          description: 'Isolated fake-engine verification via control:omb.',
          content: 'Always run node --experimental-strip-types scripts/control-omb.ts launch in an isolated fixture.',
        },
      ],
      playbooks: ['Incident Triage Playbook', 'Release Cut Verification Playbook'],
      notes: '# Starter Notes\n- Keep delegated tasks narrow and non-overlapping on filesystem paths.',
    },
    {
      id: 'preset-org-sales',
      source: 'org',
      key: 'ops-desk',
      name: 'Executive Operations & Inbox Desk',
      description: 'Multi-account Gmail, Calendar, and Slack triage specialist with weekday briefing routines.',
      packageName: 'Sales & Ops Desk',
      release: '1.3.0',
      publisherName: 'Acme Partners',
      bot: {
        name: 'Pepper',
        title: 'Operations & Communications Specialist',
        description: 'Manages labeled Composio accounts and prepares daily decision briefs.',
        color: '#f59e0b',
        expression: 3,
        instructions: 'Never mix work and personal Composio account aliases. Summarize action items with clear owners and dates.',
      },
      skills: [
        {
          name: 'composio-multi-account',
          description: 'Explicit account routing across Gmail, Calendar, and Slack.',
          content: 'Always verify the connected account alias before invoking outward send tools.',
        },
      ],
      playbooks: ['Morning Inbox Zero', 'Weekly Stakeholder Digest'],
      notes: '# Starter Notes\n- Check Google Calendar timezone before proposing meeting slots.',
    },
    {
      id: 'preset-file-researcher',
      source: 'file',
      key: 'deep-researcher',
      name: 'Dataset & Literature Analyst',
      description: 'Imported preset for DuckDB SQL analysis, CSV cleaning, and grounded web research.',
      packageName: 'research-pack.omb.json',
      release: '1.1.0',
      bot: {
        name: 'Sage',
        title: 'Research & Data Analyst',
        description: 'Queries structured tables, audits provenance, and writes cited briefs.',
        color: '#8b5cf6',
        expression: 6,
        instructions: 'Document every data source, timestamp, and filtering rule. Use tabular numerals and explicit units.',
      },
      skills: [
        {
          name: 'duckdb-data-verifier',
          description: 'High-speed analytical queries on CSV/Parquet files.',
          content: 'Validate row counts and schema types before exporting.',
        },
      ],
      playbooks: ['Dataset Provenance Audit'],
      notes: '# Starter Notes\n- Imported from file: skills start switched off until reviewed.',
    },
  ],
  workflows: [
    {
      id: 'wf-ci',
      filename: '.github/workflows/ci.yml',
      name: 'CI (Typecheck, Oxlint & Unit Suite)',
      trigger: 'push / pull_request on main',
      summary: 'Runs pnpm typecheck, oxlint, Vitest unit/runtime contract suites (I1–I10), and electron node-tests.',
      steps: [
        'Checkout repository & setup Node 24 + pnpm',
        'Run oxlint across root, server, electron, companion, and apps/docs',
        'Run TypeScript typecheck (tsc --noEmit)',
        'Execute server/runtime/*.test.ts (Job Runtime Contract Invariants I1–I10)',
        'Executeserver/drivers/agents-bridge*.test.ts (Pinned byte budget check)',
        'Run electron/*.node-test.mjs suite',
      ],
      lastStatus: 'passing',
      lastRunAt: '12 mins ago',
    },
    {
      id: 'wf-release',
      filename: '.github/workflows/release.yml',
      name: 'Release (Unified Multi-Platform Publisher)',
      trigger: 'workflow_dispatch / tag v*',
      summary: 'Builds macOS DMG, Windows NSIS setup.exe + latest.yml, and Linux packages from one pinned commit and mirrors to legacy updater repo.',
      steps: [
        'Verify tag version matches package.json version',
        'Build harness server (dist-server) and renderer UI (dist)',
        'Package Windows NSIS installer + latest.yml + sha512 blockmap',
        'Verify win-unpacked/resources/{server/index.js, ui/index.html, app-update.yml}',
        'Publish byte-identical assets to milind-soni/OpenMausBot and legacy mirror',
      ],
      lastStatus: 'passing',
      lastRunAt: '2 hours ago',
    },
    {
      id: 'wf-package-win',
      filename: '.github/workflows/package-win.yml',
      name: 'Package Windows (NSIS + Smoke Check)',
      trigger: 'pull_request / workflow_dispatch',
      summary: 'Runs pnpm package:win on windows-latest and verifies unpacked resources and .cmd-shim provider detection.',
      steps: [
        'Setup Node 24 and corepack pnpm on windows-latest',
        'Run pnpm build && electron-builder --win --x64 --publish never',
        'Assert Test-Path release/win-unpacked/resources/server/index.js',
        'Assert Test-Path release/win-unpacked/resources/ui/index.html',
        'Assert app-update.yml omits publisherName while unsigned',
      ],
      lastStatus: 'passing',
      lastRunAt: '1 hour ago',
    },
    {
      id: 'wf-package-linux',
      filename: '.github/workflows/package-linux.yml',
      name: 'Package Linux (AppImage / DEB + CUA Gate)',
      trigger: 'pull_request / workflow_dispatch',
      summary: 'Builds Ubuntu/Linux desktop packages and verifies CUA Linux runtime isolation and input-safety hold.',
      steps: [
        'Install Linux desktop build dependencies',
        'Compile server and renderer bundles',
        'Run electron/cua-linux-bundle.test.mjs & cua-linux-runtime.test.mjs',
        'Build Linux AppImage and .deb artifacts',
      ],
      lastStatus: 'passing',
      lastRunAt: '1 hour ago',
    },
    {
      id: 'wf-docker',
      filename: '.github/workflows/docker.yml',
      name: 'Docker & Self-Hosted VPS Image',
      trigger: 'push on main / release',
      summary: 'Builds the self-hosted OpenMausBot container image with Caddy proxy, Xvfb/XFCE managed desktop, and fake-engine smoke test.',
      steps: [
        'Build multi-stage Dockerfile with Node 24 and managed desktop layer',
        'Start container with isolated DATA_DIR and Caddyfile',
        'Verify /api/health, webhook receiver on :8800, and noVNC WebSocket proxy',
      ],
      lastStatus: 'passing',
      lastRunAt: '3 hours ago',
    },
    {
      id: 'wf-docs',
      filename: '.github/workflows/docs.yml',
      name: 'Docs (Fumadocs + Screenshot Sync)',
      trigger: 'push affecting apps/docs/** or docs/screenshots/**',
      summary: 'Syncs product screenshots into apps/docs/public/screenshots and builds the Next.js Fumadocs site.',
      steps: [
        'Run node apps/docs/scripts/sync-assets.mjs',
        'Run next typegen && tsc --noEmit in apps/docs',
        'Run oxlint in apps/docs',
        'Build standalone Next.js production bundle',
      ],
      lastStatus: 'passing',
      lastRunAt: 'Just now',
    },
    {
      id: 'wf-terminal-smoke',
      filename: '.github/workflows/shared-terminal-smoke.yml',
      name: 'Shared Terminal & Headless Control Smoke',
      trigger: 'pull_request',
      summary: 'Launches an isolated fake-engine instance via scripts/control-omb.ts and drives headless UI & MCP tool turns.',
      steps: [
        'Start node --experimental-strip-types scripts/control-omb.ts launch',
        'Run pnpm control:omb doctor --url http://127.0.0.1:PORT',
        'Execute chat-turns, full-access, and tool-selection verification recipes',
        'Clean up child process and temporary data directory',
      ],
      lastStatus: 'passing',
      lastRunAt: '45 mins ago',
    },
  ],
  verificationRecipes: [
    {
      id: 'vr-chat-turns',
      file: 'docs/verification/chat-turns.md',
      title: 'Chat turns & bounded transcripts',
      category: 'Core Harness',
      command: 'pnpm control:omb send --bot Bramble --message "Summarize workspace status" --wait',
      proves: 'Proves end-to-end turn admission, streaming event normalization, and durable SQLite transcript persistence.',
      status: 'verified',
    },
    {
      id: 'vr-full-access',
      file: 'docs/verification/full-access.md',
      title: 'Full Access without duplicate approvals',
      category: 'Approvals & Safety',
      command: 'pnpm exec electron scripts/smoke-approval-modes.cjs --mode full',
      proves: 'Proves immediate profile, routine, team, skill, and peer actions in Full access with one-line Undo receipts while explicit Ask sibling threads still prompt.',
      status: 'verified',
    },
    {
      id: 'vr-safety-floor',
      file: 'docs/verification/safety-floor.md',
      title: 'The safety floor: a never-list no grant can allow',
      category: 'Approvals & Safety',
      command: 'pnpm control:omb verify safety-floor --isolated',
      proves: 'Proves destructive host-wiping or credential-exfiltration patterns are blocked even under Full Access or remembered session grants.',
      status: 'verified',
    },
    {
      id: 'vr-routines',
      file: 'docs/verification/routines.md',
      title: 'Routines, Croner schedules & central run logs',
      category: 'Core Harness',
      command: 'pnpm control:omb verify routines --tz Asia/Kolkata',
      proves: 'Proves confirmed proposals, manual/scheduled runs, Remember last run, Run on startup, and automatic 15s stall retry.',
      status: 'verified',
    },
    {
      id: 'vr-memory-layer',
      file: 'docs/verification/memory-layer.md',
      title: 'Memory: recall, upkeep and the nightly tidy-up',
      category: 'Memory & Data',
      command: 'pnpm control:omb verify memory-layer --isolated',
      proves: 'Proves 200-line / 24 KB MEMORY.md budget, automatic topic filing, credential redaction («redacted N chars»), and journal Undo.',
      status: 'verified',
    },
    {
      id: 'vr-room-coord',
      file: 'docs/verification/room-coordination.md',
      title: 'In-chat team coordination & Chief level flow',
      category: 'Teams & Library',
      command: 'pnpm control:omb verify room-coordination --chief Clive',
      proves: 'Proves coordinate_bots tree creation, Chief approval level inheritance, assignment_status polling, and single wake on child settlement.',
      status: 'verified',
    },
    {
      id: 'vr-tool-selection',
      file: 'docs/verification/tool-selection.md',
      title: 'Per-bot tool selection & agents tool bridge',
      category: 'Engines & Providers',
      command: 'pnpm control:omb verify tool-selection --bridge',
      proves: 'Proves native:* and mcp:* allowlist/excludelist filtering and agentsToolBridge find_tool/use_tool 68% schema reduction.',
      status: 'verified',
    },
    {
      id: 'vr-local-vm',
      file: 'docs/verification/local-vm-resume.md',
      title: 'Local VM & Cloud computer preview recovery',
      category: 'Computers & VMs',
      command: 'pnpm control:omb verify local-vm-resume --isolated',
      proves: 'Proves idle stop, restart recovery, guarded resume, and noVNC WebSocket desktop takeover in the Computer panel.',
      status: 'verified',
    },
    {
      id: 'vr-org-library',
      file: 'docs/verification/org-library.md',
      title: 'Organization library & withdrawn releases',
      category: 'Teams & Library',
      command: 'pnpm control:omb verify org-library --sha256-check',
      proves: 'Proves SHA-256 verified package installs from Organization catalog, stamped skills, and automatic skill disablement on withdrawn releases.',
      status: 'verified',
    },
  ],
};
