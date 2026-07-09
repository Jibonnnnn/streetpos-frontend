import { CartProvider } from "@/contexts/CartContext";
import { Toaster } from "sonner";

type AppProvidersProps = {
  children: React.ReactNode;
};

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <CartProvider>
      <Toaster position="top-center" richColors closeButton />
      {children}
    </CartProvider>
  );
}