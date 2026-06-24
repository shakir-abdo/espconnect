// src/tests/ota.fixture.test.ts
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

import { OTA_SELECT_SECTOR_SIZE } from "../constants/app";
import { detectActiveOtaSlot } from "../utils/ota";

const FIXTURE_OTA1_PATH = path.resolve(
  process.cwd(),
  "src/tests/fixtures/otadata_images/otadata_ota_1_active.bin"
);
const FIXTURE_OTA0_PATH = path.resolve(
  process.cwd(),
  "src/tests/fixtures/otadata_images/otadata_ota_0_active.bin"
);

const DEFAULT_OTA_ENTRIES = [{ subtype: 0x10 }, { subtype: 0x11 }];

// Build a realistic otadata buffer (0x2000) with entries at 0x0000 and 0x1000.
// Build a realistic otadata buffer (0x2000) with entries at 0x0000 and 0x1000.
function buildOtadata(primarySeq: number, secondarySeq: number): Uint8Array {
  const buffer = new Uint8Array(OTA_SELECT_SECTOR_SIZE * 2); // 0x2000

  // Real otadata often has lots of 0xFF in unused fields. Using 0xFF also avoids
  // tripping plausibility checks that treat all-zeros as suspicious.
  buffer.fill(0xff);

  const view = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength);

  const writeEntry = (base: number, seq: number) => {
    // seq
    view.setUint32(base + 0, seq >>> 0, true);

    // seq_label[20] (bytes 4..23): leave as 0xFF (erased-like)

    // ota_state (u32 at +24): use a non-invalid value (0 is common/benign)
    view.setUint32(base + 24, 0, true);

    // crc (u32 at +28): set something non-FF/non-0 so it passes "looks plausible".
    // If your implementation computes CRC, you can compute it here; otherwise this is fine.
    view.setUint32(base + 28, 0x12345678, true);
  };

  writeEntry(0x0000, primarySeq);
  writeEntry(0x1000, secondarySeq);

  return buffer;
}


describe("otadata fixture detection", () => {
  it("detects ota_1 as the active slot", () => {
    const otadata = new Uint8Array(readFileSync(FIXTURE_OTA1_PATH));

    const detected = detectActiveOtaSlot(otadata, DEFAULT_OTA_ENTRIES);

    expect(detected.slotId).toBe("ota_1");
    expect(detected.summary.toLowerCase()).toContain("ota_1");
  });

  it("detects ota_0 as the active slot", () => {
    const otadata = new Uint8Array(readFileSync(FIXTURE_OTA0_PATH));

    const detected = detectActiveOtaSlot(otadata, DEFAULT_OTA_ENTRIES);

    expect(detected.slotId).toBe("ota_0");
    expect(detected.summary.toLowerCase()).toContain("ota_0");
  });

  it("selects the ota slot from the highest valid sequence value", () => {
    const combined = buildOtadata(2, 5);

    const detected = detectActiveOtaSlot(combined, DEFAULT_OTA_ENTRIES);

    // 2 OTA slots => (seq-1)%2
    // seq=5 => (5-1)%2 = 0 => ota_0
    expect(detected.slotId).toBe("ota_0");
    expect(detected.summary).toContain("ota_0");
  });

  it("reports when no valid ota selection is available", () => {
    const combined = buildOtadata(0xffffffff, 0x00000000);

    const detected = detectActiveOtaSlot(combined, DEFAULT_OTA_ENTRIES);

    expect(detected.slotId).toBeNull();
    expect(detected.summary).toBe("No valid OTA selection found");
  });
});
