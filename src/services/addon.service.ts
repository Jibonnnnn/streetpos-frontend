import api from "@/lib/api";
import type { ModifierGroup, ModifierGroupRequest } from "@/types/addons";

export const addonService = {
  getAll: () => api.get<ModifierGroup[]>("/addons"),

  getById: (id: number) => api.get<ModifierGroup>(`/addons/${id}`),

  create: (body: ModifierGroupRequest) =>
    api.post<ModifierGroup>("/addons", body),

  update: (id: number, body: ModifierGroupRequest) =>
    api.put<ModifierGroup>(`/addons/${id}`, body),

  delete: (id: number) => api.delete(`/addons/${id}`),

  getByMenuItem: (menuItemId: number) =>
    api.get<ModifierGroup[]>(`/addons/by-menu/${menuItemId}`),

  attachToMenuItem: (menuItemId: number, modifierGroupId: number) =>
    api.post(`/addons/menu/${menuItemId}/attach`, { modifierGroupId }),

  detachFromMenuItem: (menuItemId: number, modifierGroupId: number) =>
    api.delete(`/addons/menu/${menuItemId}/${modifierGroupId}`),

  setMenuItemGroups: (menuItemId: number, modifierGroupIds: number[]) =>
    api.put(`/addons/menu/${menuItemId}`, { modifierGroupIds }),
};