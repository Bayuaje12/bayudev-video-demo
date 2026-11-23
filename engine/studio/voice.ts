import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { access, mkdir, readFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join } from 'node:path';

import { VOICE_ENABLED, demo } from './config.ts';

export type Mark = { at: number; text: string };

const TTS_ENGINE = (process.env.DEMO_TTS_ENGINE ?? 'kokoro').toLowerCase();
const EDGE_VOICE = process.env.DEMO_TTS_VOICE ?? demo.voice?.name ?? 'id-ID-ArdiNeural';
const EDGE_RATE = process.env.DEMO_TTS_RATE ?? '+0%';
const EDGE_PITCH = process.env.DEMO_TTS_PITCH ?? '+0Hz';

// Kokoro settings (kept for compatibility)
const VOICE_HOME =
  process.env.DEMO_VOICE_HOME ?? join(homedir(), '.cache/demo-voice');
const PYTHON = join(VOICE_HOME, '.venv/bin/python');
const MODEL = join(VOICE_HOME, 'kokoro.onnx');
const VOICES = join(VOICE_HOME, 'voices.bin');
const LINES = join(VOICE_HOME, 'lines');

const VOICE = process.env.DEMO_VOICE_NAME ?? demo.voice?.name ?? 'af_heart';
const LANG = process.env.DEMO_VOICE_LANG ?? 'en-us';
const SPEED = Number(process.env.DEMO_VOICE_SPEED ?? demo.voice?.speed ?? 1);
const SENTENCE_PAUSE = Number(process.env.DEMO_VOICE_SENTENCE_PAUSE ?? 0.14);
const CLAUSE_PAUSE = Number(process.env.DEMO_VOICE_CLAUSE_PAUSE ?? 0.06);
const TARGET_RMS = Number(process.env.DEMO_VOICE_RMS ?? 0.12);

function exists(path: string): Promise<boolean> {
  return access(path).then(() => true, () => false);
}

function run(cmd: string, args: string[], input?: string): Promise<{ code: number; stderr: string }> {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { stdio: ['pipe', 'pipe', 'pipe'] });
    let stderr = '';
    child.stderr.on('data', (chunk: Buffer) => { stderr += chunk.toString(); });
    child.on('error', reject);
    child.on('close', (code) => resolve({ code: code ?? 1, stderr }));
    if (input != null) child.stdin.end(input);
    else child.stdin.end();
  });
}

async function edgeTtsReady(): Promise<boolean> {
  if (!VOICE_ENABLED) return false;
  const r = await run('edge-tts', ['--version']).catch(() => null);
  return !!r && r.code === 0;
}

export async function voiceReady(): Promise<boolean> {
  if (!VOICE_ENABLED) return false;
  if (TTS_ENGINE === 'edge-tts') return edgeTtsReady();
  const found = await Promise.all([exists(PYTHON), exists(MODEL), exists(VOICES)]);
  return found.every(Boolean);
}

export function voiceMissingMessage(): string {
  if (TTS_ENGINE === 'edge-tts') {
    return (
      `  no voice-over: edge-tts is not available.\n` +
      `  install with: python3 -m pip install edge-tts\n` +
      `  or film silent with DEMO_VOICE=0.\n`
    );
  }
  return (
    `  no voice-over: ${VOICE_HOME} has no Kokoro model.\n` +
    `  install it with scripts/install-voice.sh or film silent with DEMO_VOICE=0.\n`
  );
}

const BUILT_IN_SAID_AS: [RegExp, string][] = [[/\blive\b/gi, 'liv']];
const SAID_AS: [RegExp, string][] = [...BUILT_IN_SAID_AS, ...(demo.voice?.saidAs ?? [])];

function speakable(text: string): string {
  return SAID_AS.reduce((said, [word, as_]) => said.replace(word, as_), text);
}

function keyFor(text: string, model: string): string {
  return createHash('sha1')
    .update(`${TTS_ENGINE}|${model}|${VOICE}|${EDGE_VOICE}|${LANG}|${SPEED}|${EDGE_RATE}|${EDGE_PITCH}|${text}`)
    .digest('hex')
    .slice(0, 16);
}

const SYNTH = `
import json, sys, os
import numpy as np
import soundfile as sf
try:
    import espeakng_loader
    from phonemizer.backend.espeak.wrapper import EspeakWrapper
    EspeakWrapper.set_library(espeakng_loader.get_library_path())
    EspeakWrapper.set_data_path(espeakng_loader.get_data_path())
except Exception:
    pass
from kokoro_onnx import Kokoro
job = json.load(sys.stdin)
kokoro = Kokoro(job["model"], job["voices"])
for line in job["lines"]:
    if os.path.exists(line["path"]):
        continue
    samples, rate = kokoro.create(
        line["text"], voice=job["voice"], speed=job["speed"], lang=job["lang"],
        sentence_pause=job["sentencePause"], clause_pause=job["clausePause"],
    )
    rms = float(np.sqrt(np.mean(samples ** 2)))
    if rms > 0:
        samples = samples * np.clip(job["targetRms"] / rms, 0.55, 1.6)
    sf.write(line["path"], samples, rate)
print(json.dumps({"ok": True}))
`;

