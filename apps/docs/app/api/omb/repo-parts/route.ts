import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { NextResponse } from 'next/server';

const WORKSPACE_ROOT = path.resolve(process.cwd(), '../..');
const ARCHIVE_DIR = '/tmp/mamas-agent-portions';

export interface PortionSpec {
  id: string;
  number: number;
  title: string;
  subtitle: string;
  archiveName: string;
  estFiles: number;
  estSize: string;
  paths: string[];
  tarExcludes?: string[];
}

export const PORTIONS: PortionSpec[] = [
  {
    id: 'portion1',
    number: 1,
    title: 'Portion 1: Core Supervisory App',
    subtitle: 'apps/docs, .claude, skills, package.json & root metadata',
    archiveName: 'portion1-core.tar.gz',
    estFiles: 111,
    estSize: '600 KB (176 KB .tar.gz)',
    paths: [
      'apps/docs',
      '.claude',
      'skills',
      'package.json',
      'metadata.json',
      'README.md',
      'AGENTS.md',
      '.gitignore',
      '.env.example',
      'LICENSE',
      'NOTICE',
    ],
    tarExcludes: ['node_modules', '.next', '.source'],
  },
  {
    id: 'portion2',
    number: 2,
    title: 'Portion 2: Shared Contracts & Scripts',
    subtitle: 'shared/ wire schemas & scripts/ automation utilities',
    archiveName: 'portion2-shared-scripts.tar.gz',
    estFiles: 128,
    estSize: '850 KB (249 KB .tar.gz)',
    paths: ['shared', 'scripts'],
  },
  {
    id: 'portion3',
    number: 3,
    title: 'Portion 3: Frontend Studio UI (src/)',
    subtitle: 'src/ components, public/, Vite & TypeScript build configs',
    archiveName: 'portion3-frontend-src.tar.gz',
    estFiles: 138,
    estSize: '1.75 MB (444 KB .tar.gz)',
    paths: [
      'src',
      'public',
      'index.html',
      'vite.config.ts',
      'tsconfig.json',
      'tsconfig.companion.build.json',
      'tsconfig.server.json',
      'tsconfig.server.build.json',
      'onboarding-preview.html',
      'mascot-preview.html',
      'cloud-buy-preview.html',
    ],
  },
  {
    id: 'portion4',
    number: 4,
    title: 'Portion 4: Server Drivers, Routes & Browser',
    subtitle: 'server/drivers, server/routes & server/browser modules',
    archiveName: 'portion4-server-drivers-routes.tar.gz',
    estFiles: 94,
    estSize: '1.08 MB (281 KB .tar.gz)',
    paths: ['server/drivers', 'server/routes', 'server/browser'],
  },
  {
    id: 'portion5',
    number: 5,
    title: 'Portion 5: Server Runtime, Decider & Sentinel',
    subtitle: 'server/ core, runtime, decider, host, sentinel, data, tts & Docker',
    archiveName: 'portion5-server-runtime-core.tar.gz',
    estFiles: 111,
    estSize: '930 KB (270 KB .tar.gz)',
    paths: [
      'server',
      'Dockerfile',
      '.dockerignore',
      'compose.yaml',
      'maus.ps1',
    ],
    tarExcludes: ['server/drivers', 'server/routes', 'server/browser'],
  },
  {
    id: 'portion6',
    number: 6,
    title: 'Portion 6: Electron Desktop Shell',
    subtitle: 'electron/ main, preload, tray & electron-builder.yml',
    archiveName: 'portion6-electron-desktop.tar.gz',
    estFiles: 111,
    estSize: '1.10 MB (289 KB .tar.gz)',
    paths: ['electron', 'electron-builder.yml'],
  },
  {
    id: 'portion7',
    number: 7,
    title: 'Portion 7: Architecture Docs, CI & Evals',
    subtitle: 'docs/*.md, .github/workflows, evals/, enterprise/ & governance',
    archiveName: 'portion7-docs-ci-evals.tar.gz',
    estFiles: 93,
    estSize: '780 KB (357 KB .tar.gz)',
    paths: [
      'docs',
      '.github',
      'evals',
      'enterprise',
      'CONTRIBUTING.md',
      'CODE_OF_CONDUCT.md',
      'SECURITY.md',
      'CLA.md',
      'LICENSING.md',
      '.oxlintrc.json',
      '.gitattributes',
      'pnpm-workspace.yaml',
    ],
    tarExcludes: ['docs/verification'],
  },
];

