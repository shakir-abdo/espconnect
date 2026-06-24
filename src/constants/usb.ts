export const TIMEOUT_CONNECT = 0;

export const SUPPORTED_VENDORS: SerialPortFilter[] = [
  { usbVendorId: 0x303a },
  { usbVendorId: 0x1a86 },
  { usbVendorId: 0x10c4 },
  { usbVendorId: 0x0403 },
];

export const SUPPORTED_BAUDRATES = [
  115200,
  230400,
  460800,
  921600,
  1_500_000,
  2_000_000,
] as const;

export const MAX_SUPPORTED_BAUDRATE =
  SUPPORTED_BAUDRATES[SUPPORTED_BAUDRATES.length - 1];
export const DEFAULT_ROM_BAUD = 115200;
export const DEFAULT_FLASH_BAUD = 921600;
export const MONITOR_BAUD = 115200;
export const DEBUG_SERIAL = false;

export interface UsbBridgeInfo {
  name: string;
  maxBaudrate: number;
}

export interface UsbVendorInfo {
  vendorName: string;
  products: Record<number, UsbBridgeInfo>;
}

export const USB_BRIDGE_CAPABILITIES: Record<number, UsbVendorInfo> = {
  0x1a86: {
    vendorName: "QinHeng Electronics",
    products: {
      0x7522: { name: "CH340", maxBaudrate: 460_800 },
      0x7523: { name: "CH340", maxBaudrate: 460_800 },
      0x7584: { name: "CH340", maxBaudrate: 460_800 },
      0x5523: { name: "CH341", maxBaudrate: 2_000_000 },
      0x55d3: { name: "CH343", maxBaudrate: 6_000_000 },
      0x55d4: { name: "CH9102", maxBaudrate: 6_000_000 },
      0x55d8: { name: "CH9101", maxBaudrate: 3_000_000 },
    },
  },

  0x10c4: {
    vendorName: "Silicon Labs",
    products: {
      0xea60: { name: "CP2102(n)", maxBaudrate: 3_000_000 },
      0xea70: { name: "CP2105", maxBaudrate: 2_000_000 },
      0xea71: { name: "CP2108", maxBaudrate: 2_000_000 },
    },
  },

  0x0403: {
    vendorName: "FTDI",
    products: {
      0x6001: { name: "FT232R", maxBaudrate: 3_000_000 },
      0x6010: { name: "FT2232", maxBaudrate: 3_000_000 },
      0x6011: { name: "FT4232", maxBaudrate: 3_000_000 },
      0x6014: { name: "FT232H", maxBaudrate: 12_000_000 },
      0x6015: { name: "FT230X", maxBaudrate: 3_000_000 },
    },
  },

  0x303a: {
    vendorName: "Espressif Systems",
    products: {
      0x0002: { name: "ESP32-S2 Native USB", maxBaudrate: 2_000_000 },
      0x1001: { name: "ESP32 Native USB", maxBaudrate: 2_000_000 },
      0x1002: { name: "ESP32 Native USB", maxBaudrate: 2_000_000 },
      0x4002: { name: "ESP32 Native USB (CDC)", maxBaudrate: 2_000_000 },
      0x1000: { name: "ESP32 Native USB", maxBaudrate: 2_000_000 },
    },
  },
};

export function getUsbDeviceInfo(vid: number, pid: number) {
  const vendor = USB_BRIDGE_CAPABILITIES[vid];
  if (!vendor) return undefined;

  const product = vendor.products[pid];
  if (!product) return { vendorName: vendor.vendorName, product: undefined };

  return {
    vendorName: vendor.vendorName,
    productName: product.name,
    maxBaudrate: product.maxBaudrate,
  };
}

