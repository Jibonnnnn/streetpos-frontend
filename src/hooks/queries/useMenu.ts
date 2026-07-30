import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { menuService } from '@/services/menu.service';

export const useMenuItems = () => {
  return useQuery({
    queryKey: ['menu'],
    queryFn: async () => {
      const res = await menuService.getMenu();
      return res.data || [];
    },
  });
};

export const useCreateMenuItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: menuService.createMenuItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menu'] });
    },
  });
};