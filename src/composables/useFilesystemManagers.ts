import { reactive, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import type { LittlefsEntry } from '../types/littlefs';
import type { Spiffs } from '../wasm/spiffs';
import type { LittleFSEntry as LittlefsRawEntry } from '../wasm/littlefs/index.js';

export interface FatFSEntry {
  path: string;
  size: number;
}

export type SpiffsClient = Spiffs;

export type LittlefsClient = {
  list?: (path?: string) => LittlefsRawEntry[];
  readFile?: (path: string) => any;
  read?: (path: string) => Uint8Array;
  writeFile?: (path: string, data: any) => any;
  addFile?: (path: string, data: any) => any;
  delete?: (path: string, options?: { recursive?: boolean }) => any;
  deleteFile?: (path: string) => any;
  mkdir?: (path: string) => any;
  format: () => any;
  toImage: () => Uint8Array;
  getUsage?: () => { capacityBytes: number; usedBytes: number; freeBytes: number };
  canFit?: (path: string, size: number) => boolean;
  getDiskVersion?: () => number;
  setDiskVersion?: (version: number) => void;
};

export type FatfsClient = {
  list?: (path?: string) => FatFSEntry[];
  writeFile: (path: string, data: any) => any;
  deleteFile: (path: string) => any;
  format: () => any;
  toImage: () => Uint8Array;
  readFile?: (path: string) => Uint8Array;
  read?: (path: string) => any;
  mkdir?: (path: string) => any;
  getUsage?: () => { capacityBytes: number; usedBytes: number; freeBytes: number };
};

export function useSpiffsManager() {
  const { t } = useI18n();
  const spiffsLoadCancelRequested = ref(false);
  const spiffsState = reactive({
    selectedId: null as number | null,
    lastReadOffset: null as number | null,
    lastReadSize: 0,
    lastReadImage: null as Uint8Array | null,
    files: [] as Array<{ name?: string; size?: number }>,
    status: t('filesystemStatus.spiffs'),
    loading: false,
    busy: false,
    saving: false,
    error: null as string | null,
    client: null as SpiffsClient | null,
    readOnly: false,
    readOnlyReason: '',
    dirty: false,
    backupDone: false,
    sessionBackupDone: false,
    loadCancelled: false,
    diagnostics: [] as Array<unknown>,
    baselineFiles: [] as Array<{ name?: string; size?: number }>,
    usage: {
      capacityBytes: 0,
      usedBytes: 0,
      freeBytes: 0,
    },
    uploadBlocked: false,
    uploadBlockedReason: '',
  });
  const spiffsBackupDialog = reactive({ visible: false, value: 0, label: '' });
  const spiffsLoadingDialog = reactive({ visible: false, value: 0, label: t('dialogs.spiffsLoading') });
  const spiffsSaveDialog = reactive({ visible: false, value: 0, label: t('dialogs.spiffsSaving') });
  const spiffsRestoreDialog = reactive({ visible: false, value: 0, label: t('dialogs.spiffsRestoring') });
  const spiffsViewerDialog = reactive({
    visible: false,
    name: '',
    content: '',
    error: null as string | null,
    loading: false,
    mode: null as string | null,
    imageUrl: '',
    audioUrl: '',
    source: 'spiffs' as 'spiffs' | 'fatfs' | 'littlefs',
  });

  return {
    spiffsState,
    spiffsLoadCancelRequested,
    spiffsBackupDialog,
    spiffsLoadingDialog,
    spiffsSaveDialog,
    spiffsRestoreDialog,
    spiffsViewerDialog,
  };
}

export function useLittlefsManager(defaultBlockSize: number) {
  const { t } = useI18n();
  const littlefsLoadCancelRequested = ref(false);
  const littlefsState = reactive({
    selectedId: null as number | null,
    lastReadOffset: null as number | null,
    lastReadSize: 0,
    lastReadImage: null as Uint8Array | null,
    client: null as LittlefsClient | null,
    files: [] as LittlefsEntry[],
    allFiles: [] as LittlefsEntry[],
    currentPath: '/' as string,
    status: t('filesystemStatus.littlefs'),
    loading: false,
    busy: false,
    saving: false,
    error: null as string | null,
    readOnly: false,
    readOnlyReason: '',
    dirty: false,
    backupDone: false,
    sessionBackupDone: false,
    loadCancelled: false,
    usage: {
      capacityBytes: 0,
      usedBytes: 0,
      freeBytes: 0,
    },
    baselineFiles: [] as LittlefsEntry[],
    uploadBlocked: false,
    uploadBlockedReason: '',
    blockSize: defaultBlockSize,
    blockCount: 0,
    diskVersion: 0 as number,  // LittleFS disk version (0x00020000 = v2.0, 0x00020001 = v2.1)
  });
  const littlefsBackupDialog = reactive({ visible: false, value: 0, label: '' });
  const littlefsLoadingDialog = reactive({ visible: false, value: 0, label: t('dialogs.littlefsLoading') });
  const littlefsSaveDialog = reactive({ visible: false, value: 0, label: t('dialogs.littlefsSaving') });
  const littlefsRestoreDialog = reactive({ visible: false, value: 0, label: t('dialogs.littlefsRestoring') });

  return {
    littlefsState,
    littlefsLoadCancelRequested,
    littlefsBackupDialog,
    littlefsLoadingDialog,
    littlefsSaveDialog,
    littlefsRestoreDialog,
  };
}

export function useFatfsManager(defaultBlockSize: number) {
  const { t } = useI18n();
  const fatfsLoadCancelRequested = ref(false);
  const fatfsState = reactive({
    selectedId: null as number | null,
    lastReadOffset: null as number | null,
    lastReadSize: 0,
    lastReadImage: null as Uint8Array | null,
    client: null as FatfsClient | null,
    files: [] as LittlefsEntry[],
    allFiles: [] as LittlefsEntry[],
    currentPath: '/' as string,
    status: t('filesystemStatus.fatfs'),
    loading: false,
    busy: false,
    saving: false,
    error: null as string | null,
    readOnly: false,
    readOnlyReason: '',
    dirty: false,
    backupDone: false,
    sessionBackupDone: false,
    loadCancelled: false,
    usage: {
      capacityBytes: 0,
      usedBytes: 0,
      freeBytes: 0,
    },
    baselineFiles: [] as LittlefsEntry[],
    uploadBlocked: false,
    uploadBlockedReason: '',
    blockSize: defaultBlockSize,
    blockCount: 0,
  });
  const fatfsBackupDialog = reactive({ visible: false, value: 0, label: '' });
  const fatfsLoadingDialog = reactive({ visible: false, value: 0, label: t('dialogs.fatfsLoading') });
  const fatfsSaveDialog = reactive({ visible: false, value: 0, label: t('dialogs.fatfsSaving') });
  const fatfsRestoreDialog = reactive({ visible: false, value: 0, label: t('dialogs.fatfsRestoring') });

  return {
    fatfsState,
    fatfsLoadCancelRequested,
    fatfsBackupDialog,
    fatfsLoadingDialog,
    fatfsSaveDialog,
    fatfsRestoreDialog,
  };
}
