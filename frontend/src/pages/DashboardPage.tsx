import { useGetHealthQuery } from '@/services/systemApi';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LoadingState } from '@/components/states/LoadingState';
import { ErrorState } from '@/components/states/ErrorState';
import { useToast } from '@/hooks/useToast';
import { getApiOrigin } from '@/types/api.types';

export default function DashboardPage() {
  const { toast } = useToast();
  const { data, error, isLoading, isFetching, refetch } = useGetHealthQuery();

  const handlePing = () => {
    void refetch();
    toast({
      title: 'Checking API',
      description: `Pinging ${getApiOrigin()}/health`,
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Dashboard</h2>
        <p className="text-sm text-muted-foreground">
          Application shell connected to the backend API.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>API health check</CardTitle>
          <CardDescription>
            Live request to{' '}
            <code className="rounded bg-muted px-1 py-0.5">{getApiOrigin()}/health</code>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? <LoadingState message="Contacting backend…" /> : null}

          {!isLoading && error ? (
            <ErrorState
              title="Backend unreachable"
              message="Start the backend with npm run dev:backend and ensure CORS is configured."
              onRetry={() => void refetch()}
            />
          ) : null}

          {!isLoading && !error && data ? (
            <div className="rounded-md border bg-muted/40 p-4">
              <p className="text-sm font-medium text-green-700">Connected</p>
              <pre className="mt-2 overflow-x-auto text-xs">{JSON.stringify(data, null, 2)}</pre>
            </div>
          ) : null}

          <Button variant="outline" onClick={handlePing} disabled={isLoading || isFetching}>
            Re-check health
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
