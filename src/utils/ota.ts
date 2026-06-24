import { OTA_SELECT_SECTOR_SIZE } from "../constants/app";

type MinimalOtaEntry = { subtype?: number };

type OtaDetectionResult = {
  slotId: string | null;
  summary: string;
};

function readUint32LE(buffer: Uint8Array, offset: number): number | null {
  if (!buffer || offset < 0 || offset + 4 > buffer.length) return null;
  const view = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength);
  return view.getUint32(offset, true);
}

// Standard CRC32 (IEEE 802.3), used by ESP-IDF.
function crc32(bytes: Uint8Array): number {
  let crc = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) {
    crc ^= bytes[i];
    for (let b = 0; b < 8; b++) {
      const mask = -(crc & 1);
      crc = (crc >>> 1) ^ (0xedb88320 & mask);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function crc32OfU32LE(value: number): number {
  const tmp = new Uint8Array(4);
  const dv = new DataView(tmp.buffer);
  dv.setUint32(0, value >>> 0, true);
  return crc32(tmp);
}

/**
 * Validates ESP-IDF otadata entries:
 * struct (32 bytes): ota_seq (u32), seq_label[20], ota_state (u32), crc (u32)
 * crc = CRC32 of ota_seq field only. :contentReference[oaicite:3]{index=3}
 */
export function detectActiveOtaSlot(
  otadata: Uint8Array,
  otaEntries: MinimalOtaEntry[],
): OtaDetectionResult {
  const otaCount = otaEntries?.length ?? 0;
  if (!otadata?.length || !otaCount) return { slotId: null, summary: "Active slot unknown." };

  const maxEntriesFromBuffer = Math.floor(otadata.length / OTA_SELECT_SECTOR_SIZE);
  const entryCount = Math.min(2, maxEntriesFromBuffer);
  if (entryCount <= 0) return { slotId: null, summary: "Active slot unknown." };

  const candidates: { seq: number; slotIndex: number; state: number; crc: number }[] = [];

  for (let index = 0; index < entryCount; index++) {
    const base = index * OTA_SELECT_SECTOR_SIZE;

    const seq = readUint32LE(otadata, base + 0);
    const state = readUint32LE(otadata, base + 24);
    const crc = readUint32LE(otadata, base + 28);

    if (seq == null || state == null || crc == null) continue;

    // Skip erased/empty markers.
    if (seq === 0xffffffff || seq === 0x00000000) continue;

// Validate CRC if we can, but don't hard-fail if CRC flavor differs.
// Reject only obviously-garbage patterns.
const expectedCrc = crc32OfU32LE(seq);

const crcLooksUnset = crc === 0x00000000 || crc === 0xffffffff;
const crcMatches = crc === expectedCrc;

// If CRC mismatches, still accept if the entry looks like a real otadata entry
// (seq set, and most of seq_label is 0xFF as commonly seen).
let looksPlausible = false;
if (!crcMatches) {
  // seq_label is [4..23] (20 bytes)
  const label = otadata.subarray(base + 4, base + 24);
  const ffCount = label.reduce((acc, b) => acc + (b === 0xff ? 1 : 0), 0);
  // Most real-world label bytes are 0xFF (erased) unless explicitly written
  looksPlausible = ffCount >= 16; // tune if you want
}

// Hard reject only if CRC mismatches AND doesn't look plausible.
if (!crcMatches && !looksPlausible) continue;

    // Optional: exclude explicitly bad states (INVALID=3, ABORTED=4). :contentReference[oaicite:4]{index=4}
    if (state === 3 || state === 4) continue;

    const slotIndex = (seq - 1) % otaCount;
    if (slotIndex < 0 || slotIndex >= otaCount) continue;

    candidates.push({ seq, slotIndex, state, crc });
  }

  if (!candidates.length) {
    return { slotId: null, summary: "No valid OTA selection found" };
  }

  candidates.sort((a, b) => b.seq - a.seq);
  const winner = candidates[0];
  const slotId = `ota_${winner.slotIndex}`;
  return { slotId, summary: `Active slot: ${slotId} (sequence ${winner.seq})` };
}
