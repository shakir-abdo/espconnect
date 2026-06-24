import type { Detector } from './types';
import { espAtDetector } from './detectors/esp-at';
import { improvSerialDetector } from './detectors/improv';
import { microPythonDetector, circuitPythonDetector } from './detectors/python';
import { knownFirmwareBannerDetector } from './detectors/bannerFingerprint';

export const defaultDetectors: Detector[] = [
  espAtDetector,
  improvSerialDetector,
  microPythonDetector,
  circuitPythonDetector,
  knownFirmwareBannerDetector,
];

