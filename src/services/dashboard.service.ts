import api from './api';

export const dashboardService = {
  getDashboard: async () => {
    return api.get('/dashboard');
  },
};