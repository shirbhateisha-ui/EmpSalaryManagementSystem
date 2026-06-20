import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingState } from '@/components/states/LoadingState';
import { ErrorState } from '@/components/states/ErrorState';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useGetEmployeeQuery } from '../api/employees.api';
import { SalaryHistory } from '../components/SalaryHistory';
import { EditEmployeeModal } from '../components/EditEmployeeModal';

const USD = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between py-2 border-b last:border-0 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-right">{value}</span>
    </div>
  );
}

export default function EmployeeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const canWrite = user?.role === 'ADMIN' || user?.role === 'HR_MANAGER';
  const [showEdit, setShowEdit] = useState(false);

  const { data: employee, isLoading, isError } = useGetEmployeeQuery(Number(id));

  if (isLoading) return <LoadingState message="Loading employee…" />;

  if (isError || !employee) {
    return (
      <ErrorState
        title="Employee not found"
        message="This employee does not exist or could not be loaded."
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/employees">
            <Button variant="ghost" size="sm" className="gap-1">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-semibold">{employee.name}</h1>
            <p className="text-sm text-muted-foreground">{employee.email}</p>
          </div>
        </div>
        {canWrite && (
          <Button variant="outline" size="sm" onClick={() => setShowEdit(true)} className="gap-2">
            <Pencil className="h-4 w-4" />
            Edit
          </Button>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Profile</CardTitle>
          </CardHeader>
          <CardContent>
            <DetailRow label="Department" value={employee.department} />
            <DetailRow label="Country" value={employee.country} />
            <DetailRow label="Joining Date" value={employee.joining_date} />
            <DetailRow label="Currency" value={employee.currency_code} />
            <DetailRow
              label="Status"
              value={employee.status === 'active' ? 'Active' : 'Inactive'}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Current Salary</CardTitle>
          </CardHeader>
          <CardContent>
            {employee.current_salary ? (
              <>
                <DetailRow
                  label="Annual (local)"
                  value={new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: employee.current_salary.currency_code,
                    maximumFractionDigits: 0,
                  }).format(employee.current_salary.base_salary)}
                />
                <DetailRow
                  label="Annual (USD)"
                  value={USD.format(employee.current_salary.base_salary_usd)}
                />
                <DetailRow
                  label="Monthly (USD)"
                  value={USD.format(employee.current_salary.base_salary_usd / 12)}
                />
                <DetailRow label="Effective Date" value={employee.current_salary.effective_date} />
              </>
            ) : (
              <p className="text-sm text-muted-foreground py-2">No salary on record.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <SalaryHistory employee={employee} />

      {showEdit && <EditEmployeeModal employee={employee} onClose={() => setShowEdit(false)} />}
    </div>
  );
}
