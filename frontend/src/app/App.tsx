import { cn } from '@/lib/utils';

/**
 * Phase 0 placeholder app. Confirms React + Tailwind + the `@` alias work.
 * Layout, routing, store, and features arrive in later phases.
 */
export default function App() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-background text-foreground">
      <div className={cn('rounded-lg border bg-card p-8 text-center shadow-sm')}>
        <h1 className="text-2xl font-semibold tracking-tight">ACME Salary Management</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Phase 0 — Foundation scaffold is up and running.
        </p>
      </div>
    </main>
  );
}
