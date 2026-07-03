import { useEffect, useState } from 'react';
import api from '@/lib/api';
import type { MenuItem, CartItem, ModifierGroup } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CreditCard, Loader2, X, RefreshCw } from 'lucide-react';

export default function CashierPage() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [myOrders, setMyOrders] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [ordersLoading, setOrdersLoading] = useState(false);

  // Modifiers Modal
  const [showModifiersModal, setShowModifiersModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [currentModifiers, setCurrentModifiers] = useState<ModifierGroup[]>([]);
  const [selectedOptionIds, setSelectedOptionIds] = useState<number[]>([]);
  const [customNote, setCustomNote] = useState('');

  const fetchMenu = async () => {
    try {
      setLoading(true);
      const res = await api.get('/menu');
      setMenuItems(res.data || []);
    } catch (err: any) {
      console.error("Cannot connect to backend.");
    } finally {
      setLoading(false);
    }
  };

  const fetchMyOrders = async () => {
    setOrdersLoading(true);
    try {
      const res = await api.get('/orders/my-orders');
      setMyOrders(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setOrdersLoading(false);
    }
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
      setCurrentModifiers(res.data.modifierGroups || []);
    } catch (e) {
      setCurrentModifiers([]);
    }

    setShowModifiersModal(true);
  };

  const toggleOption = (optionId: number) => {
    setSelectedOptionIds(prev =>
      prev.includes(optionId)
        ? prev.filter(id => id !== optionId)
        : [...prev, optionId]
    );
  };

  const calculatePrice = (basePrice: number) => {
    let extra = 0;
    currentModifiers.forEach(group => {
      group.options.forEach(option => {
        if (selectedOptionIds.includes(option.id)) {
          extra += option.priceAdjustment;
        }
      });
    });
    return basePrice + extra;
  };

  const addToCart = () => {
    if (!selectedItem) return;

    const price = calculatePrice(selectedItem.price);

    const cartItem: CartItem = {
      ...selectedItem,
      quantity: 1,
      selectedModifierOptionIds: [...selectedOptionIds],
      note: customNote.trim(),
      itemTotal: price
    };

    setCart(prev => [...prev, cartItem]);
    setTotal(prev => prev + price);
    setShowModifiersModal(false);
  };

  const removeFromCart = (index: number) => {
    const item = cart[index];
    setCart(prev => prev.filter((_, i) => i !== index));
    setTotal(prev => prev - item.itemTotal);
  };

  const checkout = async () => {
    if (cart.length === 0) return;

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
      await api.post('/orders', orderPayload);
      alert(`✅ Order placed! Total: ₱${total.toFixed(2)}`);
      setCart([]);
      setTotal(0);
      fetchMyOrders(); // Refresh
    } catch (err) {
      alert("Failed to place order");
      console.error(err);
    }
  };

  const filteredMenu = menuItems.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh]">
        <Loader2 className="w-10 h-10 animate-spin text-amber-600 mb-4" />
        <p className="text-zinc-500">Loading menu...</p>
      </div>
    );
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
              <div className="text-center py-20 text-zinc-500">
                Your cart is empty.<br />Tap items to add.
              </div>
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

        {/* My Recent Orders */}
        <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 flex flex-col h-1/2">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold">Recent Orders</h2>
            <Button variant="ghost" size="sm" onClick={fetchMyOrders} disabled={ordersLoading}>
              <RefreshCw className={`w-4 h-4 ${ordersLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
          
          <div className="flex-1 overflow-auto space-y-3">
            {myOrders.length === 0 ? (
              <p className="text-center text-zinc-500 py-10">No orders yet</p>
            ) : (
              myOrders.slice(0, 5).map(order => (
                <div key={order.id} className="bg-zinc-50 dark:bg-zinc-800 p-4 rounded-2xl text-sm">
                  <div className="flex justify-between">
                    <span className="font-mono">{order.orderNumber}</span>
                    <span className="font-semibold">₱{order.total}</span>
                  </div>
                  <div className="text-zinc-500 mt-1">
                    {order.status} • {new Date(order.createdAt).toLocaleTimeString()}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Enhanced Modifiers Modal */}
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
                {currentModifiers.length === 0 ? (
                  <p className="text-center text-zinc-500 py-8">No modifiers available</p>
                ) : (
                  currentModifiers.map(group => (
                    <div key={group.id}>
                      <h3 className="font-medium mb-3">{group.name}</h3>
                      <div className="grid grid-cols-2 gap-3">
                        {group.options.map(option => (
                          <label 
                            key={option.id}
                            className="flex items-center gap-3 border rounded-2xl p-4 cursor-pointer hover:bg-amber-50 transition-all"
                          >
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
                  ))
                )}
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
    </div>
  );
}