const EXTRA_HEAVY_PATHS = [
  'docs/verification',
  'bun.lock',
  'cloudflare',
  'companion',
  'deploy',
];

function purgeNextCache() {
  const buildCache = path.join(WORKSPACE_ROOT, 'apps/docs/.next/cache');
  if (fs.existsSync(buildCache)) {
    fs.rmSync(buildCache, { recursive: true, force: true });
  }
  try {
    execSync(`find apps/docs/.next -name "*.map" -delete 2>/dev/null || true`, {
      cwd: WORKSPACE_ROOT,
    });
  } catch {
    // ignore
  }
}

function ensureArchives() {
  if (!fs.existsSync(ARCHIVE_DIR)) {
    fs.mkdirSync(ARCHIVE_DIR, { recursive: true });
  }

  for (const p of PORTIONS) {
    const archivePath = path.join(ARCHIVE_DIR, p.archiveName);
    if (fs.existsSync(archivePath)) {
      continue;
    }
    const existingPaths = p.paths.filter((rel) =>
      fs.existsSync(path.join(WORKSPACE_ROOT, rel))
    );
    if (existingPaths.length > 0) {
      const excludeFlags = (p.tarExcludes || [])
        .map((ex) => `--exclude='${ex}'`)
        .join(' ');
      try {
        execSync(
          `tar ${excludeFlags} -czf ${archivePath} ${existingPaths.join(' ')}`,
          { cwd: WORKSPACE_ROOT }
        );
      } catch {
        // ignore partial archive error
      }
    }
  }
}

function removeNonCorePortions() {
  for (const p of PORTIONS.slice(1)) {
    for (const rel of p.paths) {
      const full = path.join(WORKSPACE_ROOT, rel);
      if (fs.existsSync(full)) {
        fs.rmSync(full, { recursive: true, force: true });
      }
    }
  }
  for (const rel of EXTRA_HEAVY_PATHS) {
    const full = path.join(WORKSPACE_ROOT, rel);
    if (fs.existsSync(full)) {
      fs.rmSync(full, { recursive: true, force: true });
    }
  }
}

function getWorkspaceFileCount(): number {
  try {
    const out = execSync(
      `find . -not -path '*/node_modules*' -not -path '*/.next*' -not -path '*/.source*' -type f | wc -l`,
      { cwd: WORKSPACE_ROOT, encoding: 'utf8' }
    );
    return Number.parseInt(out.trim(), 10) || 0;
  } catch {
    return 0;
  }
}

function getStatus() {
  ensureArchives();
  const activePortions = PORTIONS.map((p) => {
    const archivePath = path.join(ARCHIVE_DIR, p.archiveName);
    const archiveExists = fs.existsSync(archivePath);
    const archiveBytes = archiveExists ? fs.statSync(archivePath).size : 0;
    const isPresentInWorkspace = p.paths.some((rel) =>
      fs.existsSync(path.join(WORKSPACE_ROOT, rel))
    );
    return {
      id: p.id,
      number: p.number,
      title: p.title,
      subtitle: p.subtitle,
      estFiles: p.estFiles,
      estSize: p.estSize,
      archiveReady: archiveExists,
      archiveSizeKb: archiveExists ? Math.round(archiveBytes / 1024) : 0,
      activeInWorkspace: isPresentInWorkspace,
    };
  });

  return {
    totalWorkspaceFiles: getWorkspaceFileCount(),
    portions: activePortions,
  };
}

