import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { NextResponse } from 'next/server';

const WORKSPACE_ROOT = path.resolve(process.cwd(), '../..');
const PART1_ARCHIVE = '/tmp/mamas-agent-part1-core.tar.gz';
const PART2_CODE_ARCHIVE = '/tmp/mamas-agent-part2-code-only.tar.gz';
const PART2_FULL_ARCHIVE = '/tmp/mamas-agent-part2-full.tar.gz';

const PART2_DIRS = [
  'cloudflare',
  'companion',
  'electron',
  'deploy',
  'docs/screenshots',
  'docs/verification/assets',
  'docs/verification/evidence',
  'docs/verification/images',
  'docs/superpowers',
  'docs/plans',
  'apps/docs/public/screenshots',
];

function getStatus() {
  const part2PresentDirs = PART2_DIRS.filter((d) =>
    fs.existsSync(path.join(WORKSPACE_ROOT, d))
  );
  const part1Exists = fs.existsSync(PART1_ARCHIVE);
  const part2CodeExists = fs.existsSync(PART2_CODE_ARCHIVE);
  const part2FullExists = fs.existsSync(PART2_FULL_ARCHIVE);

  return {
    activeMode: part2PresentDirs.length > 0 ? 'part1_and_part2' : 'part1_only',
    part2PresentDirs,
    archives: {
      part1Core: part1Exists
        ? `${(fs.statSync(PART1_ARCHIVE).size / (1024 * 1024)).toFixed(2)} MB`
        : 'Ready to generate',
      part2CodeOnly: part2CodeExists
        ? `${(fs.statSync(PART2_CODE_ARCHIVE).size / (1024 * 1024)).toFixed(2)} MB`
        : 'Missing',
      part2FullMedia: part2FullExists
        ? `${(fs.statSync(PART2_FULL_ARCHIVE).size / (1024 * 1024)).toFixed(2)} MB`
        : 'Missing',
    },
  };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const download = searchParams.get('download');

  if (download === 'part1') {
    try {
      execSync(
        `tar --exclude='node_modules' --exclude='.next' --exclude='public/screenshots' -czf ${PART1_ARCHIVE} apps/docs .claude docs package.json metadata.json README.md AGENTS.md`,
        { cwd: WORKSPACE_ROOT }
      );
      const buf = fs.readFileSync(PART1_ARCHIVE);
      return new NextResponse(buf, {
        headers: {
          'Content-Type': 'application/gzip',
          'Content-Disposition': 'attachment; filename="mamas-agent-part1-core.tar.gz"',
        },
      });
    } catch (err) {
      return NextResponse.json({ error: String(err) }, { status: 500 });
    }
  }

  if (download === 'part2-code' && fs.existsSync(PART2_CODE_ARCHIVE)) {
    const buf = fs.readFileSync(PART2_CODE_ARCHIVE);
    return new NextResponse(buf, {
      headers: {
        'Content-Type': 'application/gzip',
        'Content-Disposition': 'attachment; filename="mamas-agent-part2-code-only.tar.gz"',
      },
    });
  }

  if (download === 'part2-full' && fs.existsSync(PART2_FULL_ARCHIVE)) {
    const buf = fs.readFileSync(PART2_FULL_ARCHIVE);
    return new NextResponse(buf, {
      headers: {
        'Content-Type': 'application/gzip',
        'Content-Disposition': 'attachment; filename="mamas-agent-part2-full.tar.gz"',
      },
    });
  }

  return NextResponse.json(getStatus());
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      action: 'slim_to_part1' | 'restore_part2_code';
    };

    if (body.action === 'slim_to_part1') {
      for (const rel of PART2_DIRS) {
        const fullPath = path.join(WORKSPACE_ROOT, rel);
        if (fs.existsSync(fullPath)) {
          fs.rmSync(fullPath, { recursive: true, force: true });
        }
      }
      return NextResponse.json({
        ok: true,
        message:
          'Workspace slimmed to Part 1 (~850 KB). You can now publish/push Part 1 to GitHub.',
        status: getStatus(),
      });
    }

    if (body.action === 'restore_part2_code') {
      if (!fs.existsSync(PART2_CODE_ARCHIVE)) {
        return NextResponse.json(
          { error: 'Part 2 archive not found in /tmp' },
          { status: 404 }
        );
      }
      execSync(`tar -xzf ${PART2_CODE_ARCHIVE}`, { cwd: WORKSPACE_ROOT });
      return NextResponse.json({
        ok: true,
        message:
          'Part 2 code (cloudflare, companion, electron, deploy, plans) restored into workspace (~1.1 MB, without heavy .gif/.mp4 media blobs). You can now push Part 2 to GitHub.',
        status: getStatus(),
      });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
