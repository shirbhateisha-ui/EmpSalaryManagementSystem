import { EmptyState } from '@/components/states/EmptyState';

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Analytics</h2>
        <p className="text-sm text-muted-foreground">
          Payroll analytics dashboard arrives in Phase 9.
        </p>
      </div>
      <EmptyState
        title="Analytics coming soon"
        description="The backend analytics API (Phase 7) and this dashboard (Phase 9) are not built yet."
      />
    </div>
  );
}
