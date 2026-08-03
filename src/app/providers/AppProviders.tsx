import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { CartProvider } from '@/contexts/CartContext';
import { Analytics } from '@vercel/analytics/react';
import type { ReactNode } from 'react';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 10,   // 10 minutes
      retry: 2,
    },
  },
});

type AppProvidersProps = {
  children: ReactNode;
};

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <CartProvider>
        <Toaster position="top-center" richColors closeButton />
        {children}
        {/* Vercel Web Analytics — page views on production (streetsidecafe.vercel.app) */}
        <Analytics />
      </CartProvider>
    </QueryClientProvider>
  );
}
