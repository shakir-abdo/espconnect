export type PartitionId = number | string;

export type FilesystemPartitionOption = {
  id: PartitionId;
  label: string;
  offset: number;
  size: number;
  sizeText?: string;
};

export type FilesystemUsage = {
  capacityBytes: number;
  usedBytes: number;
  freeBytes: number;
};

export type FilesystemEntryType = 'file' | 'dir';

export type FilesystemEntry = {
  name?: string;
  size?: number;
  type?: FilesystemEntryType | string;
  path?: string;
};

export type FilePreviewMode = 'text' | 'image' | 'audio';

export type FilePreviewInfo = {
  mode: FilePreviewMode;
  mime?: string;
  ext?: string;
};

export type FilePreviewInfoInput = FilePreviewInfo | FilePreviewMode | boolean | null | undefined;

export type FilePreviewInfoResolver = (name: string) => FilePreviewInfoInput;

export type FilesystemUploadPayload = {
  file: File;
};
