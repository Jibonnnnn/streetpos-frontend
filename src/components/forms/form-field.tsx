import { cn } from "@/lib/utils";

type FormFieldProps = {
  label: string;
  description?: string;
  error?: string;
  className?: string;
  children: React.ReactNode;
};

export function FormField({ label, description, error, className, children }: FormFieldProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <div className="space-y-1">
        <label className="text-sm font-medium text-foreground">{label}</label>
        {description ? <p className="text-xs leading-5 text-muted-foreground">{description}</p> : null}
      </div>
      {children}
      {error ? <p className="text-sm text-red-500">{error}</p> : null}
    </div>
  );
}