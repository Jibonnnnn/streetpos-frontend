import { Package, LogIn, ShoppingBag, AlertCircle } from "lucide-react";
import type { ActivityLogEntry } from "@/types";

interface Props {
  entries?: ActivityLogEntry[];
  loading?: boolean;
}

const config: Record<string, { icon: React.ElementType; color: string }> = {
  Login: { icon: LogIn, color: "text-blue-600 bg-blue-50 dark:bg-blue-950/40" },
  InventoryAddition: {
    icon: Package,
    color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40",
  },
  InventoryDeduction: {
    icon: Package,
    color: "text-rose-600 bg-rose-50 dark:bg-rose-950/40",
  },
  OrderCompleted: {
    icon: ShoppingBag,
    color: "text-amber-600 bg-amber-50 dark:bg-amber-950/40",
  },
  Other: {
    icon: AlertCircle,
    color: "text-zinc-600 bg-zinc-100 dark:bg-zinc-800",
  },
};

export function ActivityLogPanel({ entries = [], loading = false }: Props) {
  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-16 animate-pulse rounded-2xl bg-zinc-100 dark:bg-zinc-800"
          />
        ))}
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-border/70 bg-muted/20 py-12 text-center text-muted-foreground">
        <Package className="mx-auto mb-3 h-8 w-8 opacity-40" />
        <p>No recent activity yet.</p>
      </div>
    );
  }

  return (
    <div className="max-h-[360px] space-y-3 overflow-y-auto pr-1">
      {entries.map((entry) => {
        const { icon: Icon, color } = config[entry.type] || config.Other;

        return (
          <div
            key={entry.id}
            className="flex items-start gap-3 rounded-2xl border border-border/50 bg-zinc-50/80 p-3.5 dark:bg-zinc-900/40"
          >
            <div
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${color}`}
            >
              <Icon className="h-4 w-4" />
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium leading-snug">
                {entry.message}
              </p>
              <div className="mt-1 flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
                {entry.actorName && (
                  <span className="font-medium">{entry.actorName}</span>
                )}
                <span>•</span>
                <span>
                  {new Date(
                    entry.createdAt.endsWith("Z")
                      ? entry.createdAt
                      : entry.createdAt + "Z",
                  ).toLocaleString([], {
                    month: "short",
                    day: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                    hour12: true,
                  })}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
