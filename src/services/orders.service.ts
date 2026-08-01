import type { OrderResponse } from "@/types";
import api from "./api";

export const ordersService = {
  getMyOrders: async () => {
    return api.get("/orders/my-orders");
  },
  createOrder: async (payload: unknown) => {
    return api.post("/orders", payload);
  },
  checkoutOrder: async (payload: unknown) => {
    return api.post("/orders/checkout", payload);
  },
  createOnlineOrder: (data: {
    customerName: string;
    customerNotes?: string;
    phoneNumber?: string;
    items: {
      menuItemId: number;
      quantity: number;
      itemNotes?: string;
    }[];
  }) => api.post("/orders/online", data),

  getOnlineOrders: () => api.get("/orders/online"),

  // src/services/orders.service.ts

  getOpenTabs: () => api.get<OrderResponse[]>("/orders/open-tabs"),

  settlePayLater: (
    orderId: number,
    payload: {
      paymentMethod: string;
      amountTendered?: number;
      transactionId?: string;
      notes?: string;
    },
  ) => api.post<OrderResponse>(`/orders/${orderId}/settle`, payload),
};
