import { Dialog } from "radix-ui";
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
  return (
    <Dialog.Root
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) onClose();
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay
          className={cn(
            "fixed inset-0 z-50 bg-zinc-950/60 backdrop-blur-sm",
            "data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:duration-200",
            "data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:duration-150",
          )}
        />
        <Dialog.Content
          onOpenAutoFocus={(e) => {
            // Let the content scroll into view naturally rather than yanking
            // focus to the first input, which felt abrupt on longer forms.
            e.preventDefault();
          }}
          className={cn(
            "fixed left-1/2 top-1/2 z-50 flex max-h-[85vh] w-[calc(100vw-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-3xl border border-white/60 bg-white shadow-[0_30px_90px_rgba(15,23,42,0.25)] dark:border-white/10 dark:bg-zinc-900 sm:w-full",
            "data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=open]:duration-200",
            "data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=closed]:duration-150",
            className,
          )}
        >
          <div className="flex-shrink-0 border-b border-zinc-200/80 p-5 dark:border-zinc-800 sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-0.5">
                <Dialog.Title className="text-xl font-semibold tracking-tight sm:text-2xl">
                  {title}
                </Dialog.Title>
                {description ? (
                  <Dialog.Description className="text-sm text-muted-foreground">
                    {description}
                  </Dialog.Description>
                ) : (
                  // Radix requires a description for a11y; provide a visually
                  // hidden fallback when the caller doesn't pass one.
                  <Dialog.Description className="sr-only">{title}</Dialog.Description>
                )}
              </div>
              <Dialog.Close asChild>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Close dialog"
                  className="flex-shrink-0 rounded-full transition-transform hover:rotate-90"
                >
                  <X className="h-4 w-4" />
                </Button>
              </Dialog.Close>
            </div>
          </div>

          <div className="overflow-y-auto p-5 sm:p-6">{children}</div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}