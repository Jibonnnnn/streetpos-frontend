import api from "@/lib/api";
import type {
  Promotion,
  CreatePromotionRequest,
  UpdatePromotionRequest,
} from "@/types";

export const promotionService = {
  getAll: () => api.get<Promotion[]>("/promotion"),
  getActive: () => api.get<Promotion[]>("/promotion/active"),
  getById: (id: number) => api.get<Promotion>(`/promotion/${id}`),
  create: (data: CreatePromotionRequest) =>
    api.post<Promotion>("/promotion", data),
  update: (id: number, data: UpdatePromotionRequest) =>
    api.put<Promotion>(`/promotion/${id}`, data),
  toggle: (id: number) => api.patch(`/promotion/${id}/toggle`),
  delete: (id: number) => api.delete(`/promotion/${id}`),
};