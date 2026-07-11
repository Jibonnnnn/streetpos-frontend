import api from './api';

export const dashboardService = {
  getDashboard: async () => {
    return api.get('/dashboard');
  },

  getSalesReport: async (filter: any) => {
    return api.post('/dashboard/reports', filter);
  },

  // PDF Export only
  exportPdf: async (filter: any) => {
    return api.post('/dashboard/reports/export/pdf', filter, { 
      responseType: 'blob' 
    });
  },
};