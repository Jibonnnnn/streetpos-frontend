import { Skeleton } from "@/components/common/Skeleton";

export function CashierSkeleton() {
  return (
    <div className="space-y-8">
      <div className="space-y-3 border-b border-border/60 pb-6">
        <Skeleton className="h-10 w-72 rounded-2xl" />
        <Skeleton className="h-5 w-[34rem] max-w-full rounded-xl" />
      </div>

      <div className="grid gap-8 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="overflow-hidden rounded-3xl border border-border/60 bg-white/80 dark:bg-zinc-900/70">
                <Skeleton className="h-40 w-full rounded-none" />
                <div className="space-y-3 p-4">
                  <Skeleton className="h-5 w-32 rounded-xl" />
                  <Skeleton className="h-7 w-24 rounded-xl" />
                  <Skeleton className="h-4 w-40 rounded-xl" />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-5 space-y-6">
          <div className="rounded-3xl border border-border/60 bg-white/80 p-6 dark:bg-zinc-900/70">
            <Skeleton className="h-8 w-40 rounded-xl" />
            <div className="mt-6 space-y-4">
              {Array.from({ length: 3 }).map((_, index) => (
                <Skeleton key={index} className="h-20 w-full rounded-2xl" />
              ))}
            </div>
            <Skeleton className="mt-8 h-16 w-full rounded-3xl" />
          </div>

          <div className="rounded-3xl border border-border/60 bg-white/80 p-6 dark:bg-zinc-900/70">
            <Skeleton className="h-8 w-48 rounded-xl" />
            <div className="mt-6 space-y-3">
              {Array.from({ length: 4 }).map((_, index) => (
                <Skeleton key={index} className="h-18 w-full rounded-2xl" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}