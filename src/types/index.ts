export interface ModifierOption {
  id: number;
  name: string;
  priceAdjustment: number;
}

export interface ModifierGroup {
  id: number;
  name: string;
  isRequired: boolean;
  displayOrder: number;
  options: ModifierOption[];
}

export interface MenuItem {
  id: number;
  name: string;
  description?: string;
  category: string;
  price: number;
  imageUrl?: string;
  displayOrder: number;
  isActive: boolean;
  availableFrom?: string;
  availableUntil?: string;
  modifierGroups: ModifierGroup[];   // ← New
}

export interface OrderItemRequest {
  menuItemId: number;
  quantity: number;
  selectedModifierOptionIds: number[];   // ← New
  itemNotes?: string;
}

export interface CartItem extends MenuItem {
  quantity: number;
  selectedModifierOptionIds: number[];
  note?: string;
  itemTotal: number;
}