import type { Detector } from '../types';

export const knownFirmwareBannerDetector: Detector = {
  id: "known-banners",
  name: "Known Firmware (Banner)",
  priority: 700,
  passive: (ctx) => {
    const s = ctx.buffer.toAscii(4096);

    if (/WLED/i.test(s)) return { id: "wled", name: "WLED", confidence: "med" };
    if (/Tasmota/i.test(s)) return { id: "tasmota", name: "Tasmota", confidence: "med" };
    if (/ESPURNA/i.test(s)) return { id: "espurna", name: "ESPurna", confidence: "med" };
    if (/ESPHOME/i.test(s)) return { id: "esphome", name: "ESPHome", confidence: "low" };

    return null;
  },
};
