/** Internal domain: Modifier. UI label: Add-ons */

export type ModifierOption = {
  id: number;
  name: string;
  priceAdjustment: number;
};

export type ModifierGroup = {
  id: number;
  name: string;
  isRequired: boolean;
  displayOrder: number;
  options: ModifierOption[];
};

export type ModifierGroupRequest = {
  name: string;
  isRequired: boolean;
  displayOrder: number;
  options: {
    name: string;
    priceAdjustment: number;
  }[];
};

export type AddonOptionForm = {
  key: string;
  name: string;
  priceAdjustment: number;
};

export type AddonGroupForm = {
  key: string;
  name: string;
  isRequired: boolean;
  displayOrder: number;
  options: AddonOptionForm[];
};