export type PartitionSegment = {
  key: string;
  label: string;
  width: string;
  color: string;
  backgroundImage: string | null;
  sizeText: string;
  offsetHex: string;
  endHex: string;
  offset: number;
  size: number;
  typeHex: string;
  subtypeHex: string;
  typeLabel: string;
  subtypeLabel: string;
  isUnused: boolean;
  isReserved: boolean;
  showLabel: boolean;
  showMeta: boolean;
  tooltipLines: string[];
};

export type UnusedFlashSummary = {
  bytes: number;
  readable: string;
};

export type FormattedPartitionRow = {
  label: string;
  typeLabel: string;
  subtypeLabel: string;
  typeHex: string;
  subtypeHex: string;
  offset: number;
  offsetHex: string;
  size: number;
  sizeText: string;
  color: string;
  backgroundImage: string | null;
  type?: number;
  subtype?: number;
  detectedFilesystem?: string;
  isUnused?: boolean;
  isReserved?: boolean;
};
