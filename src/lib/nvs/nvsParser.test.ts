import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

import { detectNvsVersion, parseNvsPartition } from './nvsParser';

const PAGE_SIZE = 0x1000;
const ENTRY_SIZE = 32;
const ENTRY_DATA_OFFSET = 64;

const PAGE_STATE_ACTIVE = 0xfffffffe;

const TYPE = {
  U8: 0x01,
  U32: 0x04,
  SZ: 0x21,
  BLOB_DATA: 0x42,
  BLOB_IDX: 0x48,
} as const;

const CRC32_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i += 1) {
    let c = i;
    for (let k = 0; k < 8; k += 1) {
      c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[i] = c >>> 0;
  }
  return table;
})();

let consoleDebugSpy: ReturnType<typeof vi.spyOn>;

beforeAll(() => {
  consoleDebugSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});
});

afterAll(() => {
  consoleDebugSpy.mockRestore();
});

function crc32Update(crc: number, data: Uint8Array, start = 0, length = data.length - start) {
  let c = crc >>> 0;
  const end = Math.min(data.length, start + length);
  for (let i = start; i < end; i += 1) {
    c = CRC32_TABLE[(c ^ data[i]) & 0xff] ^ (c >>> 8);
  }
  return c >>> 0;
}

function nvsCrc32(data: Uint8Array, start = 0, length = data.length - start) {
  const running = crc32Update(0x00000000, data, start, length);
  return (running ^ 0xffffffff) >>> 0;
}

function writeU32Le(buf: Uint8Array, offset: number, value: number) {
  buf[offset] = value & 0xff;
  buf[offset + 1] = (value >>> 8) & 0xff;
  buf[offset + 2] = (value >>> 16) & 0xff;
  buf[offset + 3] = (value >>> 24) & 0xff;
}

function writeU16Le(buf: Uint8Array, offset: number, value: number) {
  buf[offset] = value & 0xff;
  buf[offset + 1] = (value >>> 8) & 0xff;
}

