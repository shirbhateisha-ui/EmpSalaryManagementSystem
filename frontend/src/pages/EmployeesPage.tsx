import { EmptyState } from '@/components/states/EmptyState';

export default function EmployeesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Employees</h2>
        <p className="text-sm text-muted-foreground">
          Employee list and management arrive in Phase 8.
        </p>
      </div>
      <EmptyState
        title="Employees coming soon"
        description="The backend employees API (Phase 5) and this screen (Phase 8) are not built yet."
      />
    </div>
  );
}
