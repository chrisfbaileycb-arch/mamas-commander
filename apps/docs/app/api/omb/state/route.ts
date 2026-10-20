import { NextResponse } from 'next/server';
import { loadWorkspaceState, resetWorkspaceState, saveWorkspaceState, redactSecrets } from '@/lib/omb-store';
import type { WorkspaceState } from '@/lib/omb-data';

export async function GET() {
  const state = loadWorkspaceState();
  return NextResponse.json(state);
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { action?: string; state?: WorkspaceState };
    if (body.action === 'reset') {
      const fresh = resetWorkspaceState();
      return NextResponse.json(fresh);
    }
    if (body.state) {
      const sanitizedBots = body.state.bots.map((bot) => ({
        ...bot,
        memoryMd: redactSecrets(bot.memoryMd),
        instructions: redactSecrets(bot.instructions),
      }));
      const updated = saveWorkspaceState({
        ...body.state,
        bots: sanitizedBots,
      });
      return NextResponse.json(updated);
    }
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to update workspace state';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
