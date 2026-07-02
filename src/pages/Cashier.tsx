import { useEffect, useState } from "react";
import api from "@/lib/api";
import type { MenuItem } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, CreditCard, AlertCircle, Loader2 } from "lucide-react";

export default function CashierPage() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [cart, setCart] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load menu on mount
  useEffect(() => {
    const fetchMenu = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await api.get("/menu");
        setMenuItems(res.data || []);
      } catch (err: any) {
        console.error("Failed to load menu:", err);
        setError(
          err.response?.data?.message ||
            "Failed to load menu items. Please check your connection.",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchMenu();
  }, []);

  const addToCart = (item: MenuItem) => {
    setCart((prev) => [...prev, { ...item, quantity: 1 }]);
    setTotal((prev) => prev + item.price);
  };

  const removeFromCart = (index: number) => {
    const item = cart[index];
    setCart((prev) => prev.filter((_, i) => i !== index));
    setTotal((prev) => prev - item.price * item.quantity);
  };

  const checkout = () => {
    if (cart.length === 0) return;
    alert(
      `✅ Checkout successful!\nTotal: $${total.toFixed(2)}\n\n(Real payment + order creation would happen here)`,
    );
    setCart([]);
    setTotal(0);
  };

  const filteredMenu = menuItems.filter(
    (item) =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  // Get full image URL
  const getImageUrl = (item: MenuItem): string | null => {
    if (!item.imageUrl) return null;
    if (item.imageUrl.startsWith("http")) return item.imageUrl;
    return `http://localhost:5032${item.imageUrl.startsWith("/") ? "" : "/"}${item.imageUrl}`;
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh]">
        <Loader2 className="w-10 h-10 animate-spin text-amber-600 mb-4" />
        <p className="text-zinc-500">Loading menu...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] text-center">
        <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
        <p className="text-red-600 font-medium mb-2">Failed to load menu</p>
        <p className="text-zinc-500 max-w-md">{error}</p>
        <Button onClick={() => window.location.reload()} className="mt-6">
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-[calc(100vh-120px)]">
      {/* Menu Section */}
      <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 overflow-auto">
        <div className="flex justify-between items-center mb-6 sticky top-0 bg-white dark:bg-zinc-900 z-10 pb-4">
          <h1 className="text-3xl font-bold">POS Terminal</h1>
          <Input
            placeholder="Search menu..."
            className="max-w-xs"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {filteredMenu.length === 0 ? (
          <div className="text-center py-20 text-zinc-500">
            No menu items found.
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {filteredMenu.map((item) => (
              <div
                key={item.id}
                className="border border-zinc-200 dark:border-zinc-700 rounded-3xl p-4 cursor-pointer hover:border-amber-600 hover:shadow-xl transition-all active:scale-[0.985]"
                onClick={() => addToCart(item)}
              >
                <div className="h-40 bg-zinc-100 dark:bg-zinc-800 rounded-2xl mb-4 overflow-hidden relative">
                  {getImageUrl(item) ? (
                    <img
                      src={getImageUrl(item)!}
                      alt={item.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-6xl opacity-30">
                      ☕
                    </div>
                  )}

                  <div className="absolute bottom-3 right-3 bg-black/70 text-white text-xs px-3 py-1 rounded-full font-medium">
                    ${item.price}
                  </div>
                </div>

                <h3 className="font-semibold text-lg leading-tight">
                  {item.name}
                </h3>
                <p className="text-sm text-zinc-500 mt-1">{item.category}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Cart / Checkout */}
      <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 flex flex-col">
        <h2 className="text-2xl font-semibold mb-6">Current Order</h2>

        <div className="flex-1 overflow-auto space-y-4 pr-2">
          {cart.length === 0 ? (
            <div className="text-center py-20 text-zinc-500">
              Your cart is empty.
              <br />
              Tap items on the left to add.
            </div>
          ) : (
            cart.map((item, idx) => (
              <div
                key={idx}
                className="flex justify-between items-center bg-zinc-50 dark:bg-zinc-800 p-4 rounded-2xl"
              >
                <div className="flex-1">
                  <p className="font-medium">{item.name}</p>
                  <p className="text-sm text-zinc-500">Qty: {item.quantity}</p>
                </div>
                <div className="flex items-center gap-4">
                  <p className="font-semibold text-lg">
                    ${(item.price * item.quantity).toFixed(2)}
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFromCart(idx)}
                    className="text-red-500 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="border-t pt-6 mt-auto">
          <div className="flex justify-between items-end text-4xl font-bold mb-6">
            <span className="text-xl text-zinc-500">Total</span>
            <span>${total.toFixed(2)}</span>
          </div>

          <Button
            onClick={checkout}
            className="w-full py-8 text-lg font-semibold"
            disabled={cart.length === 0}
          >
            <CreditCard className="mr-3 w-6 h-6" />
            Complete Payment
          </Button>
        </div>
      </div>
    </div>
  );
}
