import api from "@/lib/api";

export const menuService = {
  getMenu: (includeInactive = false) =>
    api.get(`/menu?includeInactive=${includeInactive}`),
  getMenuItem: (id: number) => api.get(`/menu/${id}`),

  createMenuItem: async (formData: FormData) => {
    return api.post("/menu", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },

  updateMenuItem: async (id: number, formData: FormData) => {
    return api.put(`/menu/${id}`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },

  disableMenuItem: (id: number) => api.patch(`/menu/${id}/disable`),
  deleteMenuItem: (id: number) => api.delete(`/menu/${id}`),
  activateMenuItem: (id: number) => api.patch(`/menu/${id}/activate`), // Enable
};
