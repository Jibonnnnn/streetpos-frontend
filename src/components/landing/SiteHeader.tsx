import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X, ShoppingBag } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  cartCount?: number;
  onOrderClick?: () => void;
  onCartClick?: () => void;
};

export function SiteHeader({
  cartCount = 0,
  onOrderClick,
  onCartClick,
}: Props) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const nav = [
    { label: "Menu", href: "#menu" },
    { label: "Order", href: "#order" },
    { label: "Story", href: "#story" },
    { label: "Visit", href: "#visit" },
  ];

  return (
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
          <img
            src="/StreetSidePhoto.png"
            alt="Streetside Café"
            className="h-10 w-10 rounded-full object-cover shadow-md shadow-amber-200/50 ring-1 ring-amber-100"
          />
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
            onClick={onCartClick}
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
            onClick={onOrderClick}
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
              onClick={() => {
                setMobileOpen(false);
                onOrderClick?.();
              }}
              className="mt-2 rounded-full bg-amber-600"
            >
              Order Now →
            </Button>
          </div>
        </div>
      )}
    </header>
  );
}
