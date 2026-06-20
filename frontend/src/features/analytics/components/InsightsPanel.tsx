import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type {
  CountryPayroll,
  DepartmentPayroll,
  SalaryBand,
  SalarySummary,
  TopEarner,
} from '../types/analytics.types';

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

interface InsightData {
  summary: SalarySummary;
  byCountry: CountryPayroll[];
  byDepartment: DepartmentPayroll[];
  distribution: SalaryBand[];
  topEarners: TopEarner[];
}

interface QuestionProps {
  question: string;
  children: React.ReactNode;
}

function InsightRow({ question, children }: QuestionProps) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b last:border-0">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between py-3 px-4 text-left text-sm font-medium hover:bg-muted/50 transition-colors"
        aria-expanded={open}
      >
        {question}
        {open ? (
          <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
        ) : (
          <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
        )}
      </button>
      {open && <div className="px-4 pb-4 text-sm text-muted-foreground">{children}</div>}
    </div>
  );
}

export function InsightsPanel({
  summary,
  byCountry,
  byDepartment,
  distribution,
  topEarners,
}: InsightData) {
  const highestCountry = byCountry[0];
  const highestDept = byDepartment[0];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Insights & Reporting</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <InsightRow question="What is our total monthly payroll spend?">
          <p className="text-2xl font-bold text-foreground">
            {USD.format(summary.total_monthly_usd)}
            <span className="text-base font-normal text-muted-foreground">/month</span>
          </p>
          <p className="mt-1">
            Annual total: {USD.format(summary.total_annual_usd)} across {summary.headcount}{' '}
            employees.
          </p>
        </InsightRow>

        <InsightRow question="Which country has the highest payroll cost?">
          {highestCountry ? (
            <p>
              <span className="font-semibold text-foreground">{highestCountry.country}</span> —{' '}
              {COMPACT.format(highestCountry.total_annual_usd)}/year ({highestCountry.headcount}{' '}
              employees, avg {USD.format(highestCountry.avg_annual_usd)}).
            </p>
          ) : (
            <p>No data available.</p>
          )}
        </InsightRow>

        <InsightRow question="What is the average salary by department?">
          {byDepartment.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Department</TableHead>
                  <TableHead className="text-right">Avg Annual (USD)</TableHead>
                  <TableHead className="text-right">Headcount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {byDepartment.map((d) => (
                  <TableRow key={d.department}>
                    <TableCell>{d.department}</TableCell>
                    <TableCell className="text-right">{USD.format(d.avg_annual_usd)}</TableCell>
                    <TableCell className="text-right">{d.headcount}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p>No department data available.</p>
          )}
        </InsightRow>

        <InsightRow question="Which department has the highest total payroll?">
          {highestDept ? (
            <p>
              <span className="font-semibold text-foreground">{highestDept.department}</span> —{' '}
              {COMPACT.format(highestDept.total_annual_usd)}/year ({highestDept.headcount}{' '}
              employees).
            </p>
          ) : (
            <p>No data available.</p>
          )}
        </InsightRow>

        <InsightRow question="Who are the top 10 highest paid employees?">
          {topEarners.length > 0 ? (
            <ol className="space-y-1 mt-1">
              {topEarners.slice(0, 10).map((e, i) => (
                <li key={e.id} className="flex justify-between">
                  <span>
                    <span className="text-muted-foreground mr-2">{i + 1}.</span>
                    {e.name} <span className="text-muted-foreground">({e.department})</span>
                  </span>
                  <span className="font-medium text-foreground">{USD.format(e.annual_usd)}</span>
                </li>
              ))}
            </ol>
          ) : (
            <p>No earner data available.</p>
          )}
        </InsightRow>

        <InsightRow question="How are salaries distributed across bands?">
          {distribution.some((b) => b.headcount > 0) ? (
            <div className="space-y-2 mt-1">
              {distribution.map((b) => (
                <div key={b.band} className="flex items-center justify-between">
                  <span>{b.band}</span>
                  <span className="font-medium text-foreground">{b.headcount} employees</span>
                </div>
              ))}
            </div>
          ) : (
            <p>No salary data available.</p>
          )}
        </InsightRow>
      </CardContent>
    </Card>
  );
}
