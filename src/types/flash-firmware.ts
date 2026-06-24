export type AlertType = 'success' | 'info' | 'warning' | 'error';

export type ProgressDialogState = {
  visible: boolean;
  value: number;
  label: string;
  indeterminate?: boolean;
};

export type FlashOffsetPreset = {
  label: string;
  value: string;
  color?: string | null;
};

export type PartitionOptionValue = number | string;

export type FlashPartitionOption = {
  label: string;
  value: PartitionOptionValue;
  offset: number;
  size: number;
  offsetHex: string;
  sizeText: string;
  baseLabel: string;
  typeHex: string;
  subtypeHex: string;
  color?: string | null;
};

export type RegisterOption = {
  label: string;
  address: string;
  description: string;
  link: string | null;
};

export type RegisterReference = {
  title: string;
  url: string;
};

export type FirmwareInputValue = File | File[] | null;

export type EraseFlashPayload =
  | { mode: 'full' }
  | { mode: 'partition'; partition?: PartitionOptionValue | null }
  | { mode: 'region'; offset?: string | number | null; length?: string | number | null; label?: string };
