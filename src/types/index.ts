export interface MenuItem {
  id: number;
  name: string;
  description?: string;
  category: string;
  price: number;
  imageUrl?: string;
  displayOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
  availableFrom?: string;
  availableUntil?: string;
  modifierGroups: ModifierGroup[];
}

export interface ModifierGroup {
  id: number;
  name: string;
  isRequired: boolean;
  displayOrder: number;
  options: ModifierOption[];
}

export interface ModifierOption {
  id: number;
  name: string;
  priceAdjustment: number;
}

export interface CartItem extends MenuItem {
  quantity: number;
  selectedModifierOptionIds: number[];
  note?: string;
  itemTotal: number;
}

export interface OrderItemResponse {
  id: number;
  menuItemId: number;
  menuItemName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  itemNotes?: string;
  selectedModifiers: SelectedModifierResponse[];
}

export interface SelectedModifierResponse {
  modifierOptionId: number;
  name: string;
  priceAdjustment: number;
}

export interface OrderResponse {
  id: number;
  orderNumber: string;
  cashierId: number;
  cashierName: string;
  tableNumber?: string;
  customerNotes?: string;
  status: 'Pending' | 'Preparing' | 'Ready' | 'Completed' | 'Cancelled';
  subtotal: number;
  tax: number;
  total: number;
  createdAt: string;
  completedAt?: string;
  paymentMethod?: 'Cash' | 'GCash' | 'Maya' | 'Card' | 'Other';
  amountTendered?: number;
  changeDue?: number;
  transactionReference?: string;
  items: OrderItemResponse[];
}

export interface User {
  id: number;
  employeeId?: string;
  fullName: string;
  email: string;
  phoneNumber?: string;
  role: 'Admin' | 'Manager' | 'Cashier';
  isActive: boolean;
  createdAt: string;
  lastLoginAt?: string;
}

export interface InventoryItemResponse {
  id: number;
  name: string;
  description?: string;
  currentStock: number;
  unit: string;
  reorderPoint: number;
  reorderQuantity: number;
  isActive: boolean;
  isLowStock: boolean;
  createdAt: string;
}