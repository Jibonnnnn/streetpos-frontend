import api from './api';

export const usersService = {
  getUsers: async () => {
    return api.get('/users');
  },
  createUser: async (payload: unknown) => {
    return api.post('/users', payload);
  },
  updateUser: async (id: number, payload: unknown) => {
    return api.put(`/users/${id}`, payload);
  },
  deactivateUser: async (id: number) => {
    return api.put(`/users/${id}/deactivate`);
  },
};