import type { LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon | React.ElementType;
  change?: string;
  changeColor?: string;
  className?: string;
}

export function StatCard({ 
  title, 
  value, 
  icon: Icon, 
  change, 
  changeColor = "text-emerald-600",
  className,
}: StatCardProps) {
  return (
    <Card className={cn("border-border/60 bg-white/80 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg dark:bg-zinc-900/75", className)}>
      <CardContent className="p-6 md:p-7">
        <div className="flex items-start justify-between gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600 ring-1 ring-amber-500/10 dark:bg-amber-400/10 dark:text-amber-300">
            <Icon className="h-5 w-5" />
          </div>
          {change ? <span className={`text-sm font-medium ${changeColor}`}>{change}</span> : null}
        </div>

        <p className="mt-6 font-heading text-4xl font-semibold tracking-tight md:text-5xl">{value}</p>
        <p className="mt-1 text-sm text-muted-foreground">{title}</p>
      </CardContent>
    </Card>
  );
}