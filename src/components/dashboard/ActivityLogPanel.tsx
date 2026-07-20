import {
  PackagePlus,
  PackageMinus,
  Clock3,
  ShoppingCart,
  Activity,
  Inbox,
  Loader2,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import type { ActivityLogEntry, ActivityLogType } from '@/types';

const typeConfig: Record<
  ActivityLogType,
  { icon: React.ElementType; iconClass: string; label: string }
> = {
  InventoryAddition: {
    icon: PackagePlus,
    iconClass: 'bg-emerald-500/10 text-emerald-600 dark:bg-emerald-400/10 dark:text-emerald-300',
    label: 'Stock added',
  },
  InventoryDeduction: {
    icon: PackageMinus,
    iconClass: 'bg-red-500/10 text-red-600 dark:bg-red-400/10 dark:text-red-300',
    label: 'Stock deducted',
  },
  TimeClockIn: {
    icon: Clock3,
    iconClass: 'bg-blue-500/10 text-blue-600 dark:bg-blue-400/10 dark:text-blue-300',
    label: 'Clocked in',
  },
  TimeClockOut: {
    icon: Clock3,
    iconClass: 'bg-zinc-500/10 text-zinc-600 dark:bg-zinc-400/10 dark:text-zinc-300',
    label: 'Clocked out',
  },
  PurchaseOrder: {
    icon: ShoppingCart,
    iconClass: 'bg-amber-500/10 text-amber-600 dark:bg-amber-400/10 dark:text-amber-300',
    label: 'Purchase',
  },
  Other: {
    icon: Activity,
    iconClass: 'bg-zinc-500/10 text-zinc-600 dark:bg-zinc-400/10 dark:text-zinc-300',
    label: 'Activity',
  },
};

function formatRelativeTime(iso: string): string {
  const date = new Date(iso);
  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.round(diffMs / 60000);

  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.round(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

type ActivityLogPanelProps = {
  entries: ActivityLogEntry[];
  loading: boolean;
  errored?: boolean;
};

export function ActivityLogPanel({ entries, loading, errored }: ActivityLogPanelProps) {
  return (
    <Card className="border-border/60 bg-white/80 shadow-sm dark:bg-zinc-900/75 lg:col-span-2">
      <CardContent className="p-6 md:p-7">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <h2 className="font-heading text-xl font-semibold tracking-tight">Activity log</h2>
            <p className="text-sm text-muted-foreground">Inventory, time clock &amp; purchases</p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-zinc-500/10 text-zinc-600 dark:bg-zinc-400/10 dark:text-zinc-300">
            <Activity className="h-4 w-4" />
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border/70 bg-muted/20 py-16 text-sm text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            Loading activity...
          </div>
        ) : errored ? (
          <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border/70 bg-muted/20 py-16 text-center text-sm text-muted-foreground">
            <Inbox className="h-6 w-6" />
            <p>Activity log isn't available yet.</p>
            <p className="max-w-xs text-xs">
              This panel needs the <code className="rounded bg-zinc-200/70 px-1 py-0.5 dark:bg-zinc-800">GET /dashboard/activity-log</code> endpoint on the backend.
            </p>
          </div>
        ) : entries.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border/70 bg-muted/20 py-16 text-center text-sm text-muted-foreground">
            <Inbox className="h-6 w-6" />
            No recent activity yet.
          </div>
        ) : (
          <div className="max-h-[26rem] space-y-3 overflow-y-auto pr-1">
            {entries.map((entry) => {
              const config = typeConfig[entry.type] ?? typeConfig.Other;
              const Icon = config.icon;

              return (
                <div
                  key={entry.id}
                  className="flex items-start gap-3 rounded-2xl border border-border/60 bg-zinc-50 p-3.5 transition-all hover:-translate-y-0.5 hover:bg-white hover:shadow-md dark:bg-zinc-950/50"
                >
                  <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl ${config.iconClass}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-sm font-medium leading-5 tracking-tight">{entry.message}</p>
                      {typeof entry.quantity === 'number' ? (
                        <span
                          className={`whitespace-nowrap text-sm font-semibold ${entry.quantity < 0 ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}
                        >
                          {entry.quantity > 0 ? '+' : ''}
                          {entry.quantity}
                          {entry.unit ? ` ${entry.unit}` : ''}
                        </span>
                      ) : null}
                    </div>
                    <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                      {entry.actorName ? <span>{entry.actorName}</span> : null}
                      {entry.actorName ? <span>·</span> : null}
                      <span>{formatRelativeTime(entry.createdAt)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}