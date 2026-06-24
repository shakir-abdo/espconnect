import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { createFatFSFromImage, FAT_MOUNT, FatFSError } from '../wasm/fatfs/index.js';

const FIXTURE_PATH = path.resolve(process.cwd(), 'src/tests/fixtures/fs-images/fat/fat.bin');
const DEFAULT_WASM_PATH = path.resolve(process.cwd(), 'wasm/fatfs/fatfs.wasm');
const FALLBACK_WASM_PATH = path.resolve(process.cwd(), 'src/wasm/fatfs/fatfs.wasm');

const fixtureImage = new Uint8Array(readFileSync(FIXTURE_PATH));
const wasmURL = pathToFileURL(existsSync(DEFAULT_WASM_PATH) ? DEFAULT_WASM_PATH : FALLBACK_WASM_PATH);

const textDecoder = new TextDecoder();
const textEncoder = new TextEncoder();

const KNOWN_FILE = `${FAT_MOUNT}/info.txt`;
const RENAMED_FILE = `${FAT_MOUNT}/info-renamed.txt`;
const NESTED_FILE = `${FAT_MOUNT}/fat_dir/nested_info.txt`;

const createFixtureFatFS = async () => createFatFSFromImage(new Uint8Array(fixtureImage), { wasmURL });

let originalFetch: typeof fetch;
let consoleInfoSpy: ReturnType<typeof vi.spyOn>;

beforeAll(() => {
  consoleInfoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});
  originalFetch = globalThis.fetch;
  globalThis.fetch = async (input, init) => {
    const url = input instanceof URL ? input : typeof input === 'string' ? new URL(input) : new URL(input.url);

    if (url.protocol === 'file:') {
      const bytes = readFileSync(fileURLToPath(url));
      return new Response(bytes, {
        status: 200,
        headers: {
          'Content-Type': 'application/wasm',
        },
      });
    }

    return originalFetch(input, init);
  };
});

afterAll(() => {
  globalThis.fetch = originalFetch;
  consoleInfoSpy.mockRestore();
});

describe('fatfs fixture image', () => {
  it('mounts and lists known entries', async () => {
    const fat = await createFixtureFatFS();
    const entries = fat.list('/');

    expect(entries.length).toBeGreaterThan(0);

    const infoEntry = entries.find((entry) => entry.path === KNOWN_FILE);
    expect(infoEntry).toBeDefined();
    expect(infoEntry?.type).toBe('file');
    expect(infoEntry?.size).toBe(22);

    const nestedEntry = entries.find((entry) => entry.path === NESTED_FILE);
    expect(nestedEntry).toBeDefined();
    expect(nestedEntry?.type).toBe('file');
    expect(nestedEntry?.size).toBe(20);
  });

  it('reads known file bytes', async () => {
    const fat = await createFixtureFatFS();
    const bytes = fat.readFile(KNOWN_FILE);

    expect(textDecoder.decode(bytes)).toBe('ESPConnect_FATFS_test\n');
  });

  it('round-trips mutations through toImage and remount', async () => {
    const fat = await createFixtureFatFS();

    fat.mkdir('/newdir');
    fat.writeFile('/newdir/a.txt', textEncoder.encode('abc'));
    fat.rename(KNOWN_FILE, RENAMED_FILE);
    fat.writeFile('/todelete.bin', new Uint8Array([1, 2, 3]));
    fat.deleteFile('/todelete.bin');

    const img2 = fat.toImage();
    const fat2 = await createFatFSFromImage(img2, { wasmURL });

    expect(textDecoder.decode(fat2.readFile('/newdir/a.txt'))).toBe('abc');
    expect(textDecoder.decode(fat2.readFile(RENAMED_FILE))).toBe('ESPConnect_FATFS_test\n');
    expect(() => fat2.readFile(KNOWN_FILE)).toThrow();
    expect(() => fat2.readFile('/todelete.bin')).toThrow();
  });

  it('deletes all files and directories without formatting', async () => {
    const fat = await createFixtureFatFS();
    const entries = fat.list('/');

    expect(entries.length).toBeGreaterThan(0);

    const byDepth = [...entries].sort((a, b) => {
      const aDepth = a.path.split('/').filter(Boolean).length;
      const bDepth = b.path.split('/').filter(Boolean).length;
      if (aDepth !== bDepth) {
        return bDepth - aDepth;
      }
      return b.path.localeCompare(a.path);
    });

    for (const entry of byDepth) {
      fat.deleteFile(entry.path);
    }

    expect(fat.list('/')).toEqual([]);
    expect(() => fat.readFile(KNOWN_FILE)).toThrow();
  });

  it('formats and remounts cleanly', async () => {
    const fat = await createFixtureFatFS();

    fat.format();
    expect(() => fat.readFile(KNOWN_FILE)).toThrow();

    const img3 = fat.toImage();
    const fat2 = await createFatFSFromImage(img3, { wasmURL });
    const entries = fat2.list('/');

    expect(Array.isArray(entries)).toBe(true);
    expect(() => fat2.readFile(KNOWN_FILE)).toThrow();
  });

  it('reports usage invariants', async () => {
    const fat = await createFixtureFatFS();
    const usage = fat.getUsage();

    expect(usage && typeof usage === 'object').toBe(true);
    expect(Array.isArray(usage)).toBe(false);

    const numericValues = Object.values(usage).filter((value): value is number => typeof value === 'number');
    expect(numericValues.length).toBeGreaterThan(0);
    for (const value of numericValues) {
      expect(value).toBeGreaterThanOrEqual(0);
    }

    if ('capacityBytes' in usage && 'usedBytes' in usage && 'freeBytes' in usage) {
      const capacityBytes = (usage as { capacityBytes: number }).capacityBytes;
      const usedBytes = (usage as { usedBytes: number }).usedBytes;
      const freeBytes = (usage as { freeBytes: number }).freeBytes;

      expect(usedBytes + freeBytes).toBeLessThanOrEqual(capacityBytes);
    }
  });

  it('throws a typed error for missing files when possible', async () => {
    const fat = await createFixtureFatFS();

    let caught: unknown;
    try {
      fat.readFile('/__missing__');
    } catch (error) {
      caught = error;
    }

    expect(caught).toBeTruthy();
    if (caught instanceof FatFSError) {
      expect(typeof caught.code).toBe('number');
    }
  });
});
