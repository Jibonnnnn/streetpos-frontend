import api from './api';

export const usersService = {
  getUsers: async () => {
    return api.get('/users');
  },
  createUser: async (payload: unknown) => {
    return api.post('/users', payload);
  },
  updateUser: async (id: number, payload: unknown) => {
    if (id == null || Number.isNaN(Number(id)) || Number(id) <= 0) {
      return Promise.reject(new Error('Invalid user id'));
    }
    return api.put(`/users/${Number(id)}`, payload);
  },
  deactivateUser: async (id: number) => {
    if (id == null || Number.isNaN(Number(id)) || Number(id) <= 0) {
      return Promise.reject(new Error('Invalid user id'));
    }
    return api.put(`/users/${Number(id)}/deactivate`);
  },
};
