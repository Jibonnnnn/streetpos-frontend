import { useEffect, useMemo, useState } from "react";
import { menuService } from "@/services/menu.service";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BadgePill } from "@/components/common/BadgePill";
import { getFullImageUrl } from "@/lib/imageUtils";
import {
  ArrowRight,
  Sparkles,
  Clock3,
  Menu as MenuIcon,
  X,
  Star,
  MapPin,
} from "lucide-react";
import {
  LandingSection,
  LandingMetric,
  LandingCard,
} from "@/components/landing/landing-components";
import { OnlineOrderSection } from "@/components/landing/OnlineOrderSection";
import { MenuOrderModal } from "@/components/landing/MenuOrderModal";
import type { MenuItem } from "@/types";

function toNumber(value: number | string): number {
  const n = typeof value === "number" ? value : parseFloat(value);
  return Number.isFinite(n) ? n : 0;
}

export default function LandingPage() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSlide, setActiveSlide] = useState(0);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [menuModalOpen, setMenuModalOpen] = useState(false);
  const [menuModalCategory, setMenuModalCategory] = useState<string | null>(null);

  useEffect(() => {
    const fetchMenu = async () => {
      try {
        const res = await menuService.getMenu();
        setMenuItems(Array.isArray(res.data) ? res.data : []);
      } catch (error) {
        console.error("Failed to fetch menu:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchMenu();
  }, []);

  const topSellersByCategory = useMemo(() => {
    const activeItems = menuItems.filter((item) => item.isActive !== false);
    const groups = new Map<string, MenuItem>();

    for (const item of activeItems) {
      const current = groups.get(item.categoryName);
      if (!current || item.displayOrder < current.displayOrder) {
        groups.set(item.categoryName, item);
      }
    }

    return Array.from(groups.values()).sort((a, b) =>
      a.categoryName.localeCompare(b.categoryName),
    );
  }, [menuItems]);

  const featuredItems =
    topSellersByCategory.length > 0
      ? topSellersByCategory
      : menuItems.slice(0, 6);

  const slideshowItems = useMemo(
    () =>
      featuredItems
        .filter((item) => getFullImageUrl(item.imageFileName ?? item.imageUrl))
        .slice(0, 5),
    [featuredItems],
  );

  const activeSlideItem = slideshowItems[activeSlide] ?? slideshowItems[0];

  useEffect(() => {
    if (slideshowItems.length <= 1) return;
    const interval = window.setInterval(() => {
      setActiveSlide((current) => (current + 1) % slideshowItems.length);
    }, 4500);
    return () => window.clearInterval(interval);
  }, [slideshowItems.length]);

  const goToOrder = () => {
    setMobileNavOpen(false);
    document.getElementById("order")?.scrollIntoView({ behavior: "smooth" });
  };

  const openMenuModal = (category?: string | null) => {
    setMobileNavOpen(false);
    setMenuModalCategory(category ?? null);
    setMenuModalOpen(true);
  };

  const closeMenuModal = () => {
    setMenuModalOpen(false);
    setMenuModalCategory(null);
  };

  // All unique categories for clickable chips on the landing page
  const allCategories = useMemo(() => {
    const set = new Set<string>();
    for (const item of menuItems) {
      if (item.isActive === false) continue;
      if (item.categoryName?.trim()) set.add(item.categoryName.trim());
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [menuItems]);

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#fff7ed] text-zinc-900 dark:bg-[#0c0a09] dark:text-zinc-50">
      {/* ========== ANIMATED BACKGROUND ========== */}
      <div
        className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
        aria-hidden
      >
        {/* Warm base */}
        <div className="absolute inset-0 bg-[#fff7ed] dark:bg-[#0c0a09]" />

        {/* Layered color washes */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_100%_80%_at_0%_-30%,rgba(251,146,60,0.45),transparent_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_90%_70%_at_100%_-10%,rgba(249,115,22,0.28),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_110%,rgba(253,186,116,0.35),transparent_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_40%_at_80%_40%,rgba(251,113,133,0.12),transparent_50%)]" />

        {/* Soft mesh / noise feel via repeated gradients */}
        <div
          className="absolute inset-0 opacity-60 mix-blend-multiply dark:opacity-30 dark:mix-blend-soft-light"
          style={{
            backgroundImage: `
        radial-gradient(at 20% 20%, rgba(251,146,60,0.25) 0px, transparent 50%),
        radial-gradient(at 80% 10%, rgba(249,115,22,0.18) 0px, transparent 45%),
        radial-gradient(at 70% 80%, rgba(253,186,116,0.22) 0px, transparent 50%),
        radial-gradient(at 10% 70%, rgba(251,113,133,0.10) 0px, transparent 45%)
      `,
          }}
        />

        {/* Subtle grid */}
        <div
          className="absolute inset-0 opacity-[0.45] dark:opacity-[0.18]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(194,65,12,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(194,65,12,0.07) 1px, transparent 1px)",
            backgroundSize: "64px 64px",
            maskImage:
              "radial-gradient(ellipse 100% 90% at 50% 0%, black 10%, transparent 75%)",
          }}
        />

        {/* Floating orbs */}
        <div className="absolute -left-40 -top-20 h-[36rem] w-[36rem] animate-[float_22s_ease-in-out_infinite] rounded-full bg-amber-400/35 blur-[120px] dark:bg-amber-500/15" />
        <div className="absolute -right-32 top-10 h-[40rem] w-[40rem] animate-[float_28s_ease-in-out_infinite_reverse] rounded-full bg-orange-400/30 blur-[130px] dark:bg-orange-500/12" />
        <div className="absolute bottom-[-10%] left-[20%] h-[28rem] w-[28rem] animate-[float_24s_ease-in-out_infinite] rounded-full bg-yellow-300/25 blur-[110px] dark:bg-amber-400/10" />
        <div className="absolute right-[15%] top-[50%] h-[22rem] w-[22rem] animate-[float_20s_ease-in-out_infinite_reverse] rounded-full bg-rose-300/20 blur-[100px] dark:bg-rose-500/10" />

        {/* Thin top glow line */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-500/60 to-transparent" />

        {/* Bottom fade so content stays readable */}
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#fff7ed] to-transparent dark:from-[#0c0a09]" />
      </div>

      {/* ========== HEADER ========== */}
      <header className="sticky top-0 z-50 border-b border-white/60 bg-white/70 backdrop-blur-2xl dark:border-white/10 dark:bg-zinc-950/70">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:h-[4.25rem] sm:px-6 lg:px-8">
          <a href="#top" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 shadow-md shadow-amber-500/25 sm:h-11 sm:w-11">
              <img
                src="/StreetSidePhoto.png"
                alt="Streetside Café"
                className="h-9 w-9 object-contain sm:h-10 sm:w-10"
              />
            </div>
            <div className="leading-tight">
              <p className="text-base font-semibold tracking-tight sm:text-lg">
                Streetside Café
              </p>
              <p className="text-[11px] text-muted-foreground sm:text-xs">
                Sip. Chew. Chat.
              </p>
            </div>
          </a>

          <nav className="hidden items-center gap-7 text-sm font-medium text-zinc-600 dark:text-zinc-300 md:flex">
            {["Menu", "Order", "Story", "Visit"].map((label) => (
              <a
                key={label}
                href={`#${label.toLowerCase()}`}
                className="transition-colors hover:text-zinc-950 dark:hover:text-white"
              >
                {label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              className="hidden rounded-full px-5 md:inline-flex"
              onClick={goToOrder}
            >
              Order Now
              <ArrowRight className="ml-1.5 h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-10 w-10 rounded-xl md:hidden"
              onClick={() => setMobileNavOpen((v) => !v)}
              aria-label="Toggle menu"
            >
              {mobileNavOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <MenuIcon className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile nav */}
        {mobileNavOpen && (
          <div className="border-t border-white/60 bg-white/95 px-4 py-4 backdrop-blur-xl dark:border-white/10 dark:bg-zinc-950/95 md:hidden">
            <nav className="flex flex-col gap-1 text-sm font-medium">
              {["Menu", "Order", "Story", "Visit"].map((label) => (
                <a
                  key={label}
                  href={`#${label.toLowerCase()}`}
                  onClick={() => setMobileNavOpen(false)}
                  className="rounded-xl px-3 py-3 text-zinc-600 transition-colors hover:bg-amber-50 hover:text-zinc-950 dark:text-zinc-300 dark:hover:bg-zinc-900 dark:hover:text-white"
                >
                  {label}
                </a>
              ))}
            </nav>
            <Button
              className="mt-3 w-full rounded-2xl"
              size="lg"
              onClick={goToOrder}
            >
              Order Now
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        )}
      </header>

      <main id="top">
        {/* ========== HERO ========== */}
        <section className="mx-auto grid max-w-6xl items-center gap-10 px-4 pb-16 pt-10 sm:px-6 sm:pt-14 lg:grid-cols-2 lg:gap-14 lg:px-8 lg:pb-24 lg:pt-20">
          <div className="order-2 flex flex-col lg:order-1">
            <BadgePill
              tone="warning"
              className="mb-5 w-fit gap-2 px-3.5 py-1.5"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Seasonal drinks are live
            </BadgePill>

            <h1 className="font-heading text-4xl font-semibold leading-[1.1] tracking-tight sm:text-5xl lg:text-6xl">
              Good coffee.
              <span className="mt-1 block text-zinc-400 dark:text-zinc-500">
                Good food. Good flow.
              </span>
            </h1>

            <p className="mt-5 max-w-lg text-base leading-7 text-zinc-600 dark:text-zinc-300 sm:text-lg sm:leading-8">
              A calm café experience for quick pickup, easy lunch runs, and slow
              afternoons — made for Dipolog.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Button
                size="lg"
                className="rounded-2xl px-6"
                onClick={goToOrder}
              >
                Order Now
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="rounded-2xl px-6"
                asChild
              >
                <a href="#story">Our Story</a>
              </Button>
            </div>

            <div className="mt-10 grid grid-cols-3 gap-3 sm:max-w-md">
              <LandingMetric label="Pickup" value="~15 min" />
              <LandingMetric label="Dine-in" value="Cozy" />
              <LandingMetric label="Hours" value="Daily" />
            </div>
          </div>

          {/* Hero visual */}
          <div className="order-1 relative lg:order-2">
            <div className="absolute -inset-4 -z-10 rounded-[2.5rem] bg-gradient-to-br from-amber-200/40 via-orange-100/30 to-transparent blur-2xl dark:from-amber-500/10 dark:via-orange-500/5" />

            <Card className="overflow-hidden rounded-[1.75rem] border-white/70 bg-white/80 shadow-[0_25px_60px_rgba(15,23,42,0.10)] backdrop-blur-xl dark:border-white/10 dark:bg-zinc-900/60">
              <CardContent className="p-3 sm:p-4">
                <div className="relative aspect-[4/3] overflow-hidden rounded-[1.35rem] bg-zinc-900 sm:aspect-[5/4]">
                  {loading ? (
                    <div className="h-full w-full animate-pulse bg-gradient-to-br from-zinc-800 to-zinc-900" />
                  ) : slideshowItems.length > 0 ? (
                    slideshowItems.map((item, index) => {
                      const imageSrc = getFullImageUrl(
                        item.imageFileName ?? item.imageUrl,
                      );
                      return (
                        <img
                          key={item.id}
                          src={imageSrc!}
                          alt={item.name}
                          className={`absolute inset-0 h-full w-full object-cover transition-all duration-700 ease-out ${
                            index === activeSlide
                              ? "scale-100 opacity-100"
                              : "scale-105 opacity-0"
                          }`}
                        />
                      );
                    })
                  ) : (
                    <div className="flex h-full items-center justify-center text-5xl text-zinc-500">
                      ☕
                    </div>
                  )}

                  {/* Gradient overlay + caption */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5">
                    {activeSlideItem && (
                      <div className="space-y-1.5">
                        <div className="inline-flex items-center gap-1.5 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-medium text-zinc-900 shadow-sm">
                          <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                          Top seller
                        </div>
                        <h3 className="font-heading text-xl font-semibold text-white sm:text-2xl">
                          {activeSlideItem.name}
                        </h3>
                        <p className="text-sm text-white/80">
                          {activeSlideItem.categoryName} · ₱
                          {toNumber(activeSlideItem.price).toFixed(2)}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {slideshowItems.length > 1 && (
                  <div className="mt-3 flex justify-center gap-1.5">
                    {slideshowItems.map((_, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => setActiveSlide(index)}
                        className={`h-1.5 rounded-full transition-all duration-300 ${
                          index === activeSlide
                            ? "w-6 bg-amber-500"
                            : "w-1.5 bg-zinc-300 hover:bg-zinc-400 dark:bg-zinc-700"
                        }`}
                        aria-label={`Slide ${index + 1}`}
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </section>

        {/* ========== MENU ========== */}
        <section
          id="menu"
          className="mx-auto max-w-6xl px-4 pb-20 sm:px-6 lg:px-8"
        >
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <LandingSection
              eyebrow="Menu"
              title="Browse by category"
              description="Tap a category to open the full menu for that section — or view everything in one popup."
            />
            <Button
              className="rounded-2xl shrink-0"
              onClick={() => openMenuModal(null)}
            >
              View full menu
            </Button>
          </div>

          {/* Clickable categories */}
          {!loading && allCategories.length > 0 && (
            <div className="mb-8 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => openMenuModal(null)}
                className="rounded-full border border-amber-300/80 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-900 transition hover:bg-amber-100 dark:border-amber-500/40 dark:bg-amber-950/40 dark:text-amber-100"
              >
                All menu
              </button>
              {allCategories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => openMenuModal(cat)}
                  className="rounded-full border border-zinc-200 bg-white/80 px-4 py-2 text-sm font-medium text-zinc-800 shadow-sm transition hover:-translate-y-0.5 hover:border-amber-300 hover:bg-amber-50 dark:border-zinc-700 dark:bg-zinc-900/70 dark:text-zinc-100 dark:hover:border-amber-500/40 dark:hover:bg-amber-950/30"
                >
                  {cat}
                </button>
              ))}
            </div>
          )}

          {loading ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="h-72 animate-pulse rounded-3xl bg-zinc-100/80 dark:bg-zinc-900/60"
                />
              ))}
            </div>
          ) : topSellersByCategory.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-zinc-300/80 bg-white/50 py-16 text-center text-muted-foreground dark:border-zinc-800 dark:bg-zinc-950/40">
              Menu items will appear here once published.
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {topSellersByCategory.map((item) => {
                const imageSrc = getFullImageUrl(
                  item.imageFileName ?? item.imageUrl,
                );
                return (
                  <Card
                    key={item.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => openMenuModal(item.categoryName)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        openMenuModal(item.categoryName);
                      }
                    }}
                    className="group cursor-pointer overflow-hidden rounded-3xl border-white/70 bg-white/75 shadow-sm backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl dark:border-white/10 dark:bg-zinc-900/60"
                  >
                    <div className="relative aspect-[4/3] overflow-hidden bg-zinc-100 dark:bg-zinc-800">
                      {imageSrc ? (
                        <img
                          src={imageSrc}
                          alt={item.name}
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-4xl text-zinc-400">
                          ☕
                        </div>
                      )}
                    </div>
                    <CardContent className="p-5">
                      <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                        {item.categoryName}
                      </p>
                      <h3 className="mt-1.5 font-heading text-lg font-semibold tracking-tight">
                        {item.name}
                      </h3>
                      <p className="mt-1.5 line-clamp-2 text-sm leading-6 text-muted-foreground">
                        {item.description || "House favorite, prepared fresh."}
                      </p>
                      <div className="mt-4 flex items-center justify-between">
                        <p className="text-base font-semibold text-amber-700 dark:text-amber-400">
                          ₱{toNumber(item.price).toFixed(2)}
                        </p>
                        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock3 className="h-3.5 w-3.5" />
                          Fresh
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </section>

        {/* ========== ONLINE ORDER ========== */}
        <OnlineOrderSection />

        {/* ========== STORY ========== */}
        <section
          id="story"
          className="border-y border-white/70 bg-white/55 py-16 dark:border-white/10 dark:bg-zinc-950/40 sm:py-20"
        >
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <LandingSection
              eyebrow="Story"
              title="Built for the neighborhood café"
              description="Designed around the real rhythm of a busy café — clear menus, fast ordering, and a calm experience for every guest."
              className="mb-10"
            />
            <div className="grid gap-5 md:grid-cols-3">
              {[
                {
                  title: "Clear by design",
                  body: "Every section is intentional so guests can find drinks, food, and ordering without friction.",
                },
                {
                  title: "Designed for action",
                  body: "Menu items are presented like products, not list rows, so you can scan and decide quickly.",
                },
                {
                  title: "Ready for growth",
                  body: "Structured so promos, loyalty, and future features can slot in cleanly.",
                },
              ].map((item) => (
                <LandingCard
                  key={item.title}
                  title={item.title}
                  description={item.body}
                />
              ))}
            </div>
          </div>
        </section>

        {/* ========== VISIT ========== */}
        <section id="visit" className="py-14 sm:py-16">
          <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 sm:px-6 lg:flex-row lg:items-end lg:justify-between lg:px-8">
            <div className="max-w-xl">
              <LandingSection
                eyebrow="Visit"
                title="Come by Streetside"
                description="23 Mabini St. cor. Osmeña St., Biasong, Dipolog City, 7100 Zamboanga del Norte. Open daily for dine-in and pickup."
              />
            </div>
            <div className="flex flex-wrap gap-3">
              <Button variant="outline" className="rounded-2xl" asChild>
                <a
                  href="https://www.google.com/maps/search/?api=1&query=23+Mabini+St+cor+Osmena+St+Biasong+Dipolog+City"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <MapPin className="mr-2 h-4 w-4" />
                  Open Map
                </a>
              </Button>
              <Button className="rounded-2xl" onClick={goToOrder}>
                Order Now
              </Button>
            </div>
          </div>
        </section>
      </main>

      {/* ========== FOOTER ========== */}
      <footer className="border-t border-white/70 bg-white/70 dark:border-white/10 dark:bg-zinc-950/60">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-amber-500 to-orange-600">
                <img
                  src="/StreetSidePhoto.png"
                  alt="Streetside Café"
                  className="h-8 w-8 object-contain"
                />
              </div>
              <div>
                <p className="text-sm font-semibold tracking-tight">
                  Streetside Café
                </p>
                <p className="text-xs text-muted-foreground">
                  Dipolog City, Zamboanga del Norte
                </p>
              </div>
            </div>
            <nav className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-zinc-600 dark:text-zinc-400">
              <a
                href="#menu"
                  onClick={(e) => {
                    e.preventDefault();
                    openMenuModal(null);
                  }}
                className="hover:text-zinc-950 dark:hover:text-white"
              >
                Menu
              </a>
              <a
                href="#order"
                className="hover:text-zinc-950 dark:hover:text-white"
              >
                Order
              </a>
              <a
                href="#story"
                className="hover:text-zinc-950 dark:hover:text-white"
              >
                Story
              </a>
              <a
                href="#visit"
                className="hover:text-zinc-950 dark:hover:text-white"
              >
                Visit
              </a>
            </nav>
          </div>

          <div className="mt-8 flex flex-col gap-2 border-t border-zinc-200/70 pt-6 text-xs text-muted-foreground dark:border-zinc-800 sm:flex-row sm:items-center sm:justify-between">
            <p>
              © {new Date().getFullYear()} Streetside Café. All rights reserved.
              <span className="mx-2 text-zinc-300 dark:text-zinc-700">·</span>
              Developed by:{" "}
              <span className="font-heading text-sm font-semibold tracking-tight bg-gradient-to-r from-amber-600 via-orange-500 to-rose-500 bg-clip-text text-transparent">
                Jeb Molina
              </span>
            </p>
            <p>Open daily · Dine-in &amp; pickup</p>
          </div>
        </div>
      </footer>

      <MenuOrderModal
        open={menuModalOpen}
        onClose={closeMenuModal}
        menuItems={menuItems.filter((m) => m.isActive !== false)}
        loading={loading}
        initialCategory={menuModalCategory}
      />
    </div>
  );
}