import { useEffect, useState } from 'react';
import api from '@/lib/api';
import type { MenuItem, CartItem, ModifierGroup } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CreditCard, Loader2, X, RefreshCw, Eye } from 'lucide-react';

type PaymentMethod = 'Cash' | 'GCash' | 'Maya' | 'Card';

export default function CashierPage() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [myOrders, setMyOrders] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [ordersLoading, setOrdersLoading] = useState(false);

  // Modals
  const [showModifiersModal, setShowModifiersModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [currentModifiers, setCurrentModifiers] = useState<ModifierGroup[]>([]);
  const [selectedOptionIds, setSelectedOptionIds] = useState<number[]>([]);
  const [customNote, setCustomNote] = useState('');

  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod>('Cash');
  const [amountTendered, setAmountTendered] = useState('');
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  const [showOrderDetail, setShowOrderDetail] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  const fetchMenu = async () => {
    try {
      setLoading(true);
      const res = await api.get('/menu');
      setMenuItems(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMyOrders = async () => {
    setOrdersLoading(true);
    try {
      const res = await api.get('/orders/my-orders');
      let ordersData = res.data;

      if (Array.isArray(ordersData)) setMyOrders(ordersData);
      else if (ordersData?.orders && Array.isArray(ordersData.orders)) setMyOrders(ordersData.orders);
      else if (ordersData?.data && Array.isArray(ordersData.data)) setMyOrders(ordersData.data);
      else setMyOrders([]);
    } catch (err) {
      console.error(err);
      setMyOrders([]);
    } finally {
      setOrdersLoading(false);
    }
  };

  const getOrderTotal = (order: any): number => {
    if (!order) return 0;
    const candidates = [order.total, order.Total, order.grandTotal, order.amount, order.subtotal];
    for (const val of candidates) {
      if (typeof val === 'number') return val;
      if (typeof val === 'string') {
        const parsed = parseFloat(val);
        if (!isNaN(parsed)) return parsed;
      }
    }
    return 0;
  };

  const getItemName = (item: any, allMenuItems: MenuItem[]) => {
    if (item.menuItemName) return item.menuItemName;
    if (item.name) return item.name;

    // Try to match by ID
    const menuItem = allMenuItems.find(m => 
      m.id === item.menuItemId || 
      m.id === item.MenuItemId || 
      m.id === item.menuItem?.id
    );
    return menuItem?.name || `Item #${item.menuItemId || item.id || 'Unknown'}`;
  };

  const openOrderDetail = (order: any) => {
    setSelectedOrder(order);
    setShowOrderDetail(true);
  };

  useEffect(() => {
    fetchMenu();
    fetchMyOrders();
  }, []);

  const openModifiersModal = async (item: MenuItem) => {
    setSelectedItem(item);
    setSelectedOptionIds([]);
    setCustomNote('');
    try {
      const res = await api.get(`/menu/${item.id}`);
      setCurrentModifiers(res.data?.modifierGroups || []);
    } catch (e) {
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
        if (selectedOptionIds.includes(option.id)) extra += option.priceAdjustment || 0;
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
      note: customNote.trim(),
      itemTotal: finalPrice
    };
    setCart(prev => [...prev, cartItem]);
    setTotal(prev => prev + finalPrice);
    setShowModifiersModal(false);
  };

  const removeFromCart = (index: number) => {
    const item = cart[index];
    setCart(prev => prev.filter((_, i) => i !== index));
    setTotal(prev => prev - item.itemTotal);
  };

  const openCheckout = () => {
    if (cart.length === 0) return;
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
      const orderId = createRes.data?.id || createRes.data?.order?.id;

      const checkoutPayload = {
        orderId,
        paymentMethod: selectedPaymentMethod,
        amountTendered: selectedPaymentMethod === 'Cash' ? parseFloat(amountTendered) || undefined : undefined,
        transactionId: selectedPaymentMethod !== 'Cash' ? `TX-${Date.now()}` : undefined
      };

      await api.post('/orders/checkout', checkoutPayload);
      alert("✅ Order completed successfully!");
      setCart([]);
      setTotal(0);
      setShowCheckoutModal(false);
      fetchMyOrders();
    } catch (err: any) {
      alert(err.response?.data?.message || "Checkout failed.");
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
    return <div className="flex items-center justify-center h-[70vh]"><Loader2 className="w-10 h-10 animate-spin" /></div>;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-[calc(100vh-120px)]">
      {/* Menu Section */}
      <div className="lg:col-span-2 bg-white dark:bg-zinc-900 rounded-3xl p-6 overflow-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">POS Terminal</h1>
          <Input 
            placeholder="Search menu..." 
            className="max-w-xs"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          {filteredMenu.map(item => (
            <div 
              key={item.id}
              className="border border-zinc-200 dark:border-zinc-700 rounded-3xl p-4 cursor-pointer hover:border-amber-600 transition-all active:scale-[0.985]"
              onClick={() => openModifiersModal(item)}
            >
              <div className="h-40 bg-zinc-100 dark:bg-zinc-800 rounded-2xl mb-4 overflow-hidden">
                {item.imageUrl && <img src={`http://localhost:5032${item.imageUrl}`} alt={item.name} className="w-full h-full object-cover" />}
              </div>
              <h3 className="font-semibold">{item.name}</h3>
              <p className="text-sm text-zinc-500">₱{item.price}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Sidebar */}
      <div className="space-y-6">
        {/* Cart */}
        <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 flex flex-col h-1/2">
          <h2 className="text-2xl font-semibold mb-6">Current Order</h2>
          <div className="flex-1 overflow-auto space-y-4 pr-2">
            {cart.length === 0 ? (
              <div className="text-center py-20 text-zinc-500">Your cart is empty.<br />Tap items to add.</div>
            ) : (
              cart.map((item, idx) => (
                <div key={idx} className="bg-zinc-50 dark:bg-zinc-800 p-4 rounded-2xl flex justify-between items-center">
                  <div>
                    <p className="font-medium">{item.name}</p>
                    {item.note && <p className="text-xs text-zinc-500 mt-1">Note: {item.note}</p>}
                  </div>
                  <div className="flex items-center gap-4">
                    <p className="font-semibold">₱{item.itemTotal.toFixed(2)}</p>
                    <Button variant="ghost" size="sm" className="text-red-500" onClick={() => removeFromCart(idx)}>
                      Remove
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="border-t pt-6 mt-auto">
            <div className="flex justify-between text-4xl font-bold mb-6">
              <span className="text-xl text-zinc-500">Total</span>
              <span>₱{total.toFixed(2)}</span>
            </div>
            <Button onClick={openCheckout} className="w-full py-8 text-lg font-semibold" disabled={cart.length === 0}>
              <CreditCard className="mr-3 w-6 h-6" /> Proceed to Checkout
            </Button>
          </div>
        </div>

        {/* Recent Orders */}
        <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 flex flex-col h-1/2">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold">Recent Orders</h2>
            <Button variant="ghost" size="sm" onClick={fetchMyOrders} disabled={ordersLoading}>
              <RefreshCw className={`w-4 h-4 ${ordersLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
          
          <div className="flex-1 overflow-auto space-y-3 pr-2">
            {ordersLoading ? (
              <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin" /></div>
            ) : myOrders.length === 0 ? (
              <div className="text-center py-12 text-zinc-500">No orders yet.</div>
            ) : (
              myOrders.slice(0, 6).map((order) => (
                <div 
                  key={order.id} 
                  className="bg-zinc-50 dark:bg-zinc-800 p-4 rounded-2xl text-sm hover:bg-amber-50 transition-all cursor-pointer"
                  onClick={() => openOrderDetail(order)}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-mono font-medium">{order.orderNumber || `ORD-${order.id}`}</div>
                      <div className="text-xs text-zinc-500">
                        {new Date(order.createdAt || order.CreatedAt).toLocaleString([], { 
                          month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
                        })}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">₱{getOrderTotal(order).toFixed(2)}</div>
                      <div className={`text-xs capitalize mt-1 px-2 py-0.5 rounded-full inline-block ${
                        (order.status === 'Completed' || order.Status === 'Completed') 
                          ? 'bg-emerald-100 text-emerald-700' 
                          : 'bg-amber-100 text-amber-700'
                      }`}>
                        {order.status || order.Status || 'Pending'}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-zinc-500 mt-2">
                    <Eye className="w-3 h-3" /> Click to view details
                  </div>
                </div>
              ))
            )}
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
                  <p className="text-zinc-500">Base: ₱{selectedItem.price.toFixed(2)}</p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setShowModifiersModal(false)}>
                  <X className="w-5 h-5" />
                </Button>
              </div>

              <div className="space-y-8">
                {currentModifiers.map(group => (
                  <div key={group.id}>
                    <h3 className="font-medium mb-3">{group.name}</h3>
                    <div className="grid grid-cols-2 gap-3">
                      {group.options.map(option => (
                        <label key={option.id} className="flex items-center gap-3 border rounded-2xl p-4 cursor-pointer hover:bg-amber-50">
                          <input 
                            type="checkbox" 
                            checked={selectedOptionIds.includes(option.id)}
                            onChange={() => toggleOption(option.id)}
                            className="accent-amber-600"
                          />
                          <div>
                            <div>{option.name}</div>
                            {option.priceAdjustment > 0 && <div className="text-xs text-emerald-600">+₱{option.priceAdjustment}</div>}
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8">
                <label className="block text-sm font-medium mb-2">Special Requests</label>
                <Input 
                  placeholder="No ice, extra sugar, etc."
                  value={customNote}
                  onChange={(e) => setCustomNote(e.target.value)}
                />
              </div>

              <div className="flex gap-3 mt-8">
                <Button onClick={addToCart} className="flex-1">
                  Add to Order - ₱{calculatePrice(selectedItem.price).toFixed(2)}
                </Button>
                <Button variant="outline" className="flex-1" onClick={() => setShowModifiersModal(false)}>
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
              <div className="text-4xl font-bold mb-8 text-center">₱{total.toFixed(2)}</div>

              <div className="space-y-4 mb-8">
                {(['Cash', 'GCash', 'Maya', 'Card'] as PaymentMethod[]).map(method => (
                  <Button
                    key={method}
                    variant={selectedPaymentMethod === method ? "default" : "outline"}
                    className="w-full justify-start text-left h-14"
                    onClick={() => setSelectedPaymentMethod(method)}
                  >
                    {method === 'Cash' ? <CreditCard className="mr-3" /> : <CreditCard className="mr-3" />}
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
                    className="text-2xl py-6"
                  />
                  {changeDue > 0 && <p className="text-emerald-600 mt-2 font-medium">Change: ₱{changeDue.toFixed(2)}</p>}
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
                  <p className="font-mono text-sm text-zinc-500">{selectedOrder.orderNumber || `ORD-${selectedOrder.id}`}</p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setShowOrderDetail(false)}>
                  <X className="w-5 h-5" />
                </Button>
              </div>

              <div className="space-y-6">
                <div>
                  <p className="text-sm text-zinc-500">Status</p>
                  <p className="font-medium capitalize">{selectedOrder.status || selectedOrder.Status || 'Pending'}</p>
                </div>

                <div>
                  <p className="text-sm text-zinc-500">Total</p>
                  <p className="text-3xl font-bold">₱{getOrderTotal(selectedOrder).toFixed(2)}</p>
                </div>

                {selectedOrder.paymentMethod && (
                  <div>
                    <p className="text-sm text-zinc-500">Payment Method</p>
                    <p className="font-medium">{selectedOrder.paymentMethod}</p>
                  </div>
                )}

                <div>
                  <p className="text-sm text-zinc-500 mb-3">Items</p>
                  <div className="space-y-3">
                    {(selectedOrder.items || selectedOrder.orderItems || selectedOrder.OrderItems || []).map((item: any, idx: number) => (
                      <div key={idx} className="bg-zinc-50 dark:bg-zinc-800 p-4 rounded-2xl">
                        <div className="flex justify-between">
                          <span className="font-medium">{getItemName(item, menuItems)} × {item.quantity || 1}</span>
                          <span>₱{(item.subtotal || item.itemTotal || 0).toFixed(2)}</span>
                        </div>
                        {item.selectedModifiers && item.selectedModifiers.length > 0 && (
                          <div className="text-xs text-zinc-500 mt-1">
                            {item.selectedModifiers.map((m: any) => m.name).join(', ')}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <Button className="w-full mt-8" onClick={() => setShowOrderDetail(false)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}