type TranscriptStep =
  | {
      type: "response";
      opcode: string;
      value: string;
      data?: string;
    }
  | {
      type: "timeout";
      opcode: string;
    }
  | {
      type: "raw";
      data: string;
    };

type RecorderState = {
  steps: TranscriptStep[];
  options: {
    skipStub: boolean;
    recordRaw: boolean;
  };
  installed: boolean;
  lastLoaded?: Record<string, string>;
  inGetResponse?: boolean;
};

const globalAny = globalThis as unknown as {
  __esptoolTranscriptRecorder?: RecorderState;
  __esptoolTranscriptOptions?: RecorderState["options"];
  __esptoolTranscriptReset?: () => void;
  __esptoolTranscriptDump?: () => string;
  copy?: (text: string) => void;
};

if (!globalAny.__esptoolTranscriptRecorder) {
  globalAny.__esptoolTranscriptRecorder = {
    steps: [],
    options: { skipStub: false, recordRaw: true },
    installed: false,
    lastLoaded: {},
    inGetResponse: false,
  };
}

const state = globalAny.__esptoolTranscriptRecorder;

globalAny.__esptoolTranscriptOptions = state.options;
globalAny.__esptoolTranscriptReset = () => {
  state.steps = [];
};
globalAny.__esptoolTranscriptDump = () => {
  const payload = JSON.stringify({ steps: state.steps }, null, 2);
  if (typeof globalAny.copy === "function") {
    globalAny.copy(payload);
  }
  return payload;
};

if (!state.installed) {
  const loadFromViteDeps = async (depName: string) => {
    const metadataUrl = "/node_modules/.vite/deps/_metadata.json";
    const response = await fetch(metadataUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch ${metadataUrl}`);
    }
    const metadata = (await response.json()) as {
      browserHash?: string;
      optimized?: Record<string, { file: string }>;
    };
    const file = metadata.optimized?.[depName]?.file;
    const hash = metadata.browserHash;
    if (!file || !hash) {
      throw new Error(`Missing optimized entry for ${depName}`);
    }
    return `/node_modules/.vite/deps/${file}?v=${hash}`;
  };

  const findLoadedModuleUrl = (needle: string) => {
    const entries = performance.getEntriesByType("resource");
    for (const entry of entries) {
      const name = String(entry.name);
      if (name.includes(needle)) {
        return name;
      }
    }
    return null;
  };

  const loadModule = async (depName: string, fileHint: string, fallbackUrl: string) => {
    try {
      const loaded = findLoadedModuleUrl(fileHint);
      if (loaded) {
        state.lastLoaded ??= {};
        state.lastLoaded[depName] = loaded;
        return await import(/* @vite-ignore */ loaded);
      }
      const viteUrl = await loadFromViteDeps(depName);
      state.lastLoaded ??= {};
      state.lastLoaded[depName] = viteUrl;
      return await import(/* @vite-ignore */ viteUrl);
    } catch {
      state.lastLoaded ??= {};
      state.lastLoaded[depName] = fallbackUrl;
      return await import(/* @vite-ignore */ fallbackUrl);
    }
  };

  const espLoaderFallback = new URL(
    "../node_modules/tasmota-webserial-esptool/dist/index.js",
    import.meta.url,
  ).href;
  const constFallback = new URL(
    "../node_modules/tasmota-webserial-esptool/dist/const.js",
    import.meta.url,
  ).href;

  const [{ ESPLoader }, consts] = await Promise.all([
    loadModule("tasmota-webserial-esptool", "tasmota-webserial-esptool.js", espLoaderFallback),
    loadModule(
      "tasmota-webserial-esptool/dist/const.js",
      "tasmota-webserial-esptool_dist_const__js.js",
      constFallback,
    ),
  ]);

  const opcodeName = new Map<number, string>(
    Object.entries(consts)
      .filter(([key, value]) => key.startsWith("ESP_") && typeof value === "number")
      .map(([key, value]) => [value as number, key]),
  );

  const toHex = (bytes: number[]) =>
    bytes.map(byte => byte.toString(16).padStart(2, "0")).join("");

  const originalGetResponse = ESPLoader.prototype.getResponse;
  ESPLoader.prototype.getResponse = async function (opcode: number, timeout?: number) {
    state.inGetResponse = true;
    try {
      const [value, data] = await originalGetResponse.call(this, opcode, timeout);
      const entry: TranscriptStep = {
        type: "response",
        opcode: opcodeName.get(opcode) ?? `0x${opcode.toString(16)}`,
        value: `0x${(value >>> 0).toString(16)}`,
      };
      if (data?.length) {
        entry.data = toHex(data);
      }
      state.steps.push(entry);
      return [value, data];
    } catch (error: any) {
      if (error?.name === "SlipReadError") {
        state.steps.push({
          type: "timeout",
          opcode: opcodeName.get(opcode) ?? `0x${opcode.toString(16)}`,
        });
      }
      throw error;
    } finally {
      state.inGetResponse = false;
    }
  };

  const originalReadPacket = ESPLoader.prototype.readPacket;
  ESPLoader.prototype.readPacket = async function (timeout?: number) {
    const packet = await originalReadPacket.call(this, timeout);
    if (!state.inGetResponse && state.options.recordRaw) {
      state.steps.push({
        type: "raw",
        data: toHex(packet),
      });
    }
    return packet;
  };

  const originalRunStub = ESPLoader.prototype.runStub;
  ESPLoader.prototype.runStub = async function (...args: any[]) {
    if (state.options.skipStub) {
      return this;
    }
    return originalRunStub.apply(this, args);
  };

  state.installed = true;
}
