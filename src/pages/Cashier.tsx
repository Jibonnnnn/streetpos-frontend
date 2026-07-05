import { useEffect, useState } from 'react';
import api from '@/lib/api';
import type { MenuItem, CartItem, ModifierGroup, OrderResponse } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CreditCard, Loader2, X, RefreshCw, AlertTriangle } from 'lucide-react';
import { Toaster, toast } from 'sonner';

type PaymentMethod = 'Cash' | 'GCash' | 'Maya' | 'Card';

export default function CashierPage() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [myOrders, setMyOrders] = useState<OrderResponse[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  // Modals
  const [showModifiersModal, setShowModifiersModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [currentModifiers, setCurrentModifiers] = useState<ModifierGroup[]>([]);
  const [selectedOptionIds, setSelectedOptionIds] = useState<number[]>([]);
  const [customNote, setCustomNote] = useState('');

  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod>('Cash');
  const [amountTendered, setAmountTendered] = useState('');

  const [showOrderDetail, setShowOrderDetail] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<OrderResponse | null>(null);

  const fetchMenu = async () => {
    try {
      setLoading(true);
      const res = await api.get('/menu');
      setMenuItems(res.data || []);
    } catch (err) {
      console.error('Failed to fetch menu:', err);
      toast.error("Failed to load menu items");
    } finally {
      setLoading(false);
    }
  };

  const fetchMyOrders = async () => {
    setOrdersLoading(true);
    try {
      const res = await api.get('/orders/my-orders');
      setMyOrders(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Failed to fetch orders:', err);
    } finally {
      setOrdersLoading(false);
    }
  };

  useEffect(() => {
    fetchMenu();
    fetchMyOrders();
  }, []);

  const openModifiersModal = async (item: MenuItem) => {
    const hasLowStock = item.inventoryLinks?.some(link => link.quantityUsedPerUnit > 5);
    if (hasLowStock) {
      if (!confirm(`Warning: Some ingredients for ${item.name} might be low in stock. Continue?`)) {
        return;
      }
    }

    setSelectedItem(item);
    setSelectedOptionIds([]);
    setCustomNote('');

    try {
      const res = await api.get(`/menu/${item.id}`);
      setCurrentModifiers(res.data?.modifierGroups || []);
    } catch (e) {
      console.error(e);
      setCurrentModifiers([]);
    }
    setShowModifiersModal(true);
  };

  const toggleOption = (optionId: number) => {
    setSelectedOptionIds(prev =>
      prev.includes(optionId) ? prev.filter(id => id !== optionId) : [...prev, optionId]
    );
  };

  const calculatePrice = (basePrice: number) => {
    let extra = 0;
    currentModifiers.forEach(group => {
      group.options.forEach(option => {
        if (selectedOptionIds.includes(option.id)) {
          extra += option.priceAdjustment || 0;
        }
      });
    });
    return basePrice + extra;
  };

  const addToCart = () => {
    if (!selectedItem) return;

    const finalPrice = calculatePrice(selectedItem.price);
    const cartItem: CartItem = {
      ...selectedItem,
      quantity: 1,
      selectedModifierOptionIds: [...selectedOptionIds],
      note: customNote.trim() || undefined,
      itemTotal: finalPrice
    };

    setCart(prev => [...prev, cartItem]);
    setTotal(prev => prev + finalPrice);
    setShowModifiersModal(false);
    toast.success(`${selectedItem.name} added to order`);
  };

  const removeFromCart = (index: number) => {
    const item = cart[index];
    setCart(prev => prev.filter((_, i) => i !== index));
    setTotal(prev => prev - item.itemTotal);
  };

  const openCheckout = () => {
    if (cart.length === 0) {
      toast.error("Cart is empty");
      return;
    }
    setAmountTendered('');
    setSelectedPaymentMethod('Cash');
    setShowCheckoutModal(true);
  };

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setCheckoutLoading(true);

    const orderPayload = {
      tableNumber: "T1",
      customerNotes: "",
      items: cart.map(item => ({
        menuItemId: item.id,
        quantity: item.quantity,
        selectedModifierOptionIds: item.selectedModifierOptionIds,
        itemNotes: item.note || ""
      }))
    };

    try {
      const createRes = await api.post('/orders', orderPayload);
      const orderId = createRes.data?.id;

      const checkoutPayload = {
        orderId,
        paymentMethod: selectedPaymentMethod,
        amountTendered: selectedPaymentMethod === 'Cash' ? parseFloat(amountTendered) || undefined : undefined,
        transactionId: selectedPaymentMethod !== 'Cash' ? `TX-${Date.now()}` : undefined,
        notes: ""
      };

      await api.post('/orders/checkout', checkoutPayload);

      toast.success("✅ Order completed successfully!", {
        description: "Inventory has been automatically deducted.",
      });

      await fetchMenu();
      setCart([]);
      setTotal(0);
      setShowCheckoutModal(false);
      fetchMyOrders();
    } catch (err: any) {
      const message = err.response?.data?.message || "Checkout failed. Please try again.";
      toast.error(message);
    } finally {
      setCheckoutLoading(false);
    }
  };

  const filteredMenu = menuItems.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const changeDue = selectedPaymentMethod === 'Cash' && amountTendered
    ? Math.max(0, parseFloat(amountTendered) - total)
    : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[70vh]">
        <Loader2 className="w-10 h-10 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-screen-2xl mx-auto">
      <Toaster position="top-center" richColors closeButton />

      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold tracking-tight">POS Terminal</h1>
        <Input
          placeholder="Search menu items..."
          className="max-w-md"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Menu Items Grid */}
        <div className="lg:col-span-7">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredMenu.map(item => {
              const hasLowStock = item.inventoryLinks?.some(link => link.quantityUsedPerUnit > 5);
              return (
                <div
                  key={item.id}
                  className="bg-white dark:bg-zinc-900 rounded-3xl overflow-hidden border cursor-pointer hover:shadow-xl transition-all active:scale-[0.985]"
                  onClick={() => openModifiersModal(item)}
                >
                  <div className="h-52 bg-zinc-100 dark:bg-zinc-800 relative">
                    {item.imageUrl && (
                      <img
                        src={`http://localhost:5032${item.imageUrl}`}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    )}
                    {hasLowStock && (
                      <div className="absolute top-4 left-4 bg-amber-500 text-white px-3 py-1 rounded-full text-xs flex items-center gap-1">
                        <AlertTriangle size={14} /> Low Stock
                      </div>
                    )}
                  </div>
                  <div className="p-5">
                    <h3 className="font-semibold text-xl">{item.name}</h3>
                    <p className="text-2xl font-bold text-amber-600 mt-1">₱{item.price.toFixed(2)}</p>
                    {item.inventoryLinks?.length > 0 && (
                      <p className="text-xs text-zinc-500 mt-2">
                        {item.inventoryLinks.map(l => l.inventoryItemName).join(', ')}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-5 space-y-6">
          {/* Current Order */}
          <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 shadow-sm">
            <h2 className="text-2xl font-semibold mb-6">Current Order</h2>
            
            <div className="min-h-[320px] max-h-[420px] overflow-auto pr-2 space-y-4">
              {cart.length === 0 ? (
                <div className="text-center py-20 text-zinc-500">
                  Your cart is empty.<br />Tap items to add.
                </div>
              ) : (
                cart.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-start bg-zinc-50 dark:bg-zinc-800 p-4 rounded-2xl">
                    <div className="flex-1">
                      <p className="font-medium">{item.name}</p>
                      {item.note && <p className="text-xs text-zinc-500 mt-1">Note: {item.note}</p>}
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">₱{item.itemTotal.toFixed(2)}</p>
                      <button 
                        onClick={() => removeFromCart(idx)}
                        className="text-red-500 text-sm hover:underline mt-1"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="mt-8 border-t pt-6">
              <div className="flex justify-between items-center text-3xl font-bold mb-6">
                <span>Total</span>
                <span>₱{total.toFixed(2)}</span>
              </div>
              <Button 
                onClick={openCheckout} 
                className="w-full py-7 text-lg font-semibold"
                disabled={cart.length === 0}
              >
                <CreditCard className="mr-3 w-6 h-6" />
                Proceed to Checkout
              </Button>
            </div>
          </div>

          {/* Recent Orders */}
          <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold">Recent Orders</h2>
              <Button variant="ghost" size="sm" onClick={fetchMyOrders} disabled={ordersLoading}>
                <RefreshCw className={`w-4 h-4 ${ordersLoading ? 'animate-spin' : ''}`} />
              </Button>
            </div>

            <div className="space-y-3 max-h-[300px] overflow-auto">
              {ordersLoading ? (
                <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin" /></div>
              ) : myOrders.length === 0 ? (
                <div className="text-center py-12 text-zinc-500">No recent orders yet.</div>
              ) : (
                myOrders.slice(0, 4).map((order) => (
                  <div
                    key={order.id}
                    className="bg-zinc-50 dark:bg-zinc-800 p-4 rounded-2xl cursor-pointer hover:bg-amber-50 transition-all"
                    onClick={() => {
                      setSelectedOrder(order);
                      setShowOrderDetail(true);
                    }}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-mono font-medium">{order.orderNumber}</div>
                        <div className="text-xs text-zinc-500 mt-1">
                          {new Date(order.createdAt).toLocaleString([], { 
                            month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' 
                          })}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">₱{order.total.toFixed(2)}</div>
                        <div className={`text-xs px-3 py-1 rounded-full inline-block mt-2 ${order.status === 'Completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                          {order.status}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modifiers Modal */}
      {showModifiersModal && selectedItem && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl w-full max-w-md max-h-[90vh] overflow-auto">
            <div className="p-8">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-semibold">{selectedItem.name}</h2>
                  <p className="text-zinc-500">Base: ₱{selectedItem.price}</p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setShowModifiersModal(false)}>
                  <X className="w-5 h-5" />
                </Button>
              </div>

              <div className="space-y-8">
                {currentModifiers.map(group => (
                  <div key={group.id}>
                    <h3 className="font-medium mb-3">{group.name} {group.isRequired && <span className="text-red-500">(Required)</span>}</h3>
                    <div className="grid grid-cols-2 gap-3">
                      {group.options.map(option => (
                        <label key={option.id} className="flex items-center gap-3 border rounded-2xl p-4 cursor-pointer hover:bg-amber-50">
                          <input type="checkbox" checked={selectedOptionIds.includes(option.id)} onChange={() => toggleOption(option.id)} />
                          <div>
                            <div>{option.name}</div>
                            {option.priceAdjustment > 0 && <div className="text-emerald-600 text-xs">+₱{option.priceAdjustment}</div>}
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8">
                <label className="block text-sm font-medium mb-2">Special Requests</label>
                <Input placeholder="No ice, extra sugar..." value={customNote} onChange={(e) => setCustomNote(e.target.value)} />
              </div>

              <div className="flex gap-3 mt-8">
                <Button onClick={addToCart} className="flex-1 py-7 text-lg">
                  Add - ₱{calculatePrice(selectedItem.price).toFixed(2)}
                </Button>
                <Button variant="outline" className="flex-1 py-7" onClick={() => setShowModifiersModal(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Checkout Modal */}
      {showCheckoutModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl w-full max-w-md">
            <div className="p-8">
              <h2 className="text-2xl font-semibold mb-6">Complete Payment</h2>
              <div className="text-5xl font-bold text-center mb-8">₱{total.toFixed(2)}</div>

              <div className="space-y-4 mb-8">
                {(['Cash', 'GCash', 'Maya', 'Card'] as PaymentMethod[]).map(method => (
                  <Button
                    key={method}
                    variant={selectedPaymentMethod === method ? "default" : "outline"}
                    className="w-full h-14 justify-start"
                    onClick={() => setSelectedPaymentMethod(method)}
                  >
                    {method}
                  </Button>
                ))}
              </div>

              {selectedPaymentMethod === 'Cash' && (
                <div className="mb-6">
                  <label className="block text-sm font-medium mb-2">Amount Tendered</label>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={amountTendered}
                    onChange={(e) => setAmountTendered(e.target.value)}
                    className="text-3xl py-6"
                  />
                  {changeDue > 0 && <p className="text-emerald-600 mt-2">Change: ₱{changeDue.toFixed(2)}</p>}
                </div>
              )}

              <div className="flex gap-3">
                <Button onClick={handleCheckout} disabled={checkoutLoading || (selectedPaymentMethod === 'Cash' && !amountTendered)} className="flex-1 py-7 text-lg">
                  {checkoutLoading && <Loader2 className="animate-spin mr-2" />}
                  Confirm Payment
                </Button>
                <Button variant="outline" className="flex-1 py-7" onClick={() => setShowCheckoutModal(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Order Detail Modal */}
      {showOrderDetail && selectedOrder && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl w-full max-w-lg max-h-[90vh] overflow-auto">
            <div className="p-8">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-semibold">Order Details</h2>
                  <p className="font-mono text-sm text-zinc-500">{selectedOrder.orderNumber}</p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setShowOrderDetail(false)}>
                  <X className="w-5 h-5" />
                </Button>
              </div>
              {/* Order details content */}
              <Button className="w-full mt-8" onClick={() => setShowOrderDetail(false)}>Close</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}