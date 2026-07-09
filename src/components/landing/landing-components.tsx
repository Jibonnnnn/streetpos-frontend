import { Card, CardContent } from "@/components/ui/card";
import { BadgePill } from "@/components/common/BadgePill";
import { cn } from "@/lib/utils";

type LandingSectionProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  className?: string;
};

export function LandingSection({ eyebrow, title, description, className }: LandingSectionProps) {
  return (
    <div className={cn("space-y-3", className)}>
      {eyebrow ? <BadgePill tone="warning" className="w-fit">{eyebrow}</BadgePill> : null}
      <h2 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h2>
      {description ? <p className="max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">{description}</p> : null}
    </div>
  );
}

type LandingMetricProps = {
  label: string;
  value: string;
};

export function LandingMetric({ label, value }: LandingMetricProps) {
  return (
    <div className="rounded-3xl border border-white/80 bg-white/75 p-4 shadow-sm backdrop-blur-sm">
      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{label}</p>
      <p className="mt-2 text-xl font-semibold tracking-tight">{value}</p>
    </div>
  );
}

type LandingCardProps = {
  title: string;
  description: string;
  children?: React.ReactNode;
};

export function LandingCard({ title, description, children }: LandingCardProps) {
  return (
    <Card className="border-white/80 bg-white/75 shadow-sm backdrop-blur-sm">
      <CardContent className="p-6">
        <h3 className="font-heading text-xl font-semibold tracking-tight">{title}</h3>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">{description}</p>
        {children ? <div className="mt-4">{children}</div> : null}
      </CardContent>
    </Card>
  );
}