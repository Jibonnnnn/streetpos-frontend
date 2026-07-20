import api from './api';

export const dashboardService = {
  getDashboard: async () => {
    return api.get('/dashboard/overview');
  },

  getSalesReport: async (filter: any) => {
    return api.post('/dashboard/reports', filter);
  },

  // PDF Export only
  exportPdf: async (filter: any) => {
    return api.post('/dashboard/reports/export/pdf', filter, {
      responseType: 'blob',
    });
  },

  // NEW — requires backend endpoint: GET /dashboard/activity-log?take=20
  // Returns ActivityLogEntry[] — see src/types/index.ts
  getActivityLog: async (take: number = 20) => {
    return api.get(`/dashboard/activity-log?take=${take}`);
  },
};