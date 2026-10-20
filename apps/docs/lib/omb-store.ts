import fs from 'node:fs';
import path from 'node:path';
import { INITIAL_WORKSPACE_STATE, type WorkspaceState } from './omb-data';

const STATE_FILE_PATH = path.join('/tmp', 'openmausbot-cloud-workspace.json');

export const MEMORY_MAX_LINES = 200;
export const MEMORY_MAX_BYTES = 24576;

export function redactSecrets(input: string): string {
  return input
    .replace(/\b(sk-[a-zA-Z0-9_-]{12,}|ak_[a-zA-Z0-9_-]{8,}|ghp_[a-zA-Z0-9]{12,}|AIza[0-9A-Za-z-_]{16,})\b/g, (match) => `«redacted ${match.length} chars»`)
    .replace(/(password|secret|api_key|token)\s*:\s*([^\s\n]+)/gi, (_full, key, val) => `${key}: «redacted ${String(val).length} chars»`);
}

export function loadWorkspaceState(): WorkspaceState {
  try {
    if (fs.existsSync(STATE_FILE_PATH)) {
      const raw = fs.readFileSync(STATE_FILE_PATH, 'utf8');
      const parsed = JSON.parse(raw) as WorkspaceState;
      if (parsed && Array.isArray(parsed.bots) && Array.isArray(parsed.threads)) {
        const existingEngineIds = new Set((parsed.engines ?? []).map((e) => e.id));
        const missingEngines = INITIAL_WORKSPACE_STATE.engines.filter(
          (e) => !existingEngineIds.has(e.id)
        );
        if (missingEngines.length > 0) {
          parsed.engines = [...missingEngines, ...(parsed.engines ?? [])];
        }
        if (!parsed.localhostConfig) {
          parsed.localhostConfig = structuredClone(INITIAL_WORKSPACE_STATE.localhostConfig);
        }
        return parsed;
      }
    }
  } catch {
    return structuredClone(INITIAL_WORKSPACE_STATE);
  }
  return structuredClone(INITIAL_WORKSPACE_STATE);
}

export function saveWorkspaceState(state: WorkspaceState): WorkspaceState {
  try {
    const tmpPath = `${STATE_FILE_PATH}.tmp`;
    fs.writeFileSync(tmpPath, JSON.stringify(state, null, 2), { encoding: 'utf8', mode: 0o600 });
    fs.renameSync(tmpPath, STATE_FILE_PATH);
  } catch {
    return state;
  }
  return state;
}

export function resetWorkspaceState(): WorkspaceState {
  const fresh = structuredClone(INITIAL_WORKSPACE_STATE);
  return saveWorkspaceState(fresh);
}
