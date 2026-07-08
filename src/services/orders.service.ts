import api from './api';

export const ordersService = {
  getMyOrders: async () => {
    return api.get('/orders/my-orders');
  },
  createOrder: async (payload: unknown) => {
    return api.post('/orders', payload);
  },
  checkoutOrder: async (payload: unknown) => {
    return api.post('/orders/checkout', payload);
  },
};