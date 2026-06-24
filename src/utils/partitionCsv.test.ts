import { Buffer } from 'buffer';
import { describe, expect, it } from 'vitest';

import type { FormattedPartitionRow } from '../types/partitions';
import {
  buildPartitionCsv,
  encodeCsvAsBase64,
  escapeCsvValue,
  formatByteHex,
  formatBytes,
  formatPartitionCsvLine,
  getPartitionSubtypeSlug,
  getPartitionTypeSlug,
  isReservedPartition,
  parsePartitionValue,
  PARTITION_CSV_HEADER,
} from './partitionCsv';

const baseRow: FormattedPartitionRow = {
  label: 'Test Partition',
  typeLabel: 'label',
  subtypeLabel: 'sub',
  typeHex: '0x00',
  subtypeHex: '0x00',
  offset: 0,
  offsetHex: '0x0',
  size: 4096,
  sizeText: '4 KB',
  color: '#fff',
  backgroundImage: null,
};

describe('partition CSV helpers', () => {
  it('formats lines safely and capitalizes the size hex', () => {
    const row: FormattedPartitionRow = {
      ...baseRow,
      label: 'Partition, "Fancy"',
      size: 256,
    };
    const line = formatPartitionCsvLine(row);
    expect(line).toContain('"Partition, ""Fancy"""');
    expect(line).toContain('0x100');
  });

  it('builds CSV output with header', () => {
    const csv = buildPartitionCsv([baseRow]);
    expect(csv.startsWith(PARTITION_CSV_HEADER)).toBe(true);
    expect(csv.split('\n')).toHaveLength(2);
  });

  it('derives canonical type and subtype slugs', () => {
    const appRow: FormattedPartitionRow = { ...baseRow, type: 0x0, subtype: 0x10 };
    expect(getPartitionTypeSlug(appRow)).toBe('app');
    expect(getPartitionSubtypeSlug(appRow)).toBe('ota_0');

    const dataRow: FormattedPartitionRow = { ...baseRow, type: 0x1, subtype: 0x82 };
    expect(getPartitionTypeSlug(dataRow)).toBe('data');
    expect(getPartitionSubtypeSlug(dataRow)).toBe('spiffs');

    const customRow: FormattedPartitionRow = { ...baseRow, typeHex: '0x0f', subtypeHex: '0xaa' };
    expect(getPartitionTypeSlug(customRow)).toBe('type0f');
    expect(getPartitionSubtypeSlug(customRow)).toBe('subtypeaa');
  });

  it('parses partition values using fallback text', () => {
    expect(parsePartitionValue(undefined, '0x1c')).toBe(0x1c);
    expect(parsePartitionValue(2)).toBe(2);
    expect(parsePartitionValue(undefined, 'zzz')).toBe(0);
  });

  it('formats bytes into human-friendly strings', () => {
    expect(formatBytes(512)).toBe('512 bytes');
    expect(formatBytes(2048)).toBe('2.00 KB');
    expect(formatBytes(-1)).toBe(null);
  });

  it('formats byte values as lowercase hex', () => {
    expect(formatByteHex(10)).toBe('0a');
    expect(formatByteHex(255)).toBe('ff');
  });

  it('escapes CSV values when needed', () => {
    expect(escapeCsvValue('simple')).toBe('simple');
    expect(escapeCsvValue('with,comma')).toBe('"with,comma"');
    expect(escapeCsvValue('quote"marks')).toBe('"quote""marks"');
  });

  it('falls back to Buffer-based base64 when btoa is missing', () => {
    const value = 'abc';
    const expected = Buffer.from(value, 'utf-8').toString('base64');
    expect(encodeCsvAsBase64(value)).toBe(expected);
  });

  it('uses global btoa when available', () => {
    const originalBtoa = globalThis.btoa;
    globalThis.btoa = (input: string) => `btoa:${input}`;
    try {
      expect(encodeCsvAsBase64('xyz')).toBe(`btoa:xyz`);
    } finally {
      globalThis.btoa = originalBtoa;
    }
  });

  it('recognizes reserved partitions', () => {
    expect(isReservedPartition({ ...baseRow, label: 'Bootloader' })).toBe(true);
    expect(isReservedPartition({ ...baseRow, label: 'Foobar' })).toBe(false);
  });
});
