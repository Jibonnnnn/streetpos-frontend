import type { LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon | React.ElementType;
  change?: string;
  changeColor?: string;
}

export function StatCard({ 
  title, 
  value, 
  icon: Icon, 
  change, 
  changeColor = "text-emerald-600",
}: StatCardProps) {
  return (
    <Card>
      <CardContent className="p-8">
        <div className="flex items-center justify-between">
          <Icon className="w-10 h-10 text-amber-600" />
          {change && <span className={`text-sm font-medium ${changeColor}`}>{change}</span>}
        </div>
        <p className="text-5xl font-semibold mt-6">{value}</p>
        <p className="text-sm text-zinc-500 mt-1">{title}</p>
      </CardContent>
    </Card>
  );
}