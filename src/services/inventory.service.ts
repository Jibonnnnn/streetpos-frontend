import api from './api';

export const inventoryService = {
  getInventory: async () => {
    return api.get('/inventory');
  },
  createInventoryItem: async (payload: unknown) => {
    return api.post('/inventory', payload);
  },
  adjustInventoryItem: async (id: number, payload: unknown) => {
    return api.post(`/inventory/${id}/adjust`, payload);
  },
  deleteInventoryItem: async (id: number) => {
    return api.delete(`/inventory/${id}`);
  },
};