import { useEffect, useMemo, useState } from 'react';
import { menuService } from '@/services/menu.service';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { BadgePill } from '@/components/common/BadgePill';
import { getFullImageUrl } from '@/lib/imageUtils';
import { Coffee, ArrowRight, Sparkles, Clock3, Menu as MenuIcon, X, Star, MapPin } from 'lucide-react';
import { LandingSection, LandingMetric, LandingCard } from '@/components/landing/landing-components';
import { MenuOrderModal } from '@/components/landing/MenuOrderModal';
import type { MenuItem } from '@/types';

function toNumber(value: number | string): number {
  const n = typeof value === "number" ? value : parseFloat(value);
  return Number.isFinite(n) ? n : 0;
}

const testimonials = [
  {
    name: 'Maria Santos',
    role: 'Regular, weekday mornings',
    quote: 'My oat milk latte is ready before I even reach the counter. Same order, same great taste, every single time.',
  },
  {
    name: 'Jerome Villaruel',
    role: 'Dipolog City local',
    quote: 'Best lunch spot near the plaza. Quick pickup line and the food photos on the app actually match what you get.',
  },
  {
    name: 'Andrea Cruz',
    role: 'Weekend regular',
    quote: 'Cozy enough to stay a while, fast enough when I just need to grab and go. Streetside gets both right.',
  },
];

