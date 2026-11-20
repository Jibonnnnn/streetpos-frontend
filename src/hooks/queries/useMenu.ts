import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { menuService } from '@/services/menu.service';
import { loadMenuCache, saveMenuCache } from '@/lib/offline/menuCache';

export const useMenuItems = () => {
  return useQuery({
    queryKey: ['menu'],
    queryFn: async () => {
      try {
        const res = await menuService.getMenu();
        const items = res.data || [];
        if (items.length) void saveMenuCache(items);
        return items;
      } catch {
        const cached = await loadMenuCache();
        return cached || [];
      }
    },
    // Keep serving cached data while offline
    placeholderData: (prev) => prev,
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