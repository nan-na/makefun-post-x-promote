// post-x-promote-make-your-own-bounty-01 entry (Node 22, standard library only).
//
// The entry is the X post itself. POST.json at the repository root names the
// post's address, and this program copies that file, byte for byte, to the
// output directory, where the gate reads it. Nothing else is written, nothing
// is printed on success, and no network, clock, or file outside the repository
// is touched.
//
// Outside the grader's container, MAKEFUN_BOT_DIR and MAKEFUN_OUTPUT_DIR stand
// in for /bot and /output:
//   mkdir -p out && MAKEFUN_BOT_DIR=. MAKEFUN_OUTPUT_DIR=out node main.ts

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const BOT_DIR = process.env.MAKEFUN_BOT_DIR ?? '/bot';
const OUTPUT_DIR = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

function fail(message: string): never {
  console.error(`main.ts: ${message}`);
  process.exit(1);
}

function readPostFile(): Buffer {
  const source = join(BOT_DIR, 'POST.json');
  if (!existsSync(source)) {
    fail(`POST.json not found at ${source}`);
  }
  try {
    return readFileSync(source);
  } catch (err) {
    fail(`POST.json could not be read from ${source}: ${(err as Error).message}`);
  }
}

function checkPostFile(bytes: Buffer): void {
  let parsed: unknown;
  try {
    parsed = JSON.parse(bytes.toString('utf8'));
  } catch {
    fail('POST.json is not valid JSON');
  }
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    fail('POST.json must hold one JSON object');
  }
  const url = (parsed as Record<string, unknown>).url;
  if (typeof url !== 'string' || url.length === 0) {
    fail('POST.json must hold a "url" string naming the post');
  }
  if (!/^https?:\/\//.test(url) || !/(x\.com|twitter\.com)/.test(url) || !url.includes('/status/')) {
    fail('POST.json "url" must be an x.com or twitter.com status address');
  }
}

const bytes = readPostFile();
checkPostFile(bytes);

const target = join(OUTPUT_DIR, 'POST.json');
try {
  mkdirSync(OUTPUT_DIR, { recursive: true });
  writeFileSync(target, bytes);
} catch (err) {
  fail(`POST.json could not be written to ${target}: ${(err as Error).message}`);
}

let written: Buffer;
try {
  written = readFileSync(target);
} catch (err) {
  fail(`POST.json written to ${target} could not be read back: ${(err as Error).message}`);
}
if (!written.equals(bytes)) {
  fail(`POST.json written to ${target} does not match the source byte for byte`);
}
