export const FACT_ICONS: Record<string, string> = {
  'Chip Variant': 'mdi-chip',
  Revision: 'mdi-update',
  'Embedded Flash': 'mdi-memory',
  'Embedded PSRAM': 'mdi-chip',
  'Flash Vendor (eFuse)': 'mdi-factory',
  'PSRAM Vendor (eFuse)': 'mdi-factory',
  'Flash ID': 'mdi-barcode',
  'Flash Manufacturer': 'mdi-domain',
  'Flash Device': 'mdi-chip',
  'Package Form Factor': 'mdi-package-variant-closed',
  'USB Bridge': 'mdi-usb-port',
  'Connection Baud': 'mdi-speedometer',
  'eFuse Block Version': 'mdi-shield-key',
  'PWM/LEDC': 'mdi-waveform',
  'CPU Cores': 'mdi-animation',
  'Max CPU Frequency': 'mdi-speedometer',
};

export const PRIMARY_FACTS = [
  'CPU Cores',
  'Max CPU Frequency',
  'Embedded PSRAM',
  'Flash Device',
  'USB Bridge',
  'Connection Baud',
  'Embedded Flash',
];

type FactLabelConfig = { label: string; key: string };

type FactGroupConfig = {
  title: string;
  titleKey: string;
  icon: string;
  labels: FactLabelConfig[];
};

export const FACT_GROUP_CONFIG: FactGroupConfig[] = [
  {
    title: 'Package & Revision',
    titleKey: 'package',
    icon: 'mdi-chip',
    labels: [
      { label: 'Chip Variant', key: 'chipVariant' },
      { label: 'Package Form Factor', key: 'packageFormFactor' },
      { label: 'Revision', key: 'revision' },
      { label: 'CPU Cores', key: 'cpuCores' },
      { label: 'Max CPU Frequency', key: 'maxCpuFrequency' },
    ],
  },
  {
    title: 'Embedded Memory',
    titleKey: 'embeddedMemory',
    icon: 'mdi-memory',
    labels: [
      { label: 'Embedded Flash', key: 'embeddedFlash' },
      { label: 'Embedded PSRAM', key: 'embeddedPsr' },
      { label: 'Flash ID', key: 'flashId' },
      { label: 'Flash Manufacturer', key: 'flashManufacturer' },
      { label: 'Flash Device', key: 'flashDevice' },
      { label: 'Flash Vendor (eFuse)', key: 'flashVendorEfuse' },
      { label: 'PSRAM Vendor (eFuse)', key: 'psramVendorEfuse' },
    ],
  },
  {
    title: 'Security',
    titleKey: 'security',
    icon: 'mdi-shield-key-outline',
    labels: [
      { label: 'eFuse Block Version', key: 'efuseBlockVersion' },
      { label: 'Flash Encryption', key: 'flashEncryption' },
      { label: 'Flash Encryption Details', key: 'flashEncryptionDetails' },
      { label: 'Flash Encryption Mode', key: 'flashEncryptionMode' },
      { label: 'Secure Boot', key: 'secureBoot' },
      { label: 'Secure Boot Type', key: 'secureBootType' },
      { label: 'JTAG Protection', key: 'jtagProtection' },
      { label: 'USB Protection', key: 'usbProtection' },
      { label: 'Download-Mode Caches', key: 'downloadModeCaches' },
      { label: 'Security Note', key: 'securityNote' },
    ],
  },
  {
    title: 'Peripherals',
    titleKey: 'peripherals',
    icon: 'mdi-waveform',
    labels: [{ label: 'PWM/LEDC', key: 'pwmLedc' }],
  },
  {
    title: 'Connection',
    titleKey: 'connection',
    icon: 'mdi-usb-port',
    labels: [
      { label: 'USB Bridge', key: 'usbBridge' },
      { label: 'Connection Baud', key: 'connectionBaud' },
    ],
  },
  {
    title: 'Documentation',
    titleKey: 'documentation',
    icon: 'mdi-book-open-page-variant',
    labels: [
      { label: 'Hardware Reference', key: 'hardwareReference' },
      { label: 'Datasheet', key: 'datasheet' },
      { label: 'Technical Reference Manual', key: 'technicalReferenceManual' },
      { label: 'Errata', key: 'errata' },
      { label: 'Hardware Design Guidelines', key: 'hardwareDesignGuidelines' },
    ],
  },
];

const FACT_LABEL_KEY_MAP = new Map<string, string>();
FACT_GROUP_CONFIG.forEach(group => {
  group.labels.forEach(entry => {
    FACT_LABEL_KEY_MAP.set(entry.label, entry.key);
  });
});

export function getFactLabelKey(label: string): string | undefined {
  return FACT_LABEL_KEY_MAP.get(label);
}
