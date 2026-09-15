import { WifiOff, CloudUpload, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BadgePill } from "@/components/common/BadgePill";

type Props = {
  isOnline: boolean;
  pendingCount: number;
  isSyncing: boolean;
  onSyncNow?: () => void;
};

export function OfflineBanner({
  isOnline,
  pendingCount,
  isSyncing,
  onSyncNow,
}: Props) {
  if (isOnline && pendingCount === 0 && !isSyncing) return null;

  if (!isOnline) {
    return (
      <div
        role="status"
        className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-300/70 bg-amber-50 px-4 py-3 text-amber-950 dark:border-amber-500/40 dark:bg-amber-950/40 dark:text-amber-100"
      >
        <div className="flex items-center gap-3">
          <WifiOff className="h-5 w-5 shrink-0" />
          <div>
            <p className="text-sm font-semibold">You are offline</p>
            <p className="text-xs opacity-90">
              POS orders are saved on this device and will sync when the
              connection returns.
              {pendingCount > 0
                ? ` ${pendingCount} order${pendingCount === 1 ? "" : "s"} queued.`
                : ""}
            </p>
          </div>
        </div>
        {pendingCount > 0 && (
          <BadgePill tone="warning">{pendingCount} queued</BadgePill>
        )}
      </div>
    );
  }

  return (
    <div
      role="status"
      className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-sky-300/70 bg-sky-50 px-4 py-3 text-sky-950 dark:border-sky-500/40 dark:text-sky-100"
    >
      <div className="flex items-center gap-3">
        {isSyncing ? (
          <Loader2 className="h-5 w-5 shrink-0 animate-spin" />
        ) : (
          <CloudUpload className="h-5 w-5 shrink-0" />
        )}
        <div>
          <p className="text-sm font-semibold">
            {isSyncing
              ? "Syncing offline orders…"
              : `${pendingCount} offline order${pendingCount === 1 ? "" : "s"} waiting`}
          </p>
          <p className="text-xs opacity-90">
            Orders taken while offline are being uploaded to the server.
          </p>
        </div>
      </div>
      {onSyncNow && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="rounded-xl"
          disabled={isSyncing}
          onClick={onSyncNow}
        >
          <RefreshCw
            className={`mr-1.5 h-3.5 w-3.5 ${isSyncing ? "animate-spin" : ""}`}
          />
          Sync now
        </Button>
      )}
    </div>
  );
}