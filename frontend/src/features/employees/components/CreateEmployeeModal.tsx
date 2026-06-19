import { useState, type FormEvent } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DatePicker } from '@/components/ui/date-picker';
import { COUNTRIES } from '@/lib/countries';
import { CURRENCIES } from '@/lib/currencies';
import { DEPARTMENTS } from '@/lib/departments';
import type { ApiErrorResponse } from '@/types/api.types';
import { useCreateEmployeeMutation } from '../api/employees.api';
import type { CreateEmployeeRequest } from '../types/employee.types';

interface Props { onClose: () => void }

const INITIAL: CreateEmployeeRequest = {
  name: '', email: '', country: '', department: '',
  currency_code: 'USD', joining_date: '', status: 'active',
};

function validate(f: CreateEmployeeRequest) {
  const e: Partial<Record<keyof CreateEmployeeRequest, string>> = {};
  if (!f.name.trim())          e.name          = 'Name is required';
  if (!f.email.trim())         e.email         = 'Email is required';
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email)) e.email = 'Enter a valid email';
  if (!f.country.trim())       e.country       = 'Country is required';
  if (!f.department.trim())    e.department    = 'Department is required';
  if (!f.currency_code.trim()) e.currency_code = 'Currency code is required';
  if (!f.joining_date)         e.joining_date  = 'Joining date is required';
  else if (!/^\d{4}-\d{2}-\d{2}$/.test(f.joining_date)) e.joining_date = 'Use YYYY-MM-DD format';
  return e;
}

function extractApiError(error: unknown): string {
  if (error && typeof error === 'object' && 'data' in error) {
    const body = (error as { data: ApiErrorResponse }).data;
    if (!body.success && body.error?.message) return body.error.message;
  }
  return 'Something went wrong. Please try again.';
}

export function CreateEmployeeModal({ onClose }: Props) {
  const [form, setForm] = useState<CreateEmployeeRequest>(INITIAL);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof CreateEmployeeRequest, string>>>({});
  const [createEmployee, { isLoading, error }] = useCreateEmployeeMutation();

  function set(key: keyof CreateEmployeeRequest, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
    setFieldErrors((e) => ({ ...e, [key]: undefined }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const errors = validate(form);
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;
    try {
      await createEmployee(form).unwrap();
      onClose();
    } catch { /* shown via error state */ }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true" aria-labelledby="ce-title">
      <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle id="ce-title" className="text-lg">Add Employee</CardTitle>
          <button type="button" onClick={onClose} className="rounded p-1 text-muted-foreground hover:bg-accent" aria-label="Close">
            <X className="h-4 w-4" />
          </button>
        </CardHeader>
        <CardContent>
          <form onSubmit={(e) => void handleSubmit(e)} noValidate className="space-y-4">
            {(
              [
                { key: 'name',  label: 'Name',  placeholder: 'Jane Smith',  type: 'text' },
                { key: 'email', label: 'Email', placeholder: 'jane@co.com', type: 'email' },
              ] as const
            ).map(({ key, label, placeholder, type }) => (
              <div key={key} className="space-y-1.5">
                <label htmlFor={`ce-${key}`} className="text-sm font-medium">{label}</label>
                <Input
                  id={`ce-${key}`}
                  type={type}
                  value={form[key] ?? ''}
                  onChange={(e) => set(key, e.target.value)}
                  placeholder={placeholder}
                  disabled={isLoading}
                  aria-invalid={!!fieldErrors[key]}
                />
                {fieldErrors[key] && <p className="text-xs text-destructive">{fieldErrors[key]}</p>}
              </div>
            ))}

            <div className="space-y-1.5">
              <label htmlFor="ce-country" className="text-sm font-medium">Country</label>
              <select
                id="ce-country"
                value={form.country}
                onChange={(e) => set('country', e.target.value)}
                disabled={isLoading}
                aria-invalid={!!fieldErrors.country}
                className={`flex h-9 w-full rounded-md border ${fieldErrors.country ? 'border-destructive' : 'border-input'} bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring`}
              >
                <option value="">-- Select Country --</option>
                {COUNTRIES.map((c) => (
                  <option key={c.code} value={c.name}>{c.name}</option>
                ))}
              </select>
              {fieldErrors.country && <p className="text-xs text-destructive">{fieldErrors.country}</p>}
            </div>

            <div className="space-y-1.5">
              <label htmlFor="ce-department" className="text-sm font-medium">Department</label>
              <select
                id="ce-department"
                value={form.department}
                onChange={(e) => set('department', e.target.value)}
                disabled={isLoading}
                aria-invalid={!!fieldErrors.department}
                className={`flex h-9 w-full rounded-md border ${fieldErrors.department ? 'border-destructive' : 'border-input'} bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring`}
              >
                <option value="">-- Select Department --</option>
                {DEPARTMENTS.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
              {fieldErrors.department && <p className="text-xs text-destructive">{fieldErrors.department}</p>}
            </div>

            <div className="space-y-1.5">
              <label htmlFor="ce-currency_code" className="text-sm font-medium">Currency Code</label>
              <select
                id="ce-currency_code"
                value={form.currency_code}
                onChange={(e) => set('currency_code', e.target.value)}
                disabled={isLoading}
                aria-invalid={!!fieldErrors.currency_code}
                className={`flex h-9 w-full rounded-md border ${fieldErrors.currency_code ? 'border-destructive' : 'border-input'} bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring`}
              >
                <option value="">-- Select Currency --</option>
                {CURRENCIES.map((c) => (
                  <option key={c.code} value={c.code}>{c.code} — {c.name}</option>
                ))}
              </select>
              {fieldErrors.currency_code && <p className="text-xs text-destructive">{fieldErrors.currency_code}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">Joining Date</label>
              <DatePicker
                value={form.joining_date}
                onChange={(v) => set('joining_date', v)}
                disabled={isLoading}
                placeholder="Pick a date"
                aria-invalid={!!fieldErrors.joining_date}
              />
              {fieldErrors.joining_date && <p className="text-xs text-destructive">{fieldErrors.joining_date}</p>}
            </div>

            <div className="space-y-1.5">
              <label htmlFor="ce-status" className="text-sm font-medium">Status</label>
              <select
                id="ce-status"
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
              <Button type="submit" disabled={isLoading}>{isLoading ? 'Creating…' : 'Create Employee'}</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
