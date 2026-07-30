import { useQuery } from '@tanstack/react-query';
import { inventoryService } from '@/services/inventory.service';

export const useInventory = () => {
  return useQuery({
    queryKey: ['inventory'],
    queryFn: async () => {
      const res = await inventoryService.getInventory();
      return res.data || [];
    },
  });
};