import api from './api';

export const authService = {
  login: async (email: string, password: string) => {
    return api.post('/auth/login', { email, password });
  },
};