function computeItemCrc32(item: Uint8Array) {
  let crc = 0x00000000;
  crc = crc32Update(crc, item, 0, 4);
  crc = crc32Update(crc, item, 8, 16);
  crc = crc32Update(crc, item, 24, 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function setEntryState(entryTableWords: Uint32Array, entryIndex: number, stateBits: number) {
  const wordIndex = Math.floor(entryIndex / 16);
  const bitOffset = (entryIndex % 16) * 2;
  const mask = 0x3 << bitOffset;
  entryTableWords[wordIndex] = (entryTableWords[wordIndex] & ~mask) | ((stateBits & 0x3) << bitOffset);
}

function writeHeader(page: Uint8Array, { seq, versionByte }: { seq: number; versionByte: number }) {
  writeU32Le(page, 0, PAGE_STATE_ACTIVE);
  writeU32Le(page, 4, seq);
  page[8] = versionByte;
  // bytes [9..27] are already 0xFF (reserved)
  const crc = nvsCrc32(page, 4, 24);
  writeU32Le(page, 28, crc);
}

function writeItemV1U8(page: Uint8Array, entryIndex: number, { nsIndex, key, value }: { nsIndex: number; key: string; value: number }) {
  const off = ENTRY_DATA_OFFSET + entryIndex * ENTRY_SIZE;
  const item = page.subarray(off, off + ENTRY_SIZE);
  item.fill(0xff);
  item[0] = nsIndex;
  item[1] = TYPE.U8;
  item[2] = 1; // span
  item[3] = 0xff; // reserved
  // crc32 at [4..7] after fill
  const keyBytes = new TextEncoder().encode(key);
  item.set(keyBytes.subarray(0, 15), 8);
  item[8 + Math.min(keyBytes.length, 15)] = 0x00;
  item[24] = value & 0xff;
  writeU32Le(item, 4, computeItemCrc32(item));
}

function writeItemV1U32(page: Uint8Array, entryIndex: number, { nsIndex, key, value }: { nsIndex: number; key: string; value: number }) {
  const off = ENTRY_DATA_OFFSET + entryIndex * ENTRY_SIZE;
  const item = page.subarray(off, off + ENTRY_SIZE);
  item.fill(0xff);
  item[0] = nsIndex;
  item[1] = TYPE.U32;
  item[2] = 1; // span
  item[3] = 0xff; // reserved
  const keyBytes = new TextEncoder().encode(key);
  item.set(keyBytes.subarray(0, 15), 8);
  item[8 + Math.min(keyBytes.length, 15)] = 0x00;
  writeU32Le(item, 24, value >>> 0);
  writeU32Le(item, 4, computeItemCrc32(item));
}

function writeItemV1String(page: Uint8Array, entryIndex: number, { nsIndex, key, text }: { nsIndex: number; key: string; text: string }) {
  const payload = new TextEncoder().encode(text + '\0');
  const span = 1 + Math.ceil(payload.length / ENTRY_SIZE);
  const headerOff = ENTRY_DATA_OFFSET + entryIndex * ENTRY_SIZE;
  const header = page.subarray(headerOff, headerOff + ENTRY_SIZE);
  header.fill(0xff);
  header[0] = nsIndex;
  header[1] = TYPE.SZ;
  header[2] = span;
  header[3] = 0xff;
  const keyBytes = new TextEncoder().encode(key);
  header.set(keyBytes.subarray(0, 15), 8);
  header[8 + Math.min(keyBytes.length, 15)] = 0x00;
  writeU16Le(header, 24, payload.length);
  writeU16Le(header, 26, 0xffff);
  writeU32Le(header, 28, nvsCrc32(payload));
  writeU32Le(header, 4, computeItemCrc32(header));

  for (let i = 0; i < span - 1; i += 1) {
    const off = ENTRY_DATA_OFFSET + (entryIndex + 1 + i) * ENTRY_SIZE;
    const chunk = page.subarray(off, off + ENTRY_SIZE);
    chunk.fill(0xff);
    chunk.set(payload.subarray(i * ENTRY_SIZE, Math.min(payload.length, (i + 1) * ENTRY_SIZE)));
  }
}

function writeItemV2U8(page: Uint8Array, entryIndex: number, { nsIndex, key, value }: { nsIndex: number; key: string; value: number }) {
  const off = ENTRY_DATA_OFFSET + entryIndex * ENTRY_SIZE;
  const item = page.subarray(off, off + ENTRY_SIZE);
  item.fill(0xff);
  item[0] = nsIndex;
  item[1] = TYPE.U8;
  item[2] = 1;
  item[3] = 0xff; // chunkIndex
  const keyBytes = new TextEncoder().encode(key);
  item.set(keyBytes.subarray(0, 15), 8);
  item[8 + Math.min(keyBytes.length, 15)] = 0x00;
  item[24] = value & 0xff;
  writeU32Le(item, 4, computeItemCrc32(item));
}

function writeItemV2String(page: Uint8Array, entryIndex: number, { nsIndex, key, text }: { nsIndex: number; key: string; text: string }) {
  const payload = new TextEncoder().encode(text + '\0');
  const span = 1 + Math.ceil(payload.length / ENTRY_SIZE);
  const headerOff = ENTRY_DATA_OFFSET + entryIndex * ENTRY_SIZE;
  const header = page.subarray(headerOff, headerOff + ENTRY_SIZE);
  header.fill(0xff);
  header[0] = nsIndex;
  header[1] = TYPE.SZ;
  header[2] = span;
  header[3] = 0xff; // chunkIndex
  const keyBytes = new TextEncoder().encode(key);
  header.set(keyBytes.subarray(0, 15), 8);
  header[8 + Math.min(keyBytes.length, 15)] = 0x00;
  writeU16Le(header, 24, payload.length);
  writeU16Le(header, 26, 0xffff);
  writeU32Le(header, 28, nvsCrc32(payload));
  writeU32Le(header, 4, computeItemCrc32(header));

  for (let i = 0; i < span - 1; i += 1) {
    const off = ENTRY_DATA_OFFSET + (entryIndex + 1 + i) * ENTRY_SIZE;
    const chunk = page.subarray(off, off + ENTRY_SIZE);
    chunk.fill(0xff);
    chunk.set(payload.subarray(i * ENTRY_SIZE, Math.min(payload.length, (i + 1) * ENTRY_SIZE)));
  }
}

function writeItemV2BlobChunk(
  page: Uint8Array,
  entryIndex: number,
  { nsIndex, key, chunkIndex, data }: { nsIndex: number; key: string; chunkIndex: number; data: Uint8Array },
) {
  const span = 1 + Math.ceil(data.length / ENTRY_SIZE);
  const headerOff = ENTRY_DATA_OFFSET + entryIndex * ENTRY_SIZE;
  const header = page.subarray(headerOff, headerOff + ENTRY_SIZE);
  header.fill(0xff);
  header[0] = nsIndex;
  header[1] = TYPE.BLOB_DATA;
  header[2] = span;
  header[3] = chunkIndex & 0xff;
  const keyBytes = new TextEncoder().encode(key);
  header.set(keyBytes.subarray(0, 15), 8);
  header[8 + Math.min(keyBytes.length, 15)] = 0x00;
  writeU16Le(header, 24, data.length);
  writeU16Le(header, 26, 0xffff);
  writeU32Le(header, 28, nvsCrc32(data));
  writeU32Le(header, 4, computeItemCrc32(header));

  for (let i = 0; i < span - 1; i += 1) {
    const off = ENTRY_DATA_OFFSET + (entryIndex + 1 + i) * ENTRY_SIZE;
    const chunk = page.subarray(off, off + ENTRY_SIZE);
    chunk.fill(0xff);
    chunk.set(data.subarray(i * ENTRY_SIZE, Math.min(data.length, (i + 1) * ENTRY_SIZE)));
  }
}

function writeItemV2BlobIndex(
  page: Uint8Array,
  entryIndex: number,
  { nsIndex, key, dataSize, chunkCount, chunkStart }: { nsIndex: number; key: string; dataSize: number; chunkCount: number; chunkStart: number },
) {
  const off = ENTRY_DATA_OFFSET + entryIndex * ENTRY_SIZE;
  const item = page.subarray(off, off + ENTRY_SIZE);
  item.fill(0xff);
  item[0] = nsIndex;
  item[1] = TYPE.BLOB_IDX;
  item[2] = 1;
  item[3] = 0xff; // chunkIndex (unused)
  const keyBytes = new TextEncoder().encode(key);
  item.set(keyBytes.subarray(0, 15), 8);
  item[8 + Math.min(keyBytes.length, 15)] = 0x00;
  writeU32Le(item, 24, dataSize >>> 0);
  item[28] = chunkCount & 0xff;
  item[29] = chunkStart & 0xff;
  writeU16Le(item, 30, 0xffff);
  writeU32Le(item, 4, computeItemCrc32(item));
}

function buildPartitionV1() {
  const page = new Uint8Array(PAGE_SIZE);
  page.fill(0xff);
  writeHeader(page, { seq: 1, versionByte: 0xff });

  const entryWords = new Uint32Array(8);
  entryWords.fill(0xffffffff);
  // 0: namespace entry, 1: u32, 2: string header, 3: string data
  setEntryState(entryWords, 0, 0x2);
  setEntryState(entryWords, 1, 0x2);
  setEntryState(entryWords, 2, 0x2);
  setEntryState(entryWords, 3, 0x2);
  page.set(new Uint8Array(entryWords.buffer), 32);

  writeItemV1U8(page, 0, { nsIndex: 0, key: 'app', value: 1 });
  writeItemV1U32(page, 1, { nsIndex: 1, key: 'count', value: 42 });
  writeItemV1String(page, 2, { nsIndex: 1, key: 'greeting', text: 'hello' });

  return page;
}

function buildPartitionV2() {
  const page = new Uint8Array(PAGE_SIZE);
  page.fill(0xff);
  writeHeader(page, { seq: 1, versionByte: 0xfe });

  const entryWords = new Uint32Array(8);
  entryWords.fill(0xffffffff);
  // 0: namespace, 1: string header, 2: string data, 3: blob chunk header, 4: blob chunk data, 5: blob idx
  for (const idx of [0, 1, 2, 3, 4, 5]) setEntryState(entryWords, idx, 0x2);
  page.set(new Uint8Array(entryWords.buffer), 32);

  writeItemV2U8(page, 0, { nsIndex: 0, key: 'app', value: 1 });
  writeItemV2String(page, 1, { nsIndex: 1, key: 'name', text: 'device' });

  const blobData = new Uint8Array([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
  writeItemV2BlobChunk(page, 3, { nsIndex: 1, key: 'blob', chunkIndex: 0, data: blobData });
  writeItemV2BlobIndex(page, 5, { nsIndex: 1, key: 'blob', dataSize: blobData.length, chunkCount: 1, chunkStart: 0 });

  return page;
}

describe('nvsParser', () => {
  it('detects and parses NVS v1 (0xFF format version)', () => {
    const image = buildPartitionV1();

    const detected = detectNvsVersion(image);
    expect(detected.version).toBe(1);

    const parsed = parseNvsPartition(image);
    expect(parsed.version).toBe(1);
    expect(parsed.namespaces).toEqual([{ id: 1, name: 'app' }]);

    const count = parsed.entries.find(entry => entry.key === 'count');
    expect(count).toBeTruthy();
    expect(count?.namespace).toBe('app');
    expect(count?.type).toBe('u32');
    expect(count?.value).toBe(42);
    expect(count?.crcOk).toBe(true);

    const greeting = parsed.entries.find(entry => entry.key === 'greeting');
    expect(greeting).toBeTruthy();
    expect(greeting?.type).toBe('string');
    expect(greeting?.value).toBe('hello');
    expect(greeting?.crcOk).toBe(true);
  });

  it('detects and parses NVS v2 (0xFE format version) including BLOB_IDX + BLOB_DATA', () => {
    const image = buildPartitionV2();

    const detected = detectNvsVersion(image);
    expect(detected.version).toBe(2);

    const parsed = parseNvsPartition(image);
    expect(parsed.version).toBe(2);
    expect(parsed.namespaces).toEqual([{ id: 1, name: 'app' }]);

    const name = parsed.entries.find(entry => entry.key === 'name');
    expect(name?.namespace).toBe('app');
    expect(name?.type).toBe('string');
    expect(name?.value).toBe('device');
    expect(name?.crcOk).toBe(true);

    const blob = parsed.entries.find(entry => entry.key === 'blob');
    expect(blob?.namespace).toBe('app');
    expect(blob?.type).toBe('blob');
    expect(blob?.length).toBe(10);
    expect(blob?.crcOk).toBe(true);
    expect(blob?.value).toBeInstanceOf(Uint8Array);
    expect(Array.from(blob?.value as Uint8Array)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
  });

  it('keeps parsing when payload CRC is invalid', () => {
    const image = buildPartitionV1();
    // Flip a payload byte inside greeting data (entry 3 payload)
    const payloadOff = ENTRY_DATA_OFFSET + 3 * ENTRY_SIZE;
    image[payloadOff] ^= 0xff;

    const parsed = parseNvsPartition(image);
    const greeting = parsed.entries.find(entry => entry.key === 'greeting');
    expect(greeting).toBeTruthy();
    expect(greeting?.type).toBe('string');
    expect(greeting?.crcOk).toBe(false);
    expect(greeting?.warnings?.join('\n') ?? '').toMatch(/CRC/i);
  });
});

