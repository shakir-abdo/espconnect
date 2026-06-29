// esp-chip-docs-map.ts
// Central place to map ESP32-family chip IDs -> key documentation URLs.
// Intended usage: look up from CHIP_NAME (e.g. "ESP32-S3") in tools like ESPConnect.

export type EspressifChipId =
  | 'ESP32'
  | 'ESP32-S2'
  | 'ESP32-S3'
  | 'ESP32-C2'
  | 'ESP32-C3'
  | 'ESP32-C5'
  | 'ESP32-C6'
  | 'ESP32-H2'
  | 'ESP32-P4';

export interface ChipDocsLinks {
  /**
   * IDF Hardware Reference hub for this chip:
   * from here you can click through to datasheet, TRM, errata, modules, devkits, etc.
   */
  hwReference: string;

  /** Direct link to the chip datasheet (PDF), when available. */
  datasheet?: string;

  /** Direct link to the Technical Reference Manual (TRM) PDF, when available. */
  technicalReferenceManual?: string;

  /** SoC errata (HTML hub) for this chip family, when available. */
  errata?: string;

  /**
   * Hardware Design Guidelines hub (HTML). For board-level design questions:
   * power, decoupling, RF layout, etc.
   */
  hardwareDesignGuidelines?: string;
}

export const ESPRESSIF_CHIP_DOCS: Record<EspressifChipId, ChipDocsLinks> = {
  ESP32: {
    hwReference:
      'https://docs.espressif.com/projects/esp-idf/en/latest/esp32/hw-reference/index.html',
    datasheet:
      'https://www.espressif.com/documentation/esp32_datasheet_en.pdf',
    technicalReferenceManual:
      'https://www.espressif.com/documentation/esp32_technical_reference_manual_en.pdf',
    errata:
      'https://documentation.espressif.com/esp-chip-errata/en/latest/esp32/index.html',
    hardwareDesignGuidelines:
      'https://documentation.espressif.com/esp-hardware-design-guidelines/en/latest/esp32/index.html',
  },

  'ESP32-S2': {
    hwReference:
      'https://docs.espressif.com/projects/esp-idf/en/latest/esp32s2/hw-reference/index.html',
    datasheet:
      'https://www.espressif.com/sites/default/files/documentation/esp32-s2_datasheet_en.pdf',
    technicalReferenceManual:
      'https://www.espressif.com/sites/default/files/documentation/esp32-s2_technical_reference_manual_en.pdf',
    // As of late 2025, S2 errata is not in the new esp-chip-errata tree;
    // it’s listed via the general technical-documents hub instead.
    hardwareDesignGuidelines:
      'https://documentation.espressif.com/esp-hardware-design-guidelines/en/latest/esp32s2/index.html',
  },

  'ESP32-S3': {
    hwReference:
      'https://docs.espressif.com/projects/esp-idf/en/latest/esp32s3/hw-reference/index.html',
    datasheet:
      'https://www.espressif.com/sites/default/files/documentation/esp32-s3_datasheet_en.pdf',
    technicalReferenceManual:
      'https://www.espressif.com/sites/default/files/documentation/esp32-s3_technical_reference_manual_en.pdf',
    errata:
      'https://documentation.espressif.com/esp-chip-errata/en/latest/esp32s3/index.html',
    hardwareDesignGuidelines:
      'https://documentation.espressif.com/esp-hardware-design-guidelines/en/latest/esp32s3/index.html',
  },

  'ESP32-C2': {
    // ESP32-C2 is the same silicon family as ESP8684; docs sometimes carry both names.
    hwReference:
      'https://docs.espressif.com/projects/esp-idf/en/latest/esp32c2/hw-reference/index.html',
    // Public datasheet/TRM are still in flux; prefer the HW-ref hub.
    errata:
      'https://documentation.espressif.com/esp-chip-errata/en/latest/esp32c2/index.html',
    hardwareDesignGuidelines:
      'https://documentation.espressif.com/esp-hardware-design-guidelines/en/latest/esp32c2/index.html',
  },

  'ESP32-C3': {
    hwReference:
      'https://docs.espressif.com/projects/esp-idf/en/latest/esp32c3/hw-reference/index.html',
    datasheet:
      'https://www.espressif.com/documentation/esp32-c3_datasheet_en.pdf',
    technicalReferenceManual:
      'https://www.espressif.com/documentation/esp32-c3_technical_reference_manual_en.pdf',
    errata:
      'https://documentation.espressif.com/esp-chip-errata/en/latest/esp32c3/index.html',
    hardwareDesignGuidelines:
      'https://documentation.espressif.com/esp-hardware-design-guidelines/en/latest/esp32c3/index.html',
  },

  'ESP32-C5': {
    hwReference:
      'https://docs.espressif.com/projects/esp-idf/en/latest/esp32c5/hw-reference/index.html',
    datasheet:
      'https://www.espressif.com/documentation/esp32-c5_datasheet_en.pdf',
    technicalReferenceManual:
      'https://www.espressif.com/documentation/esp32-c5_technical_reference_manual_en.pdf',
    errata:
      'https://documentation.espressif.com/esp-chip-errata/en/latest/esp32c5/index.html',
    hardwareDesignGuidelines:
      'https://documentation.espressif.com/esp-hardware-design-guidelines/en/latest/esp32c5/index.html',
  },

  'ESP32-C6': {
    hwReference:
      'https://docs.espressif.com/projects/esp-idf/en/latest/esp32c6/hw-reference/index.html',
    datasheet:
      'https://www.espressif.com/documentation/esp32-c6_datasheet_en.pdf',
    technicalReferenceManual:
      'https://www.espressif.com/documentation/esp32-c6_technical_reference_manual_en.pdf',
    errata:
      'https://documentation.espressif.com/esp-chip-errata/en/latest/esp32c6/index.html',
    hardwareDesignGuidelines:
      'https://documentation.espressif.com/esp-hardware-design-guidelines/en/latest/esp32c6/index.html',
  },

  'ESP32-H2': {
    hwReference:
      'https://docs.espressif.com/projects/esp-idf/en/latest/esp32h2/hw-reference/index.html',
    datasheet:
      'https://www.espressif.com/documentation/esp32-h2_datasheet_en.pdf',
    technicalReferenceManual:
      'https://www.espressif.com/documentation/esp32-h2_technical_reference_manual_en.pdf',
    errata:
      'https://documentation.espressif.com/esp-chip-errata/en/latest/esp32h2/index.html',
    hardwareDesignGuidelines:
      'https://documentation.espressif.com/esp-hardware-design-guidelines/en/latest/esp32h2/index.html',
  },

  'ESP32-P4': {
    hwReference:
      'https://docs.espressif.com/projects/esp-idf/en/latest/esp32p4/hw-reference/index.html',
    datasheet:
      'https://www.espressif.com/sites/default/files/documentation/esp32-p4_datasheet_en.pdf',
    technicalReferenceManual:
      'https://www.espressif.com/sites/default/files/documentation/esp32-p4_technical_reference_manual_en.pdf',
    errata:
      'https://documentation.espressif.com/esp-chip-errata/en/latest/esp32p4/index.html',
    hardwareDesignGuidelines:
      'https://documentation.espressif.com/esp-hardware-design-guidelines/en/latest/esp32p4/index.html',
  },
};

