import { Card, CardContent } from "@/components/ui/card";

type Props = {
  menuCount: number;
  cartCount: number;
  recentCount: number;
};

export function PosStatsRow({ menuCount, cartCount, recentCount }: Props) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {[
        { label: "Menu Items", value: menuCount },
        { label: "Items in Cart", value: cartCount },
        { label: "Recent Orders", value: recentCount },
      ].map((s) => (
        <Card
          key={s.label}
          className="border-border/40 bg-gradient-to-br from-white to-zinc-50/80 shadow-sm dark:from-zinc-950 dark:to-zinc-900/50"
        >
          <CardContent className="p-5">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
              {s.label}
            </p>
            <p className="mt-2 font-heading text-3xl font-semibold">
              {s.value}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}