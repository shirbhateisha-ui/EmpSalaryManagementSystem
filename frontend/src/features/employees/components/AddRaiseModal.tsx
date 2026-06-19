import { useState, type FormEvent } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DatePicker } from '@/components/ui/date-picker';
import { COUNTRIES } from '@/lib/countries';
import type { ApiErrorResponse } from '@/types/api.types';
import { useAddSalaryMutation } from '../api/employees.api';
import type { AddRaiseRequest } from '../types/employee.types';

interface Props {
  employeeId: number;
  employeeCountry: string;
  employeeCurrency: string;
  onClose: () => void;
}

function extractApiError(error: unknown): string {
  if (error && typeof error === 'object' && 'data' in error) {
    const body = (error as { data: ApiErrorResponse }).data;
    if (!body.success && body.error?.message) return body.error.message;
  }
  return 'Something went wrong. Please try again.';
}

function validate(f: AddRaiseRequest) {
  const e: Partial<Record<keyof AddRaiseRequest, string>> = {};
  if (!f.base_salary || f.base_salary <= 0)    e.base_salary    = 'Must be a positive number';
  if (!f.currency_code.trim())                  e.currency_code  = 'Currency code is required';
  if (!f.country.trim())                        e.country        = 'Country is required';
  if (!f.effective_date)                        e.effective_date = 'Effective date is required';
  else if (!/^\d{4}-\d{2}-\d{2}$/.test(f.effective_date)) e.effective_date = 'Use YYYY-MM-DD format';
  return e;
}

export function AddRaiseModal({ employeeId, employeeCountry, employeeCurrency, onClose }: Props) {
  const [form, setForm] = useState<AddRaiseRequest>({
    base_salary: 0,
    currency_code: employeeCurrency,
    country: employeeCountry,
    effective_date: '',
  });
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof AddRaiseRequest, string>>>({});
  const [addSalary, { isLoading, error }] = useAddSalaryMutation();

  function set(key: keyof AddRaiseRequest, value: string) {
    setForm((f) => ({
      ...f,
      [key]: key === 'base_salary' ? Number(value) : value,
    }));
    setFieldErrors((e) => ({ ...e, [key]: undefined }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const errors = validate(form);
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;
    try {
      await addSalary({ employeeId, body: form }).unwrap();
      onClose();
    } catch { /* shown via error state */ }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true" aria-labelledby="ar-title">
      <Card className="w-full max-w-md">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle id="ar-title" className="text-lg">Add Salary Record</CardTitle>
          <button type="button" onClick={onClose} className="rounded p-1 text-muted-foreground hover:bg-accent" aria-label="Close">
            <X className="h-4 w-4" />
          </button>
        </CardHeader>
        <CardContent>
          <form onSubmit={(e) => void handleSubmit(e)} noValidate className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="ar-salary" className="text-sm font-medium">Base Salary</label>
              <Input
                id="ar-salary"
                type="number"
                min={0}
                value={form.base_salary || ''}
                onChange={(e) => set('base_salary', e.target.value)}
                placeholder="75000"
                disabled={isLoading}
                aria-invalid={!!fieldErrors.base_salary}
              />
              {fieldErrors.base_salary && <p className="text-xs text-destructive">{fieldErrors.base_salary}</p>}
            </div>

            <div className="space-y-1.5">
              <label htmlFor="ar-currency" className="text-sm font-medium">Currency Code</label>
              <Input
                id="ar-currency"
                value={form.currency_code}
                onChange={(e) => set('currency_code', e.target.value.toUpperCase())}
                placeholder="USD"
                disabled={isLoading}
                aria-invalid={!!fieldErrors.currency_code}
              />
              {fieldErrors.currency_code && <p className="text-xs text-destructive">{fieldErrors.currency_code}</p>}
            </div>

            <div className="space-y-1.5">
              <label htmlFor="ar-country" className="text-sm font-medium">Country</label>
              <select
                id="ar-country"
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
              <label className="text-sm font-medium">Effective Date</label>
              <DatePicker
                value={form.effective_date}
                onChange={(v) => set('effective_date', v)}
                disabled={isLoading}
                placeholder="Pick a date"
                aria-invalid={!!fieldErrors.effective_date}
              />
              {fieldErrors.effective_date && <p className="text-xs text-destructive">{fieldErrors.effective_date}</p>}
            </div>

            {error && (
              <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {extractApiError(error)}
              </p>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>Cancel</Button>
              <Button type="submit" disabled={isLoading}>{isLoading ? 'Saving…' : 'Add Salary'}</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
