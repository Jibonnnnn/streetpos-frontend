import { useEffect, useState } from 'react';
import { menuService } from '@/services/menu.service';

interface MenuItem {
  id: number;
  name: string;
  description?: string;
  price: number;
  imageUrl?: string;
  category: string;
}

export default function LandingPage() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch menu data from your API
    const fetchMenu = async () => {
      try {
        const res = await menuService.getMenu();
        setMenuItems(res.data);
      } catch (error) {
        console.error('Failed to fetch menu:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchMenu();
  }, []);

  return (
    <div className="flex flex-col min-h-screen font-sans bg-gradient-to-br from-amber-50 via-orange-50 to-amber-50 text-zinc-800">
      
      {/* Header */}
      <header className="flex justify-between items-center p-6 bg-white shadow-lg sticky top-0 z-50 backdrop-blur-lg bg-opacity-70">
        <h1 className="text-3xl font-bold text-orange-600 tracking-tight">Streetside Café</h1>
        <nav className="space-x-6 text-sm font-medium text-zinc-600">
          <a href="#menu" className="hover:underline">Menu</a>
          <a href="#about" className="hover:underline">About</a>
          <a href="#contact" className="hover:underline">Contact</a>
        </nav>
        <button className="bg-brown-600 text-white px-4 py-2 rounded shadow hover:bg-brown-700">Order Now</button>
      </header>

      {/* Hero Section */}
      <section className="flex-1 flex flex-col justify-center items-center p-10 bg-gradient-to-br from-orange-100 via-yellow-100 to-orange-100 text-center">
        <h2 className="text-4xl md:text-5xl font-extrabold mb-4 text-orange-600">Good coffee. Good food. Good vibes.</h2>
        <p className="max-w-2xl text-lg mb-6 text-zinc-700">Order ahead for pickup or enjoy delivery. Freshly brewed, straight from our kitchen to your hands.</p>
        <button className="bg-brown-600 text-white px-8 py-4 rounded-full shadow-lg hover:bg-brown-700 text-lg font-semibold">
          Order Now
        </button>
      </section>

      {/* Menu Section */}
      <section id="menu" className="p-10 bg-white">
        <h3 className="text-3xl font-semibold mb-8 text-center text-orange-600">Our Menu</h3>
        {loading ? (
          <p className="text-center text-lg text-zinc-500">Loading menu...</p>
        ) : (
          <div className="grid md:grid-cols-3 gap-8">
            {menuItems.map((item) => (
              <div key={item.id} className="border rounded-lg p-4 shadow hover:shadow-xl transition duration-300 bg-white">
                {item.imageUrl ? (
                  <img src={item.imageUrl} alt={item.name} className="w-full h-48 object-cover rounded mb-4" />
                ) : (
                  <div className="w-full h-48 bg-zinc-200 flex items-center justify-center rounded mb-4 text-lg text-zinc-400">No Image</div>
                )}
                <h4 className="text-xl font-semibold mb-2">{item.name}</h4>
                <p className="text-zinc-600 mb-2">{item.description}</p>
                <div className="flex justify-between items-center">
                  <span className="font-bold text-xl">₱{item.price.toFixed(2)}</span>
                  <button className="bg-brown-600 text-white px-3 py-1 rounded hover:bg-brown-700 text-sm">
                    Order
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* About Us Section */}
      <section id="about" className="p-10 bg-orange-50 text-center">
        <h3 className="text-3xl font-semibold mb-4 text-orange-600">About Streetside Café</h3>
        <p className="max-w-3xl mx-auto text-zinc-700 mb-6">
          We serve the best coffee and food in town. Our cozy ambiance and friendly staff make every visit memorable. Come and experience our signature brews and hearty meals.
        </p>
        <button className="bg-brown-600 text-white px-6 py-3 rounded-full shadow hover:bg-brown-700 font-semibold">
          Learn More
        </button>
      </section>

      {/* Contact Footer */}
      <footer className="bg-zinc-800 text-white p-6 mt-auto">
        <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-4 text-sm">
          <div>
            <h5 className="font-semibold mb-2">Visit Us</h5>
            <p>23 Mabini St. cor. Osmena St.<br />Biasong, Dipolog City<br />7100 Zamboanga del Norte</p>
          </div>
          <div>
            <h5 className="font-semibold mb-2">Hours</h5>
            <p>Mon–Fri: 7AM – 9PM<br />Sat: 8AM – 10PM<br />Sun: 9AM – 8PM</p>
          </div>
          <div>
            <h5 className="font-semibold mb-2">Follow Us</h5>
            {/* Social icons can go here */}
            <div className="flex space-x-4 mt-2">
              {/* Example icons/links */}
            </div>
          </div>
        </div>
        <p className="mt-4 text-center">&copy; 2025 Streetside Café. All rights reserved.</p>
      </footer>
    </div>
  );
}