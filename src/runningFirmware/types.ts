import type { SerialIO } from './ringBuffer';
import { RingBuffer } from './ringBuffer';

export type DetectConfidence = 'low' | 'med' | 'high';

export type DetectMatch = {
  id: string; // "esp-at", "improv-serial", ...
  name: string; // Display label
  confidence: DetectConfidence;
  details?: Record<string, string>; // version, build, etc.
};

export type DetectorContext = {
  io: SerialIO;
  buffer: RingBuffer;
  now: () => number;
  log?: (msg: string) => void;
  // optional: helpers for toggling reset lines if you want passive banners
};

export type Detector = {
  id: string;
  name: string;
  priority: number; // higher first
  passive?: (ctx: DetectorContext) => DetectMatch | null;
  active?: (ctx: DetectorContext) => Promise<DetectMatch | null>;
};

export type { SerialIO };
export { RingBuffer };
