import type { OrderResponse, OrderReceiptDto } from "@/types";
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
      selectedModifierOptionIds?: number[];
    }[];
  }) => api.post("/orders/online", data),

  getOnlineOrders: () => api.get("/orders/online"),

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

  // ---------- RECEIPTS ----------

  getReceiptData: (id: number) =>
    api.get<OrderReceiptDto>(`/orders/${id}/receipt/data`),

  downloadReceiptPdf: async (id: number, orderNumber?: string) => {
    const res = await api.get(`/orders/${id}/receipt`, {
      responseType: "blob",
    });
    const blob = new Blob([res.data], { type: "application/pdf" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `receipt-${orderNumber || id}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },
};