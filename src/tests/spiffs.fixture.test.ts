import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { createSpiffsFromImage, SpiffsError } from '../wasm/spiffs/index.js';

const FIXTURE_PATH = path.resolve(process.cwd(), 'src/tests/fixtures/fs-images/spiffs/spiffs.bin');
const DEFAULT_WASM_PATH = path.resolve(process.cwd(), 'wasm/spiffs/spiffs.wasm');
const FALLBACK_WASM_PATH = path.resolve(process.cwd(), 'src/wasm/spiffs/spiffs.wasm');

const fixtureImage = new Uint8Array(readFileSync(FIXTURE_PATH));
const wasmURL = pathToFileURL(existsSync(DEFAULT_WASM_PATH) ? DEFAULT_WASM_PATH : FALLBACK_WASM_PATH);

const textDecoder = new TextDecoder();
const textEncoder = new TextEncoder();

const KNOWN_FILE = '/info.txt';
const NEW_FILE = '/new.txt';
const REMOVED_FILE = '/todelete.bin';

const createFixtureSpiffs = async () => createSpiffsFromImage(new Uint8Array(fixtureImage), { wasmURL });

let originalFetch: typeof fetch;
let originalConsoleInfo: typeof console.info;

beforeAll(() => {
  originalConsoleInfo = console.info;
  console.info = vi.fn();

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
  console.info = originalConsoleInfo;
  globalThis.fetch = originalFetch;
});

describe('spiffs fixture image', () => {
  it('mounts and lists known entries', async () => {
    const spiffs = await createFixtureSpiffs();
    const entries = await spiffs.list();

    expect(entries.length).toBeGreaterThan(0);

    const infoEntry = entries.find((entry) => entry.name === KNOWN_FILE);
    expect(infoEntry).toBeDefined();
    expect(infoEntry?.type).toBe('file');
    expect(infoEntry?.size).toBe(23);
  });

  it('reads known file bytes', async () => {
    const spiffs = await createFixtureSpiffs();
    const bytes = await spiffs.read(KNOWN_FILE);

    expect(textDecoder.decode(bytes)).toBe('ESPConnect_SPIFFS_test\n');
  });

  it('round-trips mutations through toImage and remount', async () => {
    const spiffs = await createFixtureSpiffs();

    await spiffs.write(NEW_FILE, textEncoder.encode('abc'));
    await spiffs.write(REMOVED_FILE, new Uint8Array([1, 2, 3]));
    await spiffs.remove(REMOVED_FILE);

    const img2 = await spiffs.toImage();
    const spiffs2 = await createSpiffsFromImage(img2, { wasmURL });

    expect(textDecoder.decode(await spiffs2.read(NEW_FILE))).toBe('abc');
    expect(textDecoder.decode(await spiffs2.read(KNOWN_FILE))).toBe('ESPConnect_SPIFFS_test\n');
    await expect(spiffs2.read(REMOVED_FILE)).rejects.toThrow();
  });

  it('formats and remounts cleanly', async () => {
    const spiffs = await createFixtureSpiffs();

    await spiffs.format();
    expect(await spiffs.list()).toEqual([]);
    await expect(spiffs.read(KNOWN_FILE)).rejects.toThrow();

    const img3 = await spiffs.toImage();
    const spiffs2 = await createSpiffsFromImage(img3, { wasmURL });
    const entries = await spiffs2.list();

    expect(Array.isArray(entries)).toBe(true);
    expect(entries.length).toBe(0);
    await expect(spiffs2.read(KNOWN_FILE)).rejects.toThrow();
  });

  it('reports usage invariants', async () => {
    const spiffs = await createFixtureSpiffs();
    const usage = await spiffs.getUsage();

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
    const spiffs = await createFixtureSpiffs();

    let caught: unknown;
    try {
      await spiffs.read('/__missing__');
    } catch (error) {
      caught = error;
    }

    expect(caught).toBeTruthy();
    if (caught instanceof SpiffsError) {
      expect(typeof caught.code).toBe('number');
    }
  });
});
