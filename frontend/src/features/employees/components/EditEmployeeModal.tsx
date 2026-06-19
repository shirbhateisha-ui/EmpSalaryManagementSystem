import { useState, type FormEvent } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DatePicker } from '@/components/ui/date-picker';
import type { ApiErrorResponse } from '@/types/api.types';
import { useUpdateEmployeeMutation } from '../api/employees.api';
import type { Employee, UpdateEmployeeRequest } from '../types/employee.types';

interface Props {
  employee: Employee;
  onClose: () => void;
}

function extractApiError(error: unknown): string {
  if (error && typeof error === 'object' && 'data' in error) {
    const body = (error as { data: ApiErrorResponse }).data;
    if (!body.success && body.error?.message) return body.error.message;
  }
  return 'Something went wrong. Please try again.';
}

export function EditEmployeeModal({ employee, onClose }: Props) {
  const [form, setForm] = useState<UpdateEmployeeRequest>({
    name:          employee.name,
    email:         employee.email,
    country:       employee.country,
    department:    employee.department,
    currency_code: employee.currency_code,
    joining_date:  employee.joining_date,
    status:        employee.status,
  });
  const [updateEmployee, { isLoading, error }] = useUpdateEmployeeMutation();

  function set(key: keyof UpdateEmployeeRequest, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    try {
      await updateEmployee({ id: employee.id, body: form }).unwrap();
      onClose();
    } catch { /* shown via error state */ }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true" aria-labelledby="ee-title">
      <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle id="ee-title" className="text-lg">Edit Employee</CardTitle>
          <button type="button" onClick={onClose} className="rounded p-1 text-muted-foreground hover:bg-accent" aria-label="Close">
            <X className="h-4 w-4" />
          </button>
        </CardHeader>
        <CardContent>
          <form onSubmit={(e) => void handleSubmit(e)} noValidate className="space-y-4">
            {(
              [
                { key: 'name',          label: 'Name',          type: 'text' },
                { key: 'email',         label: 'Email',         type: 'email' },
                { key: 'country',       label: 'Country',       type: 'text' },
                { key: 'department',    label: 'Department',    type: 'text' },
                { key: 'currency_code', label: 'Currency Code', type: 'text' },
              ] as const
            ).map(({ key, label, type }) => (
              <div key={key} className="space-y-1.5">
                <label htmlFor={`ee-${key}`} className="text-sm font-medium">{label}</label>
                <Input
                  id={`ee-${key}`}
                  type={type}
                  value={form[key] ?? ''}
                  onChange={(e) => set(key, e.target.value)}
                  disabled={isLoading}
                />
              </div>
            ))}

            <div className="space-y-1.5">
              <label className="text-sm font-medium">Joining Date</label>
              <DatePicker
                value={form.joining_date ?? ''}
                onChange={(v) => set('joining_date', v)}
                disabled={isLoading}
                placeholder="Pick a date"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="ee-status" className="text-sm font-medium">Status</label>
              <select
                id="ee-status"
                value={form.status}
                onChange={(e) => set('status', e.target.value)}
                disabled={isLoading}
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            {error && (
              <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {extractApiError(error)}
              </p>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>Cancel</Button>
              <Button type="submit" disabled={isLoading}>{isLoading ? 'Saving…' : 'Save Changes'}</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
