import { describe, expect, it } from 'vitest';

import { asciiMatches, buildImprovPacket, checksum8, findImprovPacket, packetDetails } from './improv-utils';

describe('improv utils', () => {
  describe('asciiMatches', () => {
    const buffer = new Uint8Array([0x41, 0x42, 0x43, 0x44]); // "ABCD"

    it('detects a matching sequence at the given offset', () => {
      const needle = new Uint8Array([0x42, 0x43]);
      expect(asciiMatches(buffer, 1, needle)).toBe(true);
    });

    it('rejects when characters differ or spill past the buffer', () => {
      const needle = new Uint8Array([0x43, 0x45]);
      expect(asciiMatches(buffer, 2, needle)).toBe(false);
      expect(asciiMatches(buffer, 3, needle)).toBe(false);
    });
  });

  describe('checksum8', () => {
    it('returns the modulo-256 sum of the slice', () => {
      const data = new Uint8Array([0x01, 0x10, 0x20]);
      expect(checksum8(data, 0, data.length)).toBe((0x01 + 0x10 + 0x20) & 0xff);
      expect(checksum8(data, 1, 2)).toBe(0x10);
    });
  });

  describe('buildImprovPacket', () => {
    it('builds a packet with a checksum and LF terminator', () => {
      const payload = new Uint8Array([0x02, 0x03]);
      const packet = buildImprovPacket(0x01, payload);

      expect(packet[packet.length - 1]).toBe(0x0a);
      expect(packet[packet.length - 2]).toBe(checksum8(packet, 0, packet.length - 2));
    });
  });

  describe('findImprovPacket', () => {
    it('finds a complete packet embedded in a snapshot', () => {
      const payload = new Uint8Array([0x03]);
      const packet = buildImprovPacket(0x01, payload);

      const hit = findImprovPacket(packet);
      expect(hit?.packet).toBeDefined();
      expect(hit?.packet?.type).toBe(0x01);
      expect(hit?.packet?.length).toBe(1);
      expect(hit?.packet?.data[0]).toBe(0x03);
      expect(hit?.packet?.hasLfTerminator).toBe(true);
    });

    it('returns maybe when the packet is truncated', () => {
      const payload = new Uint8Array([0x00]);
      const packet = buildImprovPacket(0x01, payload);
      const packetLen = 9 + payload.length + 1;
      const truncated = packet.subarray(0, packetLen - 1);

      const hit = findImprovPacket(truncated);
      expect(hit?.packet).toBeUndefined();
      expect(hit?.maybe).toBe(true);
    });

    it('skips packets with unsupported types even when checksum matches', () => {
      const payload = new Uint8Array([0x01]);
      const packet = new Uint8Array(buildImprovPacket(0x01, payload));
      packet[7] = 0x03;
      packet[packet.length - 2] = checksum8(packet, 0, packet.length - 2);

      const hit = findImprovPacket(packet);
      expect(hit).toBeNull();
    });
  });

  describe('packetDetails', () => {
    it('describes state packets', () => {
      const details = packetDetails({ type: 0x01, length: 1, data: new Uint8Array([0x02]), hasLfTerminator: true });
      expect(details).toEqual({
        packet: 'Current State',
        state: '0x02',
        stateName: 'Ready (Authorized)',
      });
    });

    it('describes error packets', () => {
      const details = packetDetails({ type: 0x02, length: 1, data: new Uint8Array([0x05]), hasLfTerminator: false });
      expect(details).toEqual({
        packet: 'Error State',
        error: '0x05',
        errorName: 'Bad Hostname',
      });
    });

    it('returns undefined for other packets', () => {
      const details = packetDetails({ type: 0x04, length: 2, data: new Uint8Array([0x01, 0x02]), hasLfTerminator: false });
      expect(details).toBeUndefined();
    });
  });
});