const ESPRESSIF_CHIP_DOCS_ZH: Partial<Record<EspressifChipId, Partial<ChipDocsLinks>>> = {
  ESP32: {
    hwReference:
      'https://docs.espressif.com/projects/esp-idf/zh_CN/latest/esp32/hw-reference/index.html',
    datasheet:
      'https://documentation.espressif.com/esp32_datasheet_cn.pdf',
    technicalReferenceManual:
      'https://documentation.espressif.com/esp32_technical_reference_manual_cn.pdf',
    errata:
      'https://documentation.espressif.com/esp-chip-errata/zh_CN/latest/esp32/index.html',
    hardwareDesignGuidelines:
      'https://documentation.espressif.com/esp-hardware-design-guidelines/zh_CN/latest/esp32/index.html',
  },

  'ESP32-S2': {
    hwReference:
      'https://docs.espressif.com/projects/esp-idf/zh_CN/latest/esp32s2/hw-reference/index.html',
    datasheet:
      'https://documentation.espressif.com/esp32-s2_datasheet_cn.pdf',
    technicalReferenceManual:
      'https://documentation.espressif.com/esp32-s2_technical_reference_manual_cn.pdf',
    errata:
      'https://documentation.espressif.com/esp-chip-errata/zh_CN/latest/esp32s2/index.html',
    hardwareDesignGuidelines:
      'https://documentation.espressif.com/esp-hardware-design-guidelines/zh_CN/latest/esp32s2/index.html',
  },

  'ESP32-S3': {
    hwReference:
      'https://docs.espressif.com/projects/esp-idf/zh_CN/latest/esp32s3/hw-reference/index.html',
    datasheet:
      'https://documentation.espressif.com/esp32-s3_datasheet_cn.pdf',
    technicalReferenceManual:
      'https://documentation.espressif.com/esp32-s3_technical_reference_manual_cn.pdf',
    errata:
      'https://documentation.espressif.com/esp-chip-errata/zh_CN/latest/esp32s3/index.html',
    hardwareDesignGuidelines:
      'https://documentation.espressif.com/esp-hardware-design-guidelines/zh_CN/latest/esp32s3/index.html',
  },

  'ESP32-C2': {
    hwReference:
      'https://docs.espressif.com/projects/esp-idf/zh_CN/latest/esp32c2/hw-reference/index.html',
    errata:
      'https://documentation.espressif.com/esp-chip-errata/zh_CN/latest/esp32c2/index.html',
    hardwareDesignGuidelines:
      'https://documentation.espressif.com/esp-hardware-design-guidelines/zh_CN/latest/esp32c2/index.html',
  },

  'ESP32-C3': {
    hwReference:
      'https://docs.espressif.com/projects/esp-idf/zh_CN/latest/esp32c3/hw-reference/index.html',
    datasheet:
      'https://documentation.espressif.com/esp32-c3_datasheet_cn.pdf',
    technicalReferenceManual:
      'https://documentation.espressif.com/esp32-c3_technical_reference_manual_cn.pdf',
    errata:
      'https://documentation.espressif.com/esp-chip-errata/zh_CN/latest/esp32c3/index.html',
    hardwareDesignGuidelines:
      'https://documentation.espressif.com/esp-hardware-design-guidelines/zh_CN/latest/esp32c3/index.html',
  },

  'ESP32-C5': {
    hwReference:
      'https://docs.espressif.com/projects/esp-idf/zh_CN/latest/esp32c5/hw-reference/index.html',
    datasheet:
      'https://documentation.espressif.com/esp32-c5_datasheet_cn.pdf',
    technicalReferenceManual:
      'https://documentation.espressif.com/esp32-c5_technical_reference_manual_cn.pdf',
    errata:
      'https://documentation.espressif.com/esp-chip-errata/zh_CN/latest/esp32c5/index.html',
    hardwareDesignGuidelines:
      'https://documentation.espressif.com/esp-hardware-design-guidelines/zh_CN/latest/esp32c5/index.html',
  },

  'ESP32-C6': {
    hwReference:
      'https://docs.espressif.com/projects/esp-idf/zh_CN/latest/esp32c6/hw-reference/index.html',
    datasheet:
      'https://documentation.espressif.com/esp32-c6_datasheet_cn.pdf',
    technicalReferenceManual:
      'https://documentation.espressif.com/esp32-c6_technical_reference_manual_cn.pdf',
    errata:
      'https://documentation.espressif.com/esp-chip-errata/zh_CN/latest/esp32c6/index.html',
    hardwareDesignGuidelines:
      'https://documentation.espressif.com/esp-hardware-design-guidelines/zh_CN/latest/esp32c6/index.html',
  },

  'ESP32-H2': {
    hwReference:
      'https://docs.espressif.com/projects/esp-idf/zh_CN/latest/esp32h2/hw-reference/index.html',
    datasheet:
      'https://documentation.espressif.com/esp32-h2_datasheet_cn.pdf',
    technicalReferenceManual:
      'https://documentation.espressif.com/esp32-h2_technical_reference_manual_cn.pdf',
    errata:
      'https://documentation.espressif.com/esp-chip-errata/zh_CN/latest/esp32h2/index.html',
    hardwareDesignGuidelines:
      'https://documentation.espressif.com/esp-hardware-design-guidelines/zh_CN/latest/esp32h2/index.html',
  },

  'ESP32-P4': {
    hwReference:
      'https://docs.espressif.com/projects/esp-idf/zh_CN/latest/esp32p4/hw-reference/index.html',
    datasheet:
      'https://documentation.espressif.com/esp32-p4_datasheet_cn.pdf',
    technicalReferenceManual:
      'https://documentation.espressif.com/esp32-p4_technical_reference_manual_cn.pdf',
    errata:
      'https://documentation.espressif.com/esp-chip-errata/zh_CN/latest/esp32p4/index.html',
    hardwareDesignGuidelines:
      'https://documentation.espressif.com/esp-hardware-design-guidelines/zh_CN/latest/esp32p4/index.html',
  },
};

function normalizeChipId(chipName: string): EspressifChipId | undefined {
  const normalized = chipName.trim().toUpperCase();
  const candidates = [
    normalized,
    normalized.replace(/^ESP32([SCHP]\d)/, 'ESP32-$1'),
  ];

  return candidates.find(
    candidate => candidate in ESPRESSIF_CHIP_DOCS,
  ) as EspressifChipId | undefined;
}

// Optional tiny helper if you want to be a bit more forgiving with incoming IDs.
export function findChipDocs(
  chipName: string,
  locale = 'en',
): ChipDocsLinks | undefined {
  const chipId = normalizeChipId(chipName);
  if (!chipId) return undefined;

  const chipDocs = ESPRESSIF_CHIP_DOCS[chipId];

  if (!locale.toLowerCase().startsWith('zh')) {
    return chipDocs;
  }

  const localizedDocs = ESPRESSIF_CHIP_DOCS_ZH[chipId];
  return localizedDocs ? { ...chipDocs, ...localizedDocs } : chipDocs;
}
