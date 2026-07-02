import { useEffect, useState } from 'react';
import api from '@/lib/api';
import type { MenuItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Trash2, CreditCard, Loader2, RefreshCw, X } from 'lucide-react';

export default function CashierPage() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [cart, setCart] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modifiers Modal
  const [showModifiersModal, setShowModifiersModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [selectedModifiers, setSelectedModifiers] = useState<string[]>([]);
  const [customNote, setCustomNote] = useState('');

  const fetchMenu = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get('/menu');
      setMenuItems(res.data || []);
    } catch (err: any) {
      setError("Cannot connect to backend. Is the server running?");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMenu();
  }, []);

  const openModifiersModal = (item: MenuItem) => {
    setSelectedItem(item);
    setSelectedModifiers(item.modifiers || []);
    setCustomNote('');
    setShowModifiersModal(true);
  };

  const addToCartWithModifiers = () => {
    if (!selectedItem) return;

    const cartItem = {
      ...selectedItem,
      quantity: 1,
      modifiers: selectedModifiers,
      note: customNote.trim()
    };

    setCart(prev => [...prev, cartItem]);
    setTotal(prev => prev + selectedItem.price);
    setShowModifiersModal(false);
  };

  const removeFromCart = (index: number) => {
    const item = cart[index];
    setCart(prev => prev.filter((_, i) => i !== index));
    setTotal(prev => prev - item.price * item.quantity);
  };

  const checkout = () => {
    if (cart.length === 0) return;
    alert(`✅ Order placed successfully!\nTotal: ₱${total.toFixed(2)}`);
    setCart([]);
    setTotal(0);
  };

  const filteredMenu = menuItems.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.category && item.category.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getImageUrl = (item: MenuItem): string | null => {
    if (!item.imageUrl) return null;
    if (item.imageUrl.startsWith('http')) return item.imageUrl;
    return `http://localhost:5032${item.imageUrl.startsWith('/') ? '' : '/'}${item.imageUrl}`;
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
      <div className="flex flex-col items-center justify-center h-[70vh] text-center px-6">
        <p className="text-red-600 font-medium mb-2">Failed to load menu</p>
        <p className="text-zinc-500 mb-6">{error}</p>
        <Button onClick={fetchMenu} className="gap-2">
          <RefreshCw className="w-4 h-4" /> Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-[calc(100vh-120px)]">
      {/* Menu Section */}
      <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 overflow-auto">
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
              className="border border-zinc-200 dark:border-zinc-700 rounded-3xl p-4 cursor-pointer hover:border-amber-600 hover:shadow-xl transition-all active:scale-[0.985]"
              onClick={() => openModifiersModal(item)}
            >
              <div className="h-40 bg-zinc-100 dark:bg-zinc-800 rounded-2xl mb-4 overflow-hidden relative">
                {getImageUrl(item) ? (
                  <img src={getImageUrl(item)!} alt={item.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-6xl opacity-30">☕</div>
                )}
                <div className="absolute bottom-3 right-3 bg-black/70 text-white text-xs px-3 py-1 rounded-full">₱{item.price.toFixed(2)}</div>
              </div>
              <h3 className="font-semibold">{item.name}</h3>
              <p className="text-sm text-zinc-500">{item.category}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Cart Section */}
      <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 flex flex-col">
        <h2 className="text-2xl font-semibold mb-6">Current Order</h2>
        
        <div className="flex-1 overflow-auto space-y-4 pr-2">
          {cart.length === 0 ? (
            <div className="text-center py-20 text-zinc-500">
              Your cart is empty.<br />Tap items to add.
            </div>
          ) : (
            cart.map((item, idx) => (
              <div key={idx} className="bg-zinc-50 dark:bg-zinc-800 p-4 rounded-2xl">
                <div className="flex justify-between">
                  <div>
                    <p className="font-medium">{item.name}</p>
                    {item.modifiers && item.modifiers.length > 0 && (
                      <p className="text-xs text-amber-600">+ {item.modifiers.join(", ")}</p>
                    )}
                    {item.note && <p className="text-xs text-zinc-500 mt-1">Note: {item.note}</p>}
                  </div>
                  <p className="font-semibold">₱{(item.price * item.quantity).toFixed(2)}</p>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-red-500 mt-2" 
                  onClick={() => removeFromCart(idx)}
                >
                  Remove
                </Button>
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

      {/* Modifiers Modal */}
      {showModifiersModal && selectedItem && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl w-full max-w-md">
            <div className="p-8">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-semibold">{selectedItem.name}</h2>
                  <p className="text-zinc-500">₱{selectedItem.price.toFixed(2)}</p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setShowModifiersModal(false)}>
                  <X className="w-5 h-5" />
                </Button>
              </div>

              {selectedItem.modifiers && selectedItem.modifiers.length > 0 && (
                <div className="mb-6">
                  <h3 className="font-medium mb-3">Modifiers / Add-ons</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {selectedItem.modifiers.map((mod, i) => (
                      <label key={i} className="flex items-center gap-2 border rounded-xl p-3 cursor-pointer hover:bg-zinc-50">
                        <input 
                          type="checkbox" 
                          checked={selectedModifiers.includes(mod)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedModifiers([...selectedModifiers, mod]);
                            } else {
                              setSelectedModifiers(selectedModifiers.filter(m => m !== mod));
                            }
                          }}
                        />
                        <span>{mod}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-2">Special Requests / Notes</label>
                <Input 
                  placeholder="No ice, extra sugar, etc."
                  value={customNote}
                  onChange={(e) => setCustomNote(e.target.value)}
                />
              </div>

              <div className="flex gap-3 mt-8">
                <Button onClick={addToCartWithModifiers} className="flex-1">
                  Add to Order
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