import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { CartItem } from '@/types';

interface CartContextType {
  cart: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (index: number) => void;
  updateQuantity: (index: number, newQuantity: number) => void;
  clearCart: () => void;
  total: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('streetpos_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const addToCart = (item: CartItem) => {
    setCart((prev) => [...prev, item]);
  };

  const removeFromCart = (index: number) => {
    setCart((prev) => prev.filter((_, i) => i !== index));
  };

  const updateQuantity = (index: number, newQuantity: number) => {
    if (newQuantity < 1) return;

    setCart((prev) => {
      const item = prev[index];
      if (!item) return prev;

      const unitPrice = item.quantity > 0 ? item.itemTotal / item.quantity : item.itemTotal;

      const updated = [...prev];
      updated[index] = {
        ...item,
        quantity: newQuantity,
        itemTotal: Math.round(unitPrice * newQuantity * 100) / 100,
      };

      return updated;
    });
  };

  const clearCart = () => setCart([]);

  useEffect(() => {
    try {
      localStorage.setItem('streetpos_cart', JSON.stringify(cart));
    } catch {
      // ignore
    }
  }, [cart]);

  const total = Math.round(cart.reduce((sum, item) => sum + item.itemTotal, 0) * 100) / 100;

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        total,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within CartProvider');
  return context;
};