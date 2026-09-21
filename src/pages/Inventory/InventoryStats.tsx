import { Card, CardContent } from "@/components/ui/card";
import { Boxes, Banknote, AlertTriangle } from "lucide-react";

type InventoryStatsProps = {
  totalItems: number;
  totalValue: number;
  lowStockCount: number;
};

export function InventoryStats({
  totalItems,
  totalValue,
  lowStockCount,
}: InventoryStatsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <Card className="border-border/40 bg-gradient-to-br from-white to-zinc-50/80 shadow-sm dark:from-zinc-950 dark:to-zinc-900/50">
        <CardContent className="p-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 text-white">
            <Boxes className="h-5 w-5" />
          </div>
          <p className="mt-4 text-xs font-medium uppercase tracking-[0.15em] text-muted-foreground">
            Total Items
          </p>
          <p className="mt-1 font-heading text-3xl font-semibold">
            {totalItems}
          </p>
        </CardContent>
      </Card>

      <Card className="border-border/40 bg-gradient-to-br from-white to-zinc-50/80 shadow-sm dark:from-zinc-950 dark:to-zinc-900/50">
        <CardContent className="p-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white">
            <Banknote className="h-5 w-5" />
          </div>
          <p className="mt-4 text-xs font-medium uppercase tracking-[0.15em] text-muted-foreground">
            Inventory Value
          </p>
          <p className="mt-1 font-heading text-3xl font-semibold">
            ₱
            {totalValue.toLocaleString("en-PH", {
              minimumFractionDigits: 2,
            })}
          </p>
        </CardContent>
      </Card>

      <Card className="border-border/40 bg-gradient-to-br from-white to-zinc-50/80 shadow-sm dark:from-zinc-950 dark:to-zinc-900/50">
        <CardContent className="p-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-500 to-red-600 text-white">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <p className="mt-4 text-xs font-medium uppercase tracking-[0.15em] text-muted-foreground">
            Low Stock
          </p>
          <p className="mt-1 font-heading text-3xl font-semibold">
            {lowStockCount}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}