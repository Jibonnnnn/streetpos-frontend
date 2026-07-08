import api from './api';

const multipartHeaders = {
  headers: { 'Content-Type': 'multipart/form-data' },
};

export const menuService = {
  getMenu: async () => {
    return api.get('/menu');
  },
  getMenuItem: async (id: number) => {
    return api.get(`/menu/${id}`);
  },
  createMenuItem: async (formData: FormData) => {
    return api.post('/menu', formData, multipartHeaders);
  },
  updateMenuItem: async (id: number, formData: FormData) => {
    return api.put(`/menu/${id}`, formData, multipartHeaders);
  },
  deleteMenuItem: async (id: number) => {
    return api.delete(`/menu/${id}`);
  },
};