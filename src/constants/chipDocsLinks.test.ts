import { describe, expect, it } from 'vitest';
import { findChipDocs } from './chipDocsLinks';

describe('findChipDocs', () => {
  it('returns English documentation links by default', () => {
    const docs = findChipDocs('ESP32-S3');

    expect(docs?.hwReference).toBe(
      'https://docs.espressif.com/projects/esp-idf/en/latest/esp32s3/hw-reference/index.html',
    );
    expect(docs?.datasheet).toBe(
      'https://www.espressif.com/sites/default/files/documentation/esp32-s3_datasheet_en.pdf',
    );
  });

  it('returns Chinese documentation links when the locale is Chinese', () => {
    const docs = findChipDocs('ESP32-S3', 'zh');

    expect(docs?.hwReference).toBe(
      'https://docs.espressif.com/projects/esp-idf/zh_CN/latest/esp32s3/hw-reference/index.html',
    );
    expect(docs?.datasheet).toBe(
      'https://documentation.espressif.com/esp32-s3_datasheet_cn.pdf',
    );
    expect(docs?.technicalReferenceManual).toBe(
      'https://documentation.espressif.com/esp32-s3_technical_reference_manual_cn.pdf',
    );
    expect(docs?.errata).toBe(
      'https://documentation.espressif.com/esp-chip-errata/zh_CN/latest/esp32s3/index.html',
    );
    expect(docs?.hardwareDesignGuidelines).toBe(
      'https://documentation.espressif.com/esp-hardware-design-guidelines/zh_CN/latest/esp32s3/index.html',
    );
  });

  it('falls back to English links when a Chinese document is unavailable', () => {
    const docs = findChipDocs('ESP32-C2', 'zh');

    expect(docs?.hwReference).toBe(
      'https://docs.espressif.com/projects/esp-idf/zh_CN/latest/esp32c2/hw-reference/index.html',
    );
    expect(docs?.datasheet).toBeUndefined();
    expect(docs?.technicalReferenceManual).toBeUndefined();
  });

  it('keeps English documentation links for non-Chinese locales', () => {
    const docs = findChipDocs('ESP32S3', 'fr');

    expect(docs?.hwReference).toBe(
      'https://docs.espressif.com/projects/esp-idf/en/latest/esp32s3/hw-reference/index.html',
    );
  });
});
