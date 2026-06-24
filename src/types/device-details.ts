export type DeviceFact = {
  label: string;
  value: string;
  icon: string | null;
  translationKey?: string;
};

export type DeviceFactGroup = {
  title: string;
  icon: string;
  titleKey?: string;
  items: DeviceFact[];
};

export type DeviceDetails = {
  name: string;
  description: string;
  features: string[];
  mac: string | null;
  flashSize: string | null;
  crystal: string | null;
  facts: DeviceFact[];
  factGroups: DeviceFactGroup[];
};
