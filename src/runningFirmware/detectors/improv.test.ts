import { describe, expect, it } from 'vitest';

import { RingBuffer } from '../ringBuffer';
import type { DetectorContext, SerialIO } from '../types';
import { improvSerialDetector } from './improv';

const HEADER = [0x49, 0x4d, 0x50, 0x52, 0x4f, 0x56]; // "IMPROV"

function checksum8(bytes: number[]): number {
  return bytes.reduce((sum, b) => (sum + b) & 0xff, 0);
}

function buildPacket(type: number, data: number[], withLf = true): Uint8Array {
  const base = [...HEADER, 0x01, type & 0xff, data.length & 0xff, ...data];
  const packet = [...base, checksum8(base)];
  if (withLf) packet.push(0x0a);
  return new Uint8Array(packet);
}

describe('improvSerialDetector', () => {
  it('detects a valid Improv Current State packet (passive)', () => {
    const buffer = new RingBuffer();
    buffer.push(buildPacket(0x01, [0x02], true)); // Ready (Authorized)

    const ctx: DetectorContext = {
      io: { write: async () => {} },
      buffer,
      now: () => Date.now(),
    };

    const hit = improvSerialDetector.passive?.(ctx);
    expect(hit).not.toBeNull();
    expect(hit?.confidence).toBe('high');
    expect(hit?.details?.packet).toBe('Current State');
    expect(hit?.details?.state).toBe('0x02');
  });

  it('falls back to low confidence for banner-like "IMPROV" text (passive)', () => {
    const buffer = new RingBuffer();
    buffer.push(new TextEncoder().encode('Hello IMPROV via Serial!\r\n'));

    const ctx: DetectorContext = {
      io: { write: async () => {} },
      buffer,
      now: () => Date.now(),
    };

    const hit = improvSerialDetector.passive?.(ctx);
    expect(hit).not.toBeNull();
    expect(hit?.confidence).toBe('low');
  });

  it('probes with Request Current State and detects a valid response (active)', async () => {
    const buffer = new RingBuffer();

    const io: SerialIO = {
      write: async (data: Uint8Array) => {
        // Expect an RPC Command (0x03) "Request current state" (command 0x02, data length 0)
        expect([...data.slice(0, 6)]).toEqual(HEADER);
        expect(data[6]).toBe(0x01);
        expect(data[7]).toBe(0x03);
        expect(data[8]).toBe(2);
        expect([...data.slice(9, 11)]).toEqual([0x02, 0x00]);
        expect(data[data.length - 1]).toBe(0x0a);

        // Device responds with Current State: Ready (Authorized)
        buffer.push(buildPacket(0x01, [0x02], true));
      },
    };

    const ctx: DetectorContext = {
      io,
      buffer,
      now: () => Date.now(),
    };

    const hit = await improvSerialDetector.active?.(ctx);
    expect(hit).not.toBeNull();
    expect(hit?.confidence).toBe('high');
  });
});

