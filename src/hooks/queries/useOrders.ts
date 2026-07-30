import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ordersService } from '@/services/orders.service';
import type { CreateOrderRequest } from '@/types'; // Only needed types are imported

export const useMyOrders = () => {
  return useQuery({
    queryKey: ['myOrders'],
    queryFn: async () => {
      const res = await ordersService.getMyOrders();
      return Array.isArray(res.data) ? res.data : [];
    },
  });
};

export const useCreateOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateOrderRequest) => ordersService.createOrder(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myOrders'] });
    },
  });
};