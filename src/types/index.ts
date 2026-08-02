export interface MenuItem {
  id: number;
  name: string;
  description?: string;
  categoryId: number;
  categoryName: string;
  price: number;
  imageFileName?: string;
  imageUrl?: string;
  displayOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;

  availableFrom?: string;
  availableUntil?: string;

  modifierGroups: ModifierGroup[];
  inventoryLinks: MenuItemInventoryLink[];
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

export interface MenuItemInventoryLink {
  inventoryItemId: number;
  inventoryItemName: string;
  unit: string;
  quantityUsedPerUnit: number;
}

export interface MenuItemInventoryLinkRequest {
  inventoryItemId: number;
  quantityUsedPerUnit: number;
}

export interface CartItem extends MenuItem {
  quantity: number;
  selectedModifierOptionIds: number[];
  selectedOptionLabels?: string[];
  note?: string;
  itemTotal: number;
}

export interface SelectedModifierResponse {
  modifierOptionId: number;
  name: string;
  priceAdjustment: number;
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

export interface OrderResponse {
  id: number;
  orderNumber: string;
  cashierId: number;
  cashierName: string;
  tableNumber?: string;
  customerName?: string;
  customerNotes?: string;
  status: "Pending" | "Preparing" | "Ready" | "Completed" | "Cancelled";
  subtotal: number;
  tax: number;
  total: number;
  createdAt: string;
  completedAt?: string;
  paymentMethod?: "Cash" | "GCash" | "Maya" | "Card" | "Other";
  amountTendered?: number;
  changeDue?: number;
  transactionReference?: string;
  items: OrderItemResponse[];
  discountAmount?: number;
  appliedPromotionId?: number;
  appliedPromotionName?: string;
}

// === NEW TYPES FOR ORDERS ===
export interface CreateOrderRequest {
  tableNumber?: string;
  customerNotes?: string;
  items: OrderItemRequest[];
}

export interface OrderItemRequest {
  menuItemId: number;
  quantity: number;
  selectedModifierOptionIds?: number[];
  itemNotes?: string;
}

export interface CheckoutRequest {
  orderId: number;
  paymentMethod: "Cash" | "GCash" | "Maya" | "Card" | "Other";
  amountTendered?: number;
  transactionId?: string;
  notes?: string;
}

// === INVENTORY ===
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
  unitCost: number;
  lastPurchaseCost?: number;
  stockValue: number;
  createdAt: string;
  updatedAt?: string;
}
export interface CreateInventoryItemRequest {
  name: string;
  description?: string;
  initialStock: number;
  unit: string;
  reorderPoint: number;
  reorderQuantity: number;
  unitCost: number;
}

export interface AdjustStockRequest {
  quantityChange: number;
  reason: string;
  unitCost?: number;
}

// === OTHER TYPES ===
export interface User {
  id: number;
  employeeId?: string;
  fullName: string;
  email: string;
  phoneNumber?: string;
  role: "Admin" | "Manager" | "Cashier";
  isActive: boolean;
  createdAt: string;
  lastLoginAt?: string;
}

export interface TopSellingItem {
  name: string;
  quantitySold: number;
  revenue: number;
}

export interface Category {
  id: number;
  name: string;
  description?: string;
  displayOrder: number;
  isActive: boolean;
  createdAt: string;
}

export type ActivityLogType =
  | "Login"
  | "InventoryAddition"
  | "InventoryDeduction"
  | "OrderCompleted"
  | "Other";

export interface ActivityLogEntry {
  id: number;
  type: ActivityLogType;
  message: string;
  actorName?: string;
  quantity?: number;
  unit?: string;
  createdAt: string;
}

export interface DashboardResponse {
  todaySales: number;
  ordersToday: number;
  openOrders: number;
  lowStockItems: number;
  activeStaff: number;
  inventoryValue?: number;
  todayPurchaseCost?: number;
  topSellingItems: TopSellingItem[];
  activityLog?: ActivityLogEntry[];
  lastUpdated: string;
}

export type PromotionType =
  | "Percentage"
  | "FixedAmount"
  | "BuyOneGetOne"
  | "HappyHour";

export interface Promotion {
  id: number;
  name: string;
  description?: string;
  type: PromotionType;
  value: number;
  startDate: string;
  endDate: string;
  availableFrom?: string;
  availableUntil?: string;
  minOrderAmount?: number;
  isActive: boolean;
  usageCount: number;
  menuItemIds: number[];
  menuItemNames: string[];
  createdAt: string;
}

export interface CreatePromotionRequest {
  name: string;
  description?: string;
  type: PromotionType;
  value: number;
  startDate: string;
  endDate: string;
  availableFrom?: string;
  availableUntil?: string;
  minOrderAmount?: number;
  menuItemIds: number[];
}

export interface UpdatePromotionRequest extends CreatePromotionRequest {
  isActive: boolean;
}

export interface OnlineCartItem {
  menuItem: MenuItem;
  quantity: number;
}

export type PaymentMethod = "Cash" | "GCash" | "Maya" | "Card" | "Other" | "PayLater";