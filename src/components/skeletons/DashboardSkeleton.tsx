import { Skeleton } from "@/components/common/Skeleton";

export function DashboardSkeleton() {
  return (
    <div className="space-y-8">
      <div className="space-y-3 border-b border-border/60 pb-6">
        <Skeleton className="h-10 w-72 rounded-2xl" />
        <Skeleton className="h-5 w-[32rem] max-w-full rounded-xl" />
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="rounded-3xl border border-border/60 bg-white/80 p-6 dark:bg-zinc-900/70">
            <Skeleton className="h-8 w-8 rounded-2xl" />
            <Skeleton className="mt-6 h-12 w-28 rounded-2xl" />
            <Skeleton className="mt-3 h-4 w-32 rounded-xl" />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <div className="space-y-4">
          <Skeleton className="h-6 w-56 rounded-xl" />
          <div className="rounded-3xl border border-border/60 bg-white/80 p-6 dark:bg-zinc-900/70">
            <Skeleton className="h-56 w-full rounded-2xl" />
          </div>
        </div>

        <div className="space-y-4">
          <Skeleton className="h-6 w-40 rounded-xl" />
          <div className="rounded-3xl border border-border/60 bg-white/80 p-6 dark:bg-zinc-900/70">
            <Skeleton className="h-40 w-full rounded-2xl" />
            <Skeleton className="mt-4 h-4 w-40 rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
}