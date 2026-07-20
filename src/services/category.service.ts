// src/services/category.service.ts
import api from "@/lib/api";
import type { Category } from "@/types";

export const categoryService = {
  getAll: () => api.get<Category[]>("/categories"),

  create: (data: { name: string; description?: string; displayOrder?: number }) =>
    api.post<Category>("/categories", data),

  // Update (added)
  update: (id: number, data: { name: string; description?: string; displayOrder?: number }) =>
    api.put(`/categories/${id}`, data),

  // Deactivate (added)
  deactivate: (id: number) =>
    api.delete(`/categories/${id}`),
};