export default function LandingPage() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSlide, setActiveSlide] = useState(0);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [orderModalOpen, setOrderModalOpen] = useState(false);

  useEffect(() => {
    const fetchMenu = async () => {
      try {
        const res = await menuService.getMenu();
        setMenuItems(Array.isArray(res.data) ? res.data : []);
      } catch (error) {
        console.error('Failed to fetch menu:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchMenu();
  }, []);

  // One top seller per category, ranked by displayOrder (lowest = most featured).
  // Falls back gracefully once real sales-ranked data is available from the API.
  const topSellersByCategory = useMemo(() => {
    const activeItems = menuItems.filter((item) => item.isActive !== false);
    const groups = new Map<string, MenuItem>();

    for (const item of activeItems) {
      const current = groups.get(item.categoryName);
      if (!current || item.displayOrder < current.displayOrder) {
        groups.set(item.categoryName, item);
      }
    }

    return Array.from(groups.values()).sort((a, b) => a.categoryName.localeCompare(b.categoryName));
  }, [menuItems]);

  const featuredItems = topSellersByCategory.length > 0 ? topSellersByCategory : menuItems.slice(0, 6);

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

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(251,146,60,0.14),_transparent_26%),radial-gradient(circle_at_top_right,_rgba(245,158,11,0.12),_transparent_22%),linear-gradient(180deg,_#fffaf5_0%,_#fff_40%,_#f8fafc_100%)] text-zinc-900 dark:bg-[radial-gradient(circle_at_top_left,_rgba(251,146,60,0.08),_transparent_26%),radial-gradient(circle_at_top_right,_rgba(245,158,11,0.06),_transparent_22%),linear-gradient(180deg,_#0c0a09_0%,_#18181b_40%,_#09090b_100%)] dark:text-zinc-50">
      <header className="sticky top-0 z-50 border-b border-white/70 bg-white/75 backdrop-blur-xl dark:border-white/10 dark:bg-zinc-950/75">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <a href="#top" className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-lg shadow-amber-500/20">
              <Coffee className="h-5 w-5" />
            </div>
            <div>
              <p className="text-lg font-semibold tracking-tight">Streetside Café</p>
              <p className="text-xs text-muted-foreground">Fresh brews, fast service</p>
            </div>
          </a>

          <nav className="hidden items-center gap-6 text-sm font-medium text-zinc-600 dark:text-zinc-300 md:flex">
            <a href="#menu" className="transition-colors hover:text-zinc-950 dark:hover:text-white">Menu</a>
            <a href="#story" className="transition-colors hover:text-zinc-950 dark:hover:text-white">Story</a>
            <a href="#testimonials" className="transition-colors hover:text-zinc-950 dark:hover:text-white">Reviews</a>
            <a href="#visit" className="transition-colors hover:text-zinc-950 dark:hover:text-white">Visit</a>
          </nav>

          <div className="flex items-center gap-2">
            <Button className="hidden gap-2 sm:inline-flex" size="lg" onClick={() => setOrderModalOpen(true)}>
              Order Now
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              aria-label={mobileNavOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileNavOpen}
              onClick={() => setMobileNavOpen((prev) => !prev)}
            >
              {mobileNavOpen ? <X className="h-5 w-5" /> : <MenuIcon className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {mobileNavOpen ? (
          <div className="border-t border-white/70 bg-white/95 px-4 py-4 backdrop-blur-xl dark:border-white/10 dark:bg-zinc-950/95 md:hidden">
            <nav className="flex flex-col gap-1 text-sm font-medium text-zinc-600 dark:text-zinc-300">
              <a href="#menu" onClick={() => setMobileNavOpen(false)} className="rounded-xl px-3 py-2.5 transition-colors hover:bg-zinc-100 hover:text-zinc-950 dark:hover:bg-zinc-900 dark:hover:text-white">Menu</a>
              <a href="#story" onClick={() => setMobileNavOpen(false)} className="rounded-xl px-3 py-2.5 transition-colors hover:bg-zinc-100 hover:text-zinc-950 dark:hover:bg-zinc-900 dark:hover:text-white">Story</a>
              <a href="#testimonials" onClick={() => setMobileNavOpen(false)} className="rounded-xl px-3 py-2.5 transition-colors hover:bg-zinc-100 hover:text-zinc-950 dark:hover:bg-zinc-900 dark:hover:text-white">Reviews</a>
              <a href="#visit" onClick={() => setMobileNavOpen(false)} className="rounded-xl px-3 py-2.5 transition-colors hover:bg-zinc-100 hover:text-zinc-950 dark:hover:bg-zinc-900 dark:hover:text-white">Visit</a>
            </nav>
            <Button
              className="mt-3 w-full gap-2"
              size="lg"
              onClick={() => {
                setMobileNavOpen(false);
                setOrderModalOpen(true);
              }}
            >
              Order Now
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        ) : null}
      </header>

      <main id="top">
        <section className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:px-8 lg:py-20">
          <div className="flex flex-col justify-center">
            <BadgePill tone="warning" className="mb-6 w-fit gap-2 px-4 py-2 text-sm">
              <Sparkles className="h-3.5 w-3.5" />
              New seasonal drinks are live
            </BadgePill>

            <h1 className="max-w-3xl font-heading text-5xl font-semibold tracking-tight sm:text-6xl lg:text-7xl">
              Good coffee.
              <span className="block text-zinc-500 dark:text-zinc-400">Good food. Good flow.</span>
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-zinc-600 dark:text-zinc-300">
              A calm, modern café experience for pickup orders, quick lunch runs, and slow afternoons. Clean design, fast ordering, and menu items that look as good as they taste.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Button size="lg" className="gap-2" onClick={() => setOrderModalOpen(true)}>
                Browse Menu
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button size="lg" variant="outline" asChild>
                <a href="#story">Learn More</a>
              </Button>
            </div>

            <div className="mt-10 grid max-w-2xl grid-cols-2 gap-4 sm:grid-cols-3">
              <LandingMetric label="Pickup" value="15 min" />
              <LandingMetric label="Dine-in" value="Cozy" />
              <LandingMetric label="Orders" value="Open daily" />
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 -z-10 rounded-[2rem] bg-gradient-to-br from-amber-200/50 via-orange-100/40 to-transparent blur-3xl dark:from-amber-500/10 dark:via-orange-500/5" />
            <Card className="overflow-hidden border-white/80 bg-white/80 shadow-[0_30px_80px_rgba(15,23,42,0.12)] backdrop-blur-xl dark:border-white/10 dark:bg-zinc-900/70">
              <CardContent className="p-5 sm:p-6">
                <div className="relative overflow-hidden rounded-[2rem] border border-white/70 bg-zinc-950 shadow-2xl dark:border-white/10">
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/85 via-zinc-950/20 to-transparent" />
                  <div className="absolute inset-0">
                    {loading ? (
                      <div className="h-full w-full animate-pulse bg-gradient-to-br from-zinc-800 via-zinc-700 to-zinc-900" />
                    ) : slideshowItems.length > 0 ? (
                      slideshowItems.map((item, index) => {
                        const imageSrc = getFullImageUrl(item.imageFileName ?? item.imageUrl);

                        return (
                          <div
                            key={item.id}
                            className={`absolute inset-0 transition-all duration-1000 ease-out ${index === activeSlide ? 'opacity-100 scale-100' : 'opacity-0 scale-[1.04]'}`}
                          >
                            {imageSrc ? (
                              <img
                                src={imageSrc}
                                alt={item.name}
                                className="h-full w-full object-cover"
                              />
                            ) : null}
                            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/85 via-zinc-950/25 to-transparent" />
                          </div>
                        );
                      })
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(251,191,36,0.3),_transparent_35%),linear-gradient(135deg,_#18181b,_#3f3f46)]">
                        <div className="text-center text-white/85">
                          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full border border-white/20 bg-white/10 text-4xl backdrop-blur-md">
                            ☕
                          </div>
                          <p className="text-sm uppercase tracking-[0.35em] text-white/60">Fresh images loading</p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="absolute inset-x-0 bottom-0 z-10 h-28 bg-gradient-to-t from-zinc-950 via-zinc-950/70 to-transparent" />

                  <div className="relative z-10 flex min-h-[28rem] flex-col justify-between p-5 sm:min-h-[34rem] sm:p-6">
                    <div className="flex items-center justify-between gap-4">
                      <div className="max-w-xs rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-medium uppercase tracking-[0.2em] text-white/80 backdrop-blur-md">
                        Top sellers, by category
                      </div>
                      <BadgePill tone="success" className="bg-white/90 text-zinc-900">
                        Live menu
                      </BadgePill>
                    </div>

                    <div className="mt-auto grid gap-5 sm:grid-cols-[1fr_auto] sm:items-end">
                      <div className="max-w-xl text-white">
                        <p className="text-sm font-medium uppercase tracking-[0.25em] text-white/70">
                          {activeSlideItem ? activeSlideItem.categoryName : 'Seasonal picks'}
                        </p>
                        <h2 className="mt-2 font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
                          {activeSlideItem ? activeSlideItem.name : 'Smooth transitions, fresh photos, menu that feels alive.'}
                        </h2>
                        <p className="mt-3 max-w-lg text-sm leading-6 text-white/75 sm:text-base">
                          {activeSlideItem?.description || 'A rotating showcase of best sellers and new drinks, animated with a soft crossfade so the page feels polished instead of static.'}
                        </p>
                        {activeSlideItem ? (
                          <div className="mt-5 flex flex-wrap items-center gap-3">
                            <BadgePill tone="neutral" className="border border-white/15 bg-white/10 text-white backdrop-blur-md">
                              {activeSlideItem.categoryName}
                            </BadgePill>
                            <div className="rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold text-white backdrop-blur-md">
                              ₱{toNumber(activeSlideItem.price).toFixed(2)}
                            </div>
                          </div>
                        ) : null}
                      </div>

                      <div className="flex items-center gap-2 sm:flex-col sm:items-end">
                        {slideshowItems.map((item, index) => (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => setActiveSlide(index)}
                            className={`h-2.5 rounded-full transition-all duration-300 ${index === activeSlide ? 'w-8 bg-white' : 'w-2.5 bg-white/40 hover:bg-white/70'}`}
                            aria-label={`Show slide ${index + 1}`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {slideshowItems.length > 1 ? (
                  <div className="mt-4 grid grid-cols-5 gap-2 overflow-hidden rounded-2xl border border-zinc-200/80 bg-white/80 p-2 shadow-sm dark:border-zinc-800 dark:bg-zinc-950/60">
                    {slideshowItems.map((item, index) => {
                      const thumbSrc = getFullImageUrl(item.imageFileName ?? item.imageUrl);

                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setActiveSlide(index)}
                          className={`group relative overflow-hidden rounded-xl transition-all duration-300 ${index === activeSlide ? 'ring-2 ring-amber-500 ring-offset-2 ring-offset-white dark:ring-offset-zinc-950' : 'opacity-70 hover:opacity-100'}`}
                          aria-label={`Preview ${item.name}`}
                        >
                          <div className="aspect-[4/3] bg-zinc-100 dark:bg-zinc-800">
                            {thumbSrc ? (
                              <img src={thumbSrc} alt={item.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                            ) : null}
                          </div>
                          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-zinc-950/90 to-transparent p-2 text-left">
                            <p className="line-clamp-1 text-xs font-medium text-white">{item.name}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ) : null}

                {loading ? (
                  <div className="mt-6 space-y-4">
                    {Array.from({ length: 3 }).map((_, index) => (
                      <div key={index} className="h-24 animate-pulse rounded-3xl bg-zinc-100 dark:bg-zinc-800" />
                    ))}
                  </div>
                ) : (
                  <div className="mt-6 space-y-4">
                    {featuredItems.slice(0, 4).map((item, index) => {
                      const imageSrc = getFullImageUrl(item.imageFileName ?? item.imageUrl);
                      return (
                        <div
                          key={item.id}
                          className="flex items-center gap-4 rounded-3xl border border-zinc-200/70 bg-white p-3 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-950/50"
                        >
                          <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-2xl bg-zinc-100 dark:bg-zinc-800">
                            {imageSrc ? (
                              <img
                                src={imageSrc}
                                alt={item.name}
                                className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-2xl text-zinc-400">☕</div>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="font-medium tracking-tight">{item.name}</p>
                                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{item.description || 'House favorite prepared fresh.'}</p>
                              </div>
                              <p className="whitespace-nowrap text-base font-semibold">₱{toNumber(item.price).toFixed(2)}</p>
                            </div>
                            <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
                              <BadgePill tone={index % 2 === 0 ? 'info' : 'neutral'}>{item.categoryName}</BadgePill>
                              <span className="inline-flex items-center gap-1">
                                <Clock3 className="h-3.5 w-3.5" />
                                Made fresh
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Full menu grid, one top seller per category */}
        <section id="menu" className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
          <LandingSection
            eyebrow="Menu"
            title="Top seller from every category"
            description="The best-selling pick from each menu category, so you can see the range of the café at a glance before browsing the full menu."
            className="mb-8"
          />

          {loading ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-72 animate-pulse rounded-3xl bg-zinc-100 dark:bg-zinc-900" />
              ))}
            </div>
          ) : topSellersByCategory.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-zinc-300 bg-white/60 py-16 text-center text-muted-foreground dark:border-zinc-800 dark:bg-zinc-950/40">
              Menu items will appear here once they're published.
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {topSellersByCategory.map((item) => {
                const imageSrc = getFullImageUrl(item.imageFileName ?? item.imageUrl);
                return (
                  <Card
                    key={item.id}
                    className="group overflow-hidden border-white/80 bg-white/80 shadow-sm backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl dark:border-white/10 dark:bg-zinc-900/70"
                  >
                    <div className="relative aspect-[4/3] overflow-hidden bg-zinc-100 dark:bg-zinc-800">
                      {imageSrc ? (
                        <img
                          src={imageSrc}
                          alt={item.name}
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-4xl text-zinc-400">☕</div>
                      )}
                      <div className="absolute left-3 top-3 flex items-center gap-1 rounded-full bg-white/90 px-3 py-1 text-xs font-medium text-zinc-900 shadow backdrop-blur-md">
                        <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                        Top seller
                      </div>
                    </div>
                    <CardContent className="p-5">
                      <BadgePill tone="warning" className="mb-3 w-fit">{item.categoryName}</BadgePill>
                      <h3 className="font-heading text-lg font-semibold tracking-tight">{item.name}</h3>
                      <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                        {item.description || 'House favorite prepared fresh.'}
                      </p>
                      <div className="mt-4 flex items-center justify-between">
                        <p className="text-lg font-semibold">₱{toNumber(item.price).toFixed(2)}</p>
                        <Button size="sm" variant="outline" onClick={() => setOrderModalOpen(true)}>
                          Order
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </section>

        <section id="story" className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
          <LandingSection
            eyebrow="Why it works"
            title="A calmer way to present food and café ordering"
            description="The layout is structured to feel premium, scan quickly, and leave room for future brand, loyalty, or promotion modules without reworking the page." 
            className="mb-6"
          />

          <div className="grid gap-6 lg:grid-cols-3">
            {[
              {
                title: 'Minimal, warm, fast',
                body: 'A layout that feels premium without getting loud. Large type, generous spacing, and clear visual hierarchy.',
              },
              {
                title: 'Designed for action',
                body: 'Menu items are presented like products, not list rows, so users can scan and decide quickly.',
              },
              {
                title: 'Ready for growth',
                body: 'The content is already structured so future sections like promos, subscriptions, or loyalty can slot in cleanly.',
              },
            ].map((item) => (
              <LandingCard key={item.title} title={item.title} description={item.body} />
            ))}
          </div>
        </section>

        {/* Testimonials */}
        <section id="testimonials" className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
          <LandingSection
            eyebrow="Customers"
            title="What regulars are saying"
            description="A few words from the people who stop by every week."
            className="mb-8"
          />

          <div className="grid gap-6 lg:grid-cols-3">
            {testimonials.map((t) => (
              <Card key={t.name} className="border-white/80 bg-white/75 shadow-sm backdrop-blur-sm dark:border-white/10 dark:bg-zinc-900/70">
                <CardContent className="p-6">
                  <div className="mb-4 flex gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-amber-500 text-amber-500" />
                    ))}
                  </div>
                  <p className="text-sm leading-6 text-zinc-700 dark:text-zinc-300">"{t.quote}"</p>
                  <div className="mt-5 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-amber-500 to-orange-600 text-sm font-semibold text-white">
                      {t.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-medium tracking-tight">{t.name}</p>
                      <p className="text-xs text-muted-foreground">{t.role}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section id="visit" className="border-t border-white/80 bg-white/60 dark:border-white/10 dark:bg-zinc-950/50">
          <div className="mx-auto grid max-w-7xl gap-6 px-4 py-12 sm:px-6 lg:grid-cols-[1fr_auto] lg:px-8">
            <div>
              <LandingSection
                eyebrow="Visit"
                title="Visit Streetside Café"
                description="23 Mabini St. cor. Osmena St., Biasong, Dipolog City, 7100 Zamboanga del Norte. Open every day with flexible hours for dine-in and pickup."
              />
            </div>
            <div className="flex flex-wrap gap-3 self-start lg:justify-end">
              <Button variant="outline" asChild>
                <a
                  href="https://www.google.com/maps/search/?api=1&query=23+Mabini+St+cor+Osmena+St+Biasong+Dipolog+City"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <MapPin className="h-4 w-4" />
                  Map
                </a>
              </Button>
              <Button onClick={() => setOrderModalOpen(true)}>Order Now</Button>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/80 bg-white/80 dark:border-white/10 dark:bg-zinc-950/70">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-white">
                <Coffee className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-semibold tracking-tight">Streetside Café</p>
                <p className="text-xs text-muted-foreground">Dipolog City, Zamboanga del Norte</p>
              </div>
            </div>

            <nav className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-zinc-600 dark:text-zinc-400">
              <a href="#menu" className="transition-colors hover:text-zinc-950 dark:hover:text-white">Menu</a>
              <a href="#story" className="transition-colors hover:text-zinc-950 dark:hover:text-white">Story</a>
              <a href="#testimonials" className="transition-colors hover:text-zinc-950 dark:hover:text-white">Reviews</a>
              <a href="#visit" className="transition-colors hover:text-zinc-950 dark:hover:text-white">Visit</a>
            </nav>
          </div>

          <div className="mt-8 flex flex-col gap-2 border-t border-zinc-200/80 pt-6 text-xs text-muted-foreground dark:border-zinc-800 sm:flex-row sm:items-center sm:justify-between">
            <p>© {new Date().getFullYear()} Streetside Café. All rights reserved.</p>
            <p>Open daily · Dine-in &amp; pickup</p>
          </div>
        </div>
      </footer>

      <MenuOrderModal
        open={orderModalOpen}
        onClose={() => setOrderModalOpen(false)}
        menuItems={menuItems}
        loading={loading}
      />
    </div>
  );
}