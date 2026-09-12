import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { BadgePill } from "@/components/common/BadgePill";
import { useCart } from "@/contexts/CartContext";
import { useMenuItems } from "@/hooks/queries/useMenu";
import { getFullImageUrl } from "@/lib/imageUtils";
import {
  Menu,
  X,
  ShoppingBag,
  Minus,
  Plus,
  Trash2,
  MapPin,
  Clock,
  Phone,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { OnlineOrderSection } from "@/components/landing/OnlineOrderSection";

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);

  const { cart, updateQuantity, removeFromCart } = useCart();
  const { data: menu = [], isLoading } = useMenuItems();

  const cartCount = cart.reduce((s: number, i: any) => s + i.quantity, 0);
  const cartTotal = cart.reduce((s: number, i: any) => s + i.itemTotal, 0);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollTo = (id: string) => {
    setMobileOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  const featured = useMemo(
    () => (menu as any[]).filter((m) => m.isActive !== false).slice(0, 6),
    [menu],
  );

  const nav = [
    { label: "Menu", href: "#menu" },
    { label: "Order", href: "#order" },
    { label: "Story", href: "#story" },
    { label: "Visit", href: "#visit" },
  ];

  return (
    <div className="min-h-screen bg-[#faf8f5] text-zinc-900">
      {/* ========== STICKY HEADER ========== */}
      <header
        className={cn(
          "fixed inset-x-0 top-0 z-50 transition-all duration-300",
          scrolled
            ? "border-b border-amber-100/70 bg-white/90 shadow-sm backdrop-blur-xl"
            : "bg-white/85 backdrop-blur-md",
        )}
      >
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <a href="#" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-orange-500 shadow-md shadow-amber-200/50">
              <span className="text-lg">☕</span>
            </div>
            <div className="leading-tight">
              <p className="font-heading text-base font-semibold tracking-tight text-zinc-900">
                Streetside Café
              </p>
              <p className="text-[11px] tracking-wide text-zinc-500">
                Sip. Chew. Chat.
              </p>
            </div>
          </a>

          <nav className="hidden items-center gap-8 md:flex">
            {nav.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="text-sm font-medium text-zinc-600 transition hover:text-amber-700"
              >
                {item.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setCartOpen(true)}
              className="relative rounded-xl p-2 text-zinc-600 transition hover:bg-amber-50 hover:text-amber-700"
              aria-label="Open cart"
            >
              <ShoppingBag className="h-5 w-5" />
              {cartCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-600 px-1 text-[10px] font-bold text-white">
                  {cartCount}
                </span>
              )}
            </button>

            <Button
              onClick={() => scrollTo("order")}
              className="hidden rounded-full bg-amber-600 px-5 text-sm font-semibold text-white shadow-md shadow-amber-200/40 hover:bg-amber-700 sm:inline-flex"
            >
              Order Now →
            </Button>

            <button
              type="button"
              className="rounded-xl p-2 text-zinc-700 md:hidden"
              onClick={() => setMobileOpen((v) => !v)}
              aria-label="Toggle menu"
            >
              {mobileOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        {mobileOpen && (
          <div className="border-t border-zinc-100 bg-white px-4 py-4 md:hidden">
            <div className="flex flex-col gap-2">
              {nav.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className="rounded-xl px-3 py-2.5 text-sm font-medium text-zinc-700 hover:bg-amber-50"
                >
                  {item.label}
                </a>
              ))}
              <Button
                onClick={() => scrollTo("order")}
                className="mt-2 rounded-full bg-amber-600"
              >
                Order Now →
              </Button>
            </div>
          </div>
        )}
      </header>

      <div className="h-16" />

      {/* ========== HERO ========== */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-50 via-[#faf8f5] to-orange-50" />
        <div className="relative mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:items-center lg:py-24">
          <div className="space-y-6">
            <BadgePill tone="warning" className="w-fit">
              Neighborhood café
            </BadgePill>
            <h1 className="font-heading text-4xl font-semibold tracking-tight sm:text-5xl lg:text-[3.25rem] lg:leading-[1.1]">
              Coffee, comfort,
              <br />
              <span className="text-amber-700">and good company</span>
            </h1>
            <p className="max-w-md text-base leading-relaxed text-zinc-600">
              Handcrafted drinks and bites made fresh on the corner. Order ahead
              for pickup — we’ll text you when it’s ready.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button
                onClick={() => scrollTo("order")}
                className="h-12 rounded-full bg-amber-600 px-7 text-base font-semibold shadow-lg shadow-amber-200/50 hover:bg-amber-700"
              >
                Order for Pickup
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                onClick={() => scrollTo("menu")}
                className="h-12 rounded-full border-zinc-200 px-7 text-base"
              >
                Browse Menu
              </Button>
            </div>
          </div>

          <div className="relative">
            <div className="aspect-[4/3] overflow-hidden rounded-[2rem] shadow-2xl shadow-amber-100/60 ring-1 ring-black/5">
              <img
                src="/StreetSidePhoto.png"
                alt="Streetside Café"
                className="h-full w-full object-cover"
              />
            </div>
            <div className="absolute -bottom-4 left-6 right-6 rounded-2xl border border-white/80 bg-white/90 p-4 shadow-lg backdrop-blur-sm sm:left-auto sm:right-8 sm:w-56">
              <p className="text-xs font-medium uppercase tracking-wider text-zinc-400">
                Open today
              </p>
              <p className="mt-1 font-heading text-lg font-semibold">
                7:00 AM – 9:00 PM
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ========== MENU ========== */}
      <section id="menu" className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="mb-10 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <BadgePill tone="warning" className="mb-3 w-fit">
              Menu
            </BadgePill>
            <h2 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
              Favorites from the bar
            </h2>
            <p className="mt-2 max-w-lg text-sm text-zinc-500">
              A few of our most-loved drinks. Full menu is available when you
              order.
            </p>
          </div>
          <Button
            variant="outline"
            className="rounded-full"
            onClick={() => scrollTo("order")}
          >
            Order from full menu
          </Button>
        </div>

        {isLoading ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-64 animate-pulse rounded-3xl bg-zinc-100"
              />
            ))}
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((item: any) => {
              const img = getFullImageUrl(item.imageFileName ?? item.imageUrl);
              return (
                <article
                  key={item.id}
                  className="group overflow-hidden rounded-3xl border border-zinc-100 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg hover:shadow-amber-100/50"
                >
                  <div className="aspect-[4/3] overflow-hidden bg-zinc-50">
                    {img ? (
                      <img
                        src={img}
                        alt={item.name}
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-4xl opacity-20">
                        ☕
                      </div>
                    )}
                  </div>
                  <div className="p-5">
                    <p className="text-[11px] font-medium uppercase tracking-wider text-zinc-400">
                      {item.categoryName}
                    </p>
                    <h3 className="mt-1 font-heading text-lg font-semibold">
                      {item.name}
                    </h3>
                    <p className="mt-2 text-base font-semibold text-amber-700">
                      ₱{Number(item.price).toFixed(2)}
                    </p>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* ========== ORDER (single section) ========== */}
      <section id="order" className="border-y border-amber-100/60 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <div className="mb-10 max-w-xl">
            <BadgePill tone="warning" className="mb-3 w-fit">
              Order
            </BadgePill>
            <h2 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
              Order for pickup
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-zinc-500">
              Choose your items, pick a time at least 30 minutes from now, and
              we’ll text you when it’s ready.
            </p>
          </div>

          {/* Replace this block with your existing OnlineOrderSection if needed */}
          <OnlineOrderSection/>
        </div>
      </section>

      {/* ========== STORY ========== */}
      <section id="story" className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
          <div>
            <BadgePill tone="warning" className="mb-3 w-fit">
              Our story
            </BadgePill>
            <h2 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
              A corner for slow mornings and warm conversations
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-zinc-600">
              Streetside Café started as a small neighborhood spot for people
              who love good coffee without the rush. We roast with care, pour
              with patience, and keep a seat for regulars and first-timers
              alike.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: "Drinks crafted daily", value: "Fresh" },
              { label: "Pickup in minutes", value: "Fast" },
              { label: "Local ingredients", value: "Local" },
              { label: "SMS order updates", value: "Notified" },
            ].map((s) => (
              <div
                key={s.label}
                className="rounded-3xl border border-zinc-100 bg-white p-5 shadow-sm"
              >
                <p className="font-heading text-xl font-semibold text-amber-700">
                  {s.value}
                </p>
                <p className="mt-1 text-xs text-zinc-500">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== VISIT ========== */}
      <section id="visit" className="border-t border-zinc-100 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <BadgePill tone="warning" className="mb-3 w-fit">
            Visit
          </BadgePill>
          <h2 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
            Come by
          </h2>
          <div className="mt-10 grid gap-6 sm:grid-cols-3">
            <div className="rounded-3xl border border-zinc-100 bg-[#faf8f5] p-6">
              <MapPin className="h-5 w-5 text-amber-600" />
              <p className="mt-3 font-medium">Location</p>
              <p className="mt-1 text-sm text-zinc-500">
                Your street address here
              </p>
            </div>
            <div className="rounded-3xl border border-zinc-100 bg-[#faf8f5] p-6">
              <Clock className="h-5 w-5 text-amber-600" />
              <p className="mt-3 font-medium">Hours</p>
              <p className="mt-1 text-sm text-zinc-500">
                Daily · 7:00 AM – 9:00 PM
              </p>
            </div>
            <div className="rounded-3xl border border-zinc-100 bg-[#faf8f5] p-6">
              <Phone className="h-5 w-5 text-amber-600" />
              <p className="mt-3 font-medium">Contact</p>
              <p className="mt-1 text-sm text-zinc-500">09XX XXX XXXX</p>
            </div>
          </div>
        </div>
      </section>

      {/* ========== FOOTER ========== */}
      <footer className="border-t border-zinc-100 bg-zinc-950 text-zinc-400">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-10 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="flex items-center gap-3">
            <img
              src="/StreetSidePhoto.png"
              alt="Streetside Café"
              className="h-9 w-9 rounded-full object-cover"
            />
            <div>
              <p className="text-sm font-medium text-white">Streetside Café</p>
              <p className="text-xs">Sip. Chew. Chat.</p>
            </div>
          </div>
          <p className="text-xs">
            © {new Date().getFullYear()} Streetside Café
          </p>
        </div>
      </footer>

      {/* ========== CART DRAWER ========== */}
      <div
        className={cn(
          "fixed inset-0 z-[60] bg-black/35 backdrop-blur-sm transition-opacity duration-300",
          cartOpen ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        onClick={() => setCartOpen(false)}
      />

      <aside
        className={cn(
          "fixed right-0 top-0 z-[70] flex h-full w-full max-w-md flex-col bg-white shadow-2xl transition-transform duration-300 ease-out",
          cartOpen ? "translate-x-0" : "translate-x-full",
        )}
      >
        <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-50">
              <ShoppingBag className="h-4 w-4 text-amber-700" />
            </div>
            <div>
              <h2 className="font-heading text-lg font-semibold tracking-tight">
                Your Order
              </h2>
              {cartCount > 0 && (
                <p className="text-xs text-zinc-500">
                  {cartCount} item{cartCount > 1 ? "s" : ""}
                </p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={() => setCartOpen(false)}
            className="rounded-xl p-2 text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
          {cart.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-zinc-50">
                <ShoppingBag className="h-7 w-7 text-zinc-300" />
              </div>
              <p className="text-sm font-medium text-zinc-500">
                Your cart is empty
              </p>
              <p className="max-w-[200px] text-xs text-zinc-400">
                Add something delicious from the menu to get started
              </p>
            </div>
          ) : (
            cart.map((item: any, idx: number) => (
              <div
                key={`${item.id}-${idx}`}
                className="rounded-2xl border border-zinc-100 bg-zinc-50/70 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium leading-snug text-zinc-900">
                      {item.name}
                    </p>
                    {item.selectedOptionLabels?.length > 0 && (
                      <p className="mt-1 text-xs text-zinc-500">
                        {item.selectedOptionLabels.join(" · ")}
                      </p>
                    )}
                    <p className="mt-1.5 text-sm font-semibold text-amber-700">
                      ₱{item.itemTotal.toFixed(2)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeFromCart(idx)}
                    className="shrink-0 rounded-lg p-1.5 text-zinc-400 transition hover:bg-red-50 hover:text-red-500"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <div className="mt-3 flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 rounded-xl border-zinc-200"
                    onClick={() =>
                      updateQuantity(idx, Math.max(1, item.quantity - 1))
                    }
                    disabled={item.quantity <= 1}
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </Button>
                  <span className="w-8 text-center text-sm font-semibold tabular-nums">
                    {item.quantity}
                  </span>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 rounded-xl border-zinc-200"
                    onClick={() => updateQuantity(idx, item.quantity + 1)}
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>

        {cart.length > 0 && (
          <div className="border-t border-zinc-100 bg-white px-5 py-5">
            <div className="mb-4 flex items-end justify-between">
              <span className="text-sm text-zinc-500">Total</span>
              <span className="font-heading text-2xl font-semibold tracking-tight">
                ₱{cartTotal.toFixed(2)}
              </span>
            </div>
            <Button
              className="h-12 w-full rounded-2xl bg-amber-600 text-base font-semibold shadow-lg shadow-amber-200/40 hover:bg-amber-700"
              onClick={() => {
                setCartOpen(false);
                scrollTo("order");
              }}
            >
              Continue to Checkout
            </Button>
          </div>
        )}
      </aside>
    </div>
  );
}