function runPython(job: unknown): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(PYTHON, ['-c', SYNTH], { stdio: ['pipe', 'pipe', 'pipe'] });
    let stderr = '';
    child.stderr.on('data', (chunk: Buffer) => { stderr += chunk.toString(); });
    child.on('error', reject);
    child.on('close', (code) => code === 0 ? resolve() : reject(new Error(`kokoro exited ${code}\n${stderr.slice(-800)}`)));
    child.stdin.end(JSON.stringify(job));
  });
}

async function synthEdge(text: string, outPath: string): Promise<void> {
  const mp3 = outPath.replace(/\.wav$/, '.mp3');
  const args = ['--voice', EDGE_VOICE, '--rate', EDGE_RATE, '--pitch', EDGE_PITCH, '--text', text, '--write-media', mp3];
  const r = await run('edge-tts', args);
  if (r.code !== 0) throw new Error(`edge-tts failed (${r.code}): ${r.stderr.slice(-500)}`);
  // convert to wav for wavSeconds/mix pipeline
  const conv = await run('ffmpeg', ['-y', '-hide_banner', '-loglevel', 'error', '-i', mp3, '-ar', '48000', '-ac', '1', outPath]);
  if (conv.code !== 0) throw new Error(`ffmpeg convert failed (${conv.code}): ${conv.stderr.slice(-500)}`);
  await run('rm', ['-f', mp3]).catch(() => {});
}

export type SpokenLine = Mark & { path: string; seconds: number };

export async function speak(marks: Mark[]): Promise<SpokenLine[]> {
  if (marks.length === 0) return [];

  await mkdir(LINES, { recursive: true });
  const { stat } = await import('node:fs/promises');

  const modelId = TTS_ENGINE === 'edge-tts' ? `edge:${EDGE_VOICE}` : String((await stat(MODEL)).size);
  const lines = marks.map((mark) => {
    const said = speakable(mark.text);
    return { ...mark, said, path: join(LINES, `${keyFor(said, modelId)}.wav`) };
  });

  const wanted = lines.filter((line, at) => lines.findIndex((other) => other.path === line.path) === at);
  const absent = await Promise.all(wanted.map(async (line) => ((await exists(line.path)) ? null : line)));
  const todo = absent.filter((line): line is (typeof wanted)[number] => line !== null);

  if (todo.length > 0) {
    if (TTS_ENGINE === 'edge-tts') {
      for (const line of todo) {
        await synthEdge(line.said, line.path);
      }
    } else {
      await runPython({
        model: MODEL,
        voices: VOICES,
        voice: VOICE,
        lang: LANG,
        speed: SPEED,
        sentencePause: SENTENCE_PAUSE,
        clausePause: CLAUSE_PAUSE,
        targetRms: TARGET_RMS,
        lines: todo.map((line) => ({ text: line.said, path: line.path })),
      });
    }
  }

  return Promise.all(lines.map(async (line) => ({ ...line, seconds: await wavSeconds(line.path) })));
}

async function wavSeconds(path: string): Promise<number> {
  const buffer = await readFile(path);
  const rate = buffer.readUInt32LE(24);
  const bytesPerSecond = buffer.readUInt32LE(28);
  for (let at = 12; at + 8 <= buffer.length;) {
    const id = buffer.toString('ascii', at, at + 4);
    const size = buffer.readUInt32LE(at + 4);
    if (id === 'data') return bytesPerSecond > 0 ? size / bytesPerSecond : size / (rate * 2);
    at += 8 + size + (size % 2);
  }
  return 0;
}

export function mixArgs(
  silent: string,
  lines: SpokenLine[],
  out: string,
  videoSeconds: number,
  videoArgs: string[]
): { args: string[]; overrun: number } {
  const overrun = Math.max(0, ...lines.map((line) => line.at + line.seconds - videoSeconds));
  const inputs = lines.flatMap((line) => ['-i', line.path]);
  const delays = lines
    .map((line, at) => `[${at + 1}:a]adelay=${Math.max(0, Math.round(line.at * 1000))}:all=1[d${at}]`)
    .join(';');
  const heads = lines.map((_, at) => `[d${at}]`).join('');
  const mix =
    lines.length === 1
      ? `${heads}anull[spoken]`
      : `${heads}amix=inputs=${lines.length}:normalize=0:dropout_transition=0[spoken]`;

  const padding = overrun > 0;
  const video = padding
    ? [
        '-filter_complex',
        `${delays};${mix};[0:v]tpad=stop_mode=clone:stop_duration=${overrun.toFixed(3)}[v]`,
        '-map', '[v]', ...videoArgs,
      ]
    : ['-filter_complex', `${delays};${mix}`, '-map', '0:v', '-c:v', 'copy'];

  return {
    overrun,
    args: [
      '-y', '-hide_banner', '-loglevel', 'error',
      '-i', silent, ...inputs, ...video,
      '-map', '[spoken]',
      '-c:a', 'aac', '-b:a', '160k', '-ar', '48000',
      '-movflags', '+faststart',
      out,
    ],
  };
}

export function spokenFor(text: string, minimum = 0): number {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  // Indonesian with edge-tts is roughly similar pace; keep conservative
  const wps = TTS_ENGINE === 'edge-tts' ? 3.2 * SPEED : 3.7 * SPEED;
  const seconds = words / wps + 0.45;
  return Math.max(minimum, Math.round(seconds * 1000));
}