export async function GET(request: Request) {
  ensureArchives();
  const { searchParams } = new URL(request.url);
  const download = searchParams.get('download');

  if (download) {
    const portion =
      PORTIONS.find((p) => p.id === download) ||
      (download === 'part1' ? PORTIONS[0] : undefined) ||
      (download === 'part2-code' ? PORTIONS[1] : undefined);

    if (portion) {
      const archivePath = path.join(ARCHIVE_DIR, portion.archiveName);
      if (portion.id === 'portion1') {
        const existingPaths = portion.paths.filter((rel) =>
          fs.existsSync(path.join(WORKSPACE_ROOT, rel))
        );
        const excludeFlags = (portion.tarExcludes || [])
          .map((ex) => `--exclude='${ex}'`)
          .join(' ');
        try {
          execSync(
            `tar ${excludeFlags} -czf ${archivePath} ${existingPaths.join(' ')}`,
            { cwd: WORKSPACE_ROOT }
          );
        } catch {
          // ignore
        }
      }
      if (fs.existsSync(archivePath)) {
        const buf = fs.readFileSync(archivePath);
        return new NextResponse(buf, {
          headers: {
            'Content-Type': 'application/gzip',
            'Content-Disposition': `attachment; filename="mamas-agent-${portion.archiveName}"`,
          },
        });
      }
    }
  }

  return NextResponse.json(getStatus());
}

export async function POST(request: Request) {
  try {
    ensureArchives();
    const body = (await request.json()) as {
      action:
        | 'slim_to_part1'
        | 'activate_portion'
        | 'add_portion'
        | 'restore_all_portions';
      portionId?: string;
    };

    if (
      body.action === 'slim_to_part1' ||
      (body.action === 'activate_portion' && body.portionId === 'portion1')
    ) {
      removeNonCorePortions();
      purgeNextCache();
      const status = getStatus();
      return NextResponse.json({
        ok: true,
        message: `Workspace slimmed to Portion 1 Only (${status.totalWorkspaceFiles} files, ~600 KB). Click AI Studio's GitHub Push now!`,
        status,
      });
    }

    if (body.action === 'activate_portion' && body.portionId) {
      const target = PORTIONS.find((p) => p.id === body.portionId);
      if (!target) {
        return NextResponse.json({ error: 'Unknown portion' }, { status: 400 });
      }
      removeNonCorePortions();
      const archivePath = path.join(ARCHIVE_DIR, target.archiveName);
      if (fs.existsSync(archivePath)) {
        execSync(`tar -xzf ${archivePath}`, { cwd: WORKSPACE_ROOT });
      }
      purgeNextCache();
      const status = getStatus();
      return NextResponse.json({
        ok: true,
        message: `Isolated ${target.title} in workspace (${status.totalWorkspaceFiles} total files, Next.js cache purged). Ready to Push to GitHub!`,
        status,
      });
    }

    if (body.action === 'add_portion' && body.portionId) {
      const target = PORTIONS.find((p) => p.id === body.portionId);
      if (!target) {
        return NextResponse.json({ error: 'Unknown portion' }, { status: 400 });
      }
      const archivePath = path.join(ARCHIVE_DIR, target.archiveName);
      if (fs.existsSync(archivePath)) {
        execSync(`tar -xzf ${archivePath}`, { cwd: WORKSPACE_ROOT });
      }
      purgeNextCache();
      const status = getStatus();
      return NextResponse.json({
        ok: true,
        message: `Added ${target.title} (+${target.estFiles} files -> ${status.totalWorkspaceFiles} total files in workspace). Ready to Push to GitHub!`,
        status,
      });
    }

    if (body.action === 'restore_all_portions') {
      for (const p of PORTIONS.slice(1)) {
        const archivePath = path.join(ARCHIVE_DIR, p.archiveName);
        if (fs.existsSync(archivePath)) {
          execSync(`tar -xzf ${archivePath}`, { cwd: WORKSPACE_ROOT });
        }
      }
      purgeNextCache();
      const status = getStatus();
      return NextResponse.json({
        ok: true,
        message: `Restored all 7 portions (${status.totalWorkspaceFiles} files).`,
        status,
      });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
