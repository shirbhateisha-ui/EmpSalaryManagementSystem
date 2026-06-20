import { Users, DollarSign, TrendingUp, TrendingDown, BarChart2, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { SalarySummary } from '../types/analytics.types';

const USD = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});
const COMPACT = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  notation: 'compact',
  maximumFractionDigits: 1,
});

interface KpiCardProps {
  title: string;
  value: string;
  sub?: string;
  icon: React.ReactNode;
}

function KpiCard({ title, value, sub, icon }: KpiCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <span className="text-muted-foreground">{icon}</span>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold">{value}</p>
        {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
      </CardContent>
    </Card>
  );
}

export function KpiCardsSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={i}>
          <CardHeader className="pb-2">
            <Skeleton className="h-4 w-32" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-40" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function KpiCards({ data }: { data: SalarySummary }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <KpiCard
        title="Total Headcount"
        value={data.headcount.toLocaleString()}
        sub="active employees with salary"
        icon={<Users className="h-4 w-4" />}
      />
      <KpiCard
        title="Annual Payroll"
        value={COMPACT.format(data.total_annual_usd)}
        sub={`${USD.format(data.total_annual_usd)} USD/year`}
        icon={<DollarSign className="h-4 w-4" />}
      />
      <KpiCard
        title="Monthly Payroll"
        value={COMPACT.format(data.total_monthly_usd)}
        sub={`${USD.format(data.total_monthly_usd)} USD/month`}
        icon={<Calendar className="h-4 w-4" />}
      />
      <KpiCard
        title="Average Salary"
        value={USD.format(data.avg_annual_usd)}
        sub="per employee / year"
        icon={<BarChart2 className="h-4 w-4" />}
      />
      <KpiCard
        title="Highest Salary"
        value={USD.format(data.max_annual_usd)}
        sub="top of range"
        icon={<TrendingUp className="h-4 w-4" />}
      />
      <KpiCard
        title="Lowest Salary"
        value={USD.format(data.min_annual_usd)}
        sub="bottom of range"
        icon={<TrendingDown className="h-4 w-4" />}
      />
    </div>
  );
}
