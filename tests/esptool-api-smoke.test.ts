import { describe, expect, it } from "vitest";
import { ESPLoader } from "tasmota-webserial-esptool";
import {
  CHIP_FAMILY_ESP32,
  CHIP_FAMILY_ESP32C2,
  CHIP_FAMILY_ESP32C3,
  CHIP_FAMILY_ESP32C5,
  CHIP_FAMILY_ESP32C6,
  CHIP_FAMILY_ESP32C61,
  CHIP_FAMILY_ESP32H2,
  CHIP_FAMILY_ESP32H4,
  CHIP_FAMILY_ESP32H21,
  CHIP_FAMILY_ESP32P4,
  CHIP_FAMILY_ESP32S2,
  CHIP_FAMILY_ESP32S3,
  CHIP_FAMILY_ESP32S31,
  CHIP_FAMILY_ESP8266,
} from "tasmota-webserial-esptool/dist/const.js";

describe("tasmota-webserial-esptool compatibility", () => {
  it("exposes chip family constants and ESPLoader methods used by the wrapper", () => {
    const port = {} as SerialPort;
    const logger = {
      log: () => undefined,
      error: () => undefined,
      debug: () => undefined,
    };
    const loader = new ESPLoader(port, logger);

    expect(CHIP_FAMILY_ESP32).toBeTypeOf("number");
    expect(CHIP_FAMILY_ESP32S2).toBeTypeOf("number");
    expect(CHIP_FAMILY_ESP32S3).toBeTypeOf("number");
    expect(CHIP_FAMILY_ESP32C2).toBeTypeOf("number");
    expect(CHIP_FAMILY_ESP32C3).toBeTypeOf("number");
    expect(CHIP_FAMILY_ESP32C5).toBeTypeOf("number");
    expect(CHIP_FAMILY_ESP32C6).toBeTypeOf("number");
    expect(CHIP_FAMILY_ESP32C61).toBeTypeOf("number");
    expect(CHIP_FAMILY_ESP32H2).toBeTypeOf("number");
    expect(CHIP_FAMILY_ESP32H4).toBeTypeOf("number");
    expect(CHIP_FAMILY_ESP32H21).toBeTypeOf("number");
    expect(CHIP_FAMILY_ESP32S31).toBeTypeOf("number");
    expect(CHIP_FAMILY_ESP32P4).toBeTypeOf("number");
    expect(CHIP_FAMILY_ESP8266).toBeTypeOf("number");

    expect(loader.initialize).toBeTypeOf("function");
    expect(loader.runStub).toBeTypeOf("function");
    expect(loader.reconnect).toBeTypeOf("function");
    expect(loader.setBaudrate).toBeTypeOf("function");
    expect(loader.getChipFamily).toBeTypeOf("function");
    expect(loader.macAddr).toBeTypeOf("function");
  });
});
