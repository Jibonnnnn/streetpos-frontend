import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ModalShellProps = {
  open: boolean;
  title: string;
  description?: string;
  children: React.ReactNode;
  onClose: () => void;
  className?: string;
};

export function ModalShell({
  open,
  title,
  description,
  children,
  onClose,
  className,
}: ModalShellProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className={cn(
          "w-full max-h-[95vh] max-w-md overflow-auto rounded-3xl bg-white dark:bg-zinc-900",
          className,
        )}
      >
        <div className="border-b border-zinc-200/80 p-6 dark:border-zinc-800 md:p-8">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <h2 id="modal-title" className="text-2xl font-semibold tracking-tight">
                {title}
              </h2>
              {description ? (
                <p className="text-sm text-muted-foreground">{description}</p>
              ) : null}
            </div>
            <Button variant="ghost" size="icon-sm" onClick={onClose} aria-label="Close dialog">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="p-6 md:p-8">{children}</div>
      </div>
    </div>
  );
}