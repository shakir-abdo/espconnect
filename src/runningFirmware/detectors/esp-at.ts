import type { Detector, DetectorContext } from '../types';

const sleep = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms));

async function waitForAscii(
  ctx: DetectorContext,
  re: RegExp,
  ms: number,
): Promise<RegExpMatchArray | null> {
  const deadline = ctx.now() + ms;
  while (ctx.now() < deadline) {
    const m = ctx.buffer.matchRegex(re, 4096);
    if (m) return m;
    await sleep(20);
  }
  return null;
}

export const espAtDetector: Detector = {
  id: "esp-at",
  name: "ESP-AT Firmware",
  priority: 900,
  passive: (ctx) => {
    // If already printed something like "ESP-AT" in banner
    if (ctx.buffer.includesAscii("ESP-AT")) {
      return { id: "esp-at", name: "ESP-AT Firmware", confidence: "med" };
    }
    return null;
  },
  active: async (ctx) => {
    // Clear recent noise for clean detection
    ctx.buffer.clear();

    await ctx.io.write(new TextEncoder().encode("AT\r\n"));
    const ok = await waitForAscii(ctx, /\bOK\r?\n/, 200);
    if (!ok) return null;

    await ctx.io.write(new TextEncoder().encode("AT+GMR\r\n"));
    const gmr = await waitForAscii(ctx, /(AT version:.*|ESP-AT.*|SDK version:.*)/i, 350);
    // Many firmwares reply OK to "AT" even if not ESP-AT, but "AT+GMR" is more specific.
    if (!gmr) {
      return { id: "esp-at", name: "ESP-AT Firmware", confidence: "med" };
    }

    return {
      id: "esp-at",
      name: "ESP-AT Firmware",
      confidence: "high",
      details: { gmr: gmr[0].trim() },
    };
  },
};
