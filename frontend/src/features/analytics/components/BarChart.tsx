import { cn } from '@/lib/utils';

export interface BarChartItem {
  label: string;
  value: number;
  sub?: string;
}

interface BarChartProps {
  items: BarChartItem[];
  formatValue?: (v: number) => string;
  className?: string;
  maxBars?: number;
}

const COMPACT = new Intl.NumberFormat('en-US', {
  style: 'currency', currency: 'USD', notation: 'compact', maximumFractionDigits: 1,
});

export function BarChart({
  items,
  formatValue = (v) => COMPACT.format(v),
  className,
  maxBars = 10,
}: BarChartProps) {
  const visible = items.slice(0, maxBars);
  const max = Math.max(...visible.map((i) => i.value), 1);

  return (
    <div className={cn('space-y-2', className)} role="list" aria-label="bar chart">
      {visible.map((item) => {
        const pct = Math.max((item.value / max) * 100, 2);
        return (
          <div key={item.label} role="listitem" className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="truncate font-medium" title={item.label}>{item.label}</span>
              <span className="ml-4 shrink-0 text-muted-foreground">{formatValue(item.value)}</span>
            </div>
            <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-primary transition-all duration-500"
                style={{ width: `${pct}%` }}
                aria-label={`${item.label}: ${formatValue(item.value)}`}
              />
            </div>
            {item.sub && (
              <p className="text-xs text-muted-foreground">{item.sub}</p>
            )}
          </div>
        );
      })}
    </div>
  );
}
