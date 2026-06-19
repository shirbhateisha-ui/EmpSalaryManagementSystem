import { useState } from 'react';
import { TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { LoadingState } from '@/components/states/LoadingState';
import { EmptyState } from '@/components/states/EmptyState';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useGetEmployeeSalariesQuery } from '../api/employees.api';
import { AddRaiseModal } from './AddRaiseModal';
import type { Employee } from '../types/employee.types';

const USD = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

interface SalaryHistoryProps {
  employee: Employee;
}

export function SalaryHistory({ employee }: SalaryHistoryProps) {
  const { user } = useAuth();
  const [showRaiseModal, setShowRaiseModal] = useState(false);
  const { data: salaries, isLoading } = useGetEmployeeSalariesQuery(employee.id);

  const canWrite = user?.role === 'ADMIN' || user?.role === 'HR_MANAGER';

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Salary History</h2>
        {canWrite && (
          <Button size="sm" className="gap-2" onClick={() => setShowRaiseModal(true)}>
            <TrendingUp className="h-4 w-4" />
            Add Raise
          </Button>
        )}
      </div>

      {isLoading && <LoadingState message="Loading salary history…" />}

      {!isLoading && salaries?.length === 0 && (
        <EmptyState title="No salary records" description="No salary history found for this employee." />
      )}

      {!isLoading && salaries && salaries.length > 0 && (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Effective Date</TableHead>
                <TableHead>Base Salary</TableHead>
                <TableHead>Currency</TableHead>
                <TableHead>Country</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {salaries.map((s) => (
                <TableRow key={s.id}>
                  <TableCell>{s.effective_date}</TableCell>
                  <TableCell className="font-medium">
                    {new Intl.NumberFormat('en-US', {
                      style: 'currency',
                      currency: s.currency_code,
                      maximumFractionDigits: 0,
                    }).format(s.base_salary)}
                    {s.currency_code !== 'USD' && (
                      <span className="ml-2 text-xs text-muted-foreground">
                        ≈ {USD.format(s.base_salary_usd)}
                      </span>
                    )}
                  </TableCell>
                  <TableCell>{s.currency_code}</TableCell>
                  <TableCell>{s.country}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {showRaiseModal && (
        <AddRaiseModal
          employeeId={employee.id}
          employeeCountry={employee.country}
          employeeCurrency={employee.currency_code}
          onClose={() => setShowRaiseModal(false)}
        />
      )}
    </div>
  );
}
