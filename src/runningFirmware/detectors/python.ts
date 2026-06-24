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

export const microPythonDetector: Detector = {
  id: "micropython",
  name: "MicroPython REPL",
  priority: 800,
  passive: (ctx) => {
    if (ctx.buffer.includesAscii("MicroPython")) {
      return { id: "micropython", name: "MicroPython REPL", confidence: "high" };
    }
    if (ctx.buffer.matchRegex(/>>> ?$/, 2048)) {
      return { id: "micropython", name: "MicroPython REPL", confidence: "med" };
    }
    return null;
  },
  active: async (ctx) => {
    ctx.buffer.clear();
    // Ctrl-C twice to break running script, then newline
    await ctx.io.write(new Uint8Array([0x03, 0x03, 0x0D, 0x0A]));
    const repl = await waitForAscii(ctx, /(MicroPython|>>>)/, 250);
    if (!repl) return null;

    const isMicro = /MicroPython/i.test(repl[0]);
    return {
      id: "micropython",
      name: "MicroPython REPL",
      confidence: isMicro ? "high" : "med",
    };
  },
};

export const circuitPythonDetector: Detector = {
  id: "circuitpython",
  name: "CircuitPython REPL",
  priority: 790,
  passive: (ctx) => (ctx.buffer.includesAscii("CircuitPython")
    ? { id: "circuitpython", name: "CircuitPython REPL", confidence: "high" }
    : null),
  active: async (ctx) => {
    ctx.buffer.clear();
    await ctx.io.write(new Uint8Array([0x03, 0x0D, 0x0A]));
    const hit = await waitForAscii(ctx, /(Adafruit CircuitPython|CircuitPython)/i, 250);
    if (!hit) return null;
    return { id: "circuitpython", name: "CircuitPython REPL", confidence: "high" };
  },
};
