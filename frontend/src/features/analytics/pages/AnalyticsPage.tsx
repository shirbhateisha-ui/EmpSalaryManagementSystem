import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingState } from '@/components/states/LoadingState';
import { ErrorState } from '@/components/states/ErrorState';
import { EmptyState } from '@/components/states/EmptyState';
import {
  useGetSummaryQuery,
  useGetByCountryQuery,
  useGetByDepartmentQuery,
  useGetDistributionQuery,
  useGetTopEarnersQuery,
} from '../api/analytics.api';
import { KpiCards, KpiCardsSkeleton } from '../components/KpiCards';
import { BarChart } from '../components/BarChart';
import { TopEarnersTable } from '../components/TopEarnersTable';
import { InsightsPanel } from '../components/InsightsPanel';

const USD = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

export default function AnalyticsPage() {
  const summary     = useGetSummaryQuery();
  const byCountry   = useGetByCountryQuery();
  const byDept      = useGetByDepartmentQuery();
  const distribution = useGetDistributionQuery();
  const topEarners  = useGetTopEarnersQuery(10);

  const isLoading = summary.isLoading || byCountry.isLoading || byDept.isLoading
    || distribution.isLoading || topEarners.isLoading;
  const isError = summary.isError || byCountry.isError || byDept.isError
    || distribution.isError || topEarners.isError;

  const isEmpty = !isLoading && !isError
    && summary.data?.headcount === 0;

  function refetchAll() {
    void summary.refetch();
    void byCountry.refetch();
    void byDept.refetch();
    void distribution.refetch();
    void topEarners.refetch();
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Analytics</h1>
        <p className="text-sm text-muted-foreground">
          USD-normalised payroll insights across all active employees.
        </p>
      </div>

      {isLoading && (
        <>
          <KpiCardsSkeleton />
          <LoadingState message="Loading analytics…" />
        </>
      )}

      {isError && (
        <ErrorState
          title="Failed to load analytics"
          message="Could not fetch payroll data. Please try again."
          onRetry={refetchAll}
        />
      )}

      {isEmpty && (
        <EmptyState
          title="No payroll data yet"
          description="Add employees and salary records to see analytics."
        />
      )}

      {!isLoading && !isError && !isEmpty && summary.data && (
        <>
          {/* KPI cards */}
          <KpiCards data={summary.data} />

          {/* Charts row */}
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Payroll by Country</CardTitle>
              </CardHeader>
              <CardContent>
                {byCountry.data && byCountry.data.length > 0 ? (
                  <BarChart
                    items={byCountry.data.map((c) => ({
                      label: c.country,
                      value: c.total_annual_usd,
                      sub: `${c.headcount} employees · avg ${USD.format(c.avg_annual_usd)}`,
                    }))}
                    maxBars={8}
                  />
                ) : (
                  <p className="text-sm text-muted-foreground">No country data.</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Payroll by Department</CardTitle>
              </CardHeader>
              <CardContent>
                {byDept.data && byDept.data.length > 0 ? (
                  <BarChart
                    items={byDept.data.map((d) => ({
                      label: d.department,
                      value: d.total_annual_usd,
                      sub: `${d.headcount} employees · avg ${USD.format(d.avg_annual_usd)}`,
                    }))}
                    maxBars={8}
                  />
                ) : (
                  <p className="text-sm text-muted-foreground">No department data.</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Distribution histogram */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Salary Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              {distribution.data ? (
                <BarChart
                  items={distribution.data.map((b) => ({
                    label: b.band,
                    value: b.headcount,
                  }))}
                  formatValue={(v) => `${v} employees`}
                />
              ) : (
                <p className="text-sm text-muted-foreground">No distribution data.</p>
              )}
            </CardContent>
          </Card>

          {/* Top earners */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Top 10 Earners</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {topEarners.data && topEarners.data.length > 0 ? (
                <TopEarnersTable earners={topEarners.data} />
              ) : (
                <div className="p-6">
                  <p className="text-sm text-muted-foreground">No earner data.</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Insights panel */}
          {summary.data && byCountry.data && byDept.data && distribution.data && topEarners.data && (
            <InsightsPanel
              summary={summary.data}
              byCountry={byCountry.data}
              byDepartment={byDept.data}
              distribution={distribution.data}
              topEarners={topEarners.data}
            />
          )}
        </>
      )}
    </div>
  );
}
