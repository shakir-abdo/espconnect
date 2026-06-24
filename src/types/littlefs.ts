export type LittlefsEntryType = 'file' | 'dir';

export type LittlefsEntry = {
  name: string;
  path: string;
  type: LittlefsEntryType;
  size: number;
};

export type LittlefsUploadPayload = {
  file: File | null;
  path: string;
  isDir?: boolean;
};

export type LittlefsDiskVersionFormatter = (version: number) => string;
