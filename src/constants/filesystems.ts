export const SPIFFS_TEXT_EXTENSIONS = [
  'txt',
  'log',
  'json',
  'csv',
  'ini',
  'cfg',
  'conf',
  'htm',
  'html',
  'md',
  'js',
  'ts',
  'py',
  'css',
  'xml',
  'yaml',
  'yml',
];

export const SPIFFS_IMAGE_EXTENSIONS = ['png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp', 'svg'];

export const SPIFFS_IMAGE_MIME_MAP: Record<string, string> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  gif: 'image/gif',
  bmp: 'image/bmp',
  webp: 'image/webp',
  svg: 'image/svg+xml',
};

export const SPIFFS_AUDIO_EXTENSIONS = ['mp3', 'wav', 'ogg', 'oga', 'opus', 'm4a', 'aac', 'flac', 'weba', 'webm'];

export const SPIFFS_AUDIO_MIME_MAP: Record<string, string> = {
  mp3: 'audio/mpeg',
  wav: 'audio/wav',
  ogg: 'audio/ogg',
  oga: 'audio/ogg',
  opus: 'audio/ogg; codecs=opus',
  m4a: 'audio/mp4',
  aac: 'audio/aac',
  flac: 'audio/flac',
  weba: 'audio/webm',
  webm: 'audio/webm',
};

export const SPIFFS_VIEWER_MAX_BYTES = 2 * 1024 * 1024; // 2 MB previews
export const SPIFFS_VIEWER_DECODER = new TextDecoder('utf-8', { fatal: false, ignoreBOM: true });
export const SPIFFS_MAX_FILENAME_LENGTH = 31; // Default ESP32 SPIFFS objNameLength (32) minus null terminator

export const LITTLEFS_DEFAULT_BLOCK_SIZE = 4096;
export const LITTLEFS_BLOCK_SIZE_CANDIDATES = [4096, 2048, 1024, 512];
export const FATFS_DEFAULT_BLOCK_SIZE = 4096;
