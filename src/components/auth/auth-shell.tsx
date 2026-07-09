import { BadgePill } from "@/components/common/BadgePill";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { CheckCircle2, ShieldCheck, Sparkles } from "lucide-react";

type AuthShellProps = {
  title: string;
  description: string;
  children: React.ReactNode;
  className?: string;
};

const trustPoints = [
  "Role-based access and live dashboard updates",
  "Centralized menu, inventory, and order flows",
  "Production-ready layout with responsive behavior",
];

export function AuthShell({ title, description, children, className }: AuthShellProps) {
  return (
    <div className={cn("min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(251,146,60,0.16),_transparent_24%),radial-gradient(circle_at_bottom_right,_rgba(245,158,11,0.12),_transparent_22%),linear-gradient(180deg,_#fffaf5_0%,_#ffffff_45%,_#f8fafc_100%)] p-4 sm:p-6 lg:p-8", className)}>
      <div className="mx-auto grid min-h-[calc(100vh-2rem)] max-w-7xl overflow-hidden rounded-[2rem] border border-white/70 bg-white/75 shadow-[0_30px_100px_rgba(15,23,42,0.12)] backdrop-blur-xl dark:border-white/10 dark:bg-zinc-950/70 lg:grid-cols-[1fr_1.05fr]">
        <div className="relative flex flex-col justify-between overflow-hidden bg-[linear-gradient(160deg,_rgba(249,115,22,0.96),_rgba(234,88,12,0.92),_rgba(127,29,29,0.92))] p-8 text-white sm:p-10 lg:p-12">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(255,255,255,0.22),_transparent_28%),radial-gradient(circle_at_bottom_left,_rgba(255,255,255,0.12),_transparent_24%)]" />

          <div className="relative z-10 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 text-white backdrop-blur-sm">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xl font-semibold tracking-tight">StreetPOS</p>
              <p className="text-sm text-white/80">Café Operations Platform</p>
            </div>
          </div>

          <div className="relative z-10 space-y-6">
            <BadgePill tone="neutral" className="w-fit bg-white/15 text-white">
              Secure access
            </BadgePill>
            <div className="space-y-4">
              <h1 className="max-w-md font-heading text-4xl font-semibold tracking-tight sm:text-5xl">
                Run the café from one polished workspace.
              </h1>
              <p className="max-w-lg text-sm leading-7 text-white/85 sm:text-base">
                Clean role-based access, live dashboards, inventory control, and point-of-sale workflows designed for fast staff onboarding.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {trustPoints.map((point) => (
                <div key={point} className="flex items-start gap-3 rounded-3xl border border-white/15 bg-white/10 p-4 backdrop-blur-sm">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-white/90" />
                  <p className="text-sm leading-6 text-white/90">{point}</p>
                </div>
              ))}
            </div>
          </div>

          <Card className="relative z-10 border-white/10 bg-white/12 shadow-none">
            <CardContent className="p-5 text-white">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-medium">Enterprise-ready UX</p>
                  <p className="text-xs text-white/75">Responsive, accessible, and built for scale</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex items-center justify-center p-6 sm:p-10 lg:p-12">
          <div className="w-full max-w-md space-y-8">
            <div className="space-y-3">
              <p className="text-sm font-medium uppercase tracking-[0.24em] text-muted-foreground">Sign in</p>
              <h2 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h2>
              <p className="max-w-sm text-sm leading-6 text-muted-foreground">{description}</p>
            </div>

            {children}
          </div>
        </div>
      </div>
    </div>
  );
}