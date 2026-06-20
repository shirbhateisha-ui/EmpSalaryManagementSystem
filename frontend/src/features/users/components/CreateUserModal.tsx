import { useState, type FormEvent } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { selectClassName } from '@/lib/styles';
import type { ApiErrorResponse } from '@/types/api.types';
import type { Role } from '@/features/auth/types/auth.types';
import { useCreateUserMutation } from '../api/users.api';
import type { CreateUserRequest } from '../types/user.types';

interface CreateUserModalProps {
  onClose: () => void;
}

const ROLES: { value: Role; label: string }[] = [
  { value: 'ADMIN', label: 'Admin' },
  { value: 'HR_MANAGER', label: 'HR Manager' },
  { value: 'VIEWER', label: 'Viewer' },
];

function validate(form: CreateUserRequest) {
  const errors: Partial<Record<keyof CreateUserRequest, string>> = {};
  if (!form.name.trim()) errors.name = 'Name is required';
  if (!form.email.trim()) errors.email = 'Email is required';
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errors.email = 'Enter a valid email';
  if (!form.password) errors.password = 'Password is required';
  else if (form.password.length < 8) errors.password = 'Minimum 8 characters';
  return errors;
}

function extractApiError(error: unknown): string {
  if (error && typeof error === 'object' && 'data' in error) {
    const body = (error as { data: ApiErrorResponse }).data;
    if (!body.success && body.error?.message) return body.error.message;
  }
  return 'Something went wrong. Please try again.';
}

export function CreateUserModal({ onClose }: CreateUserModalProps) {
  const [form, setForm] = useState<CreateUserRequest>({
    name: '',
    email: '',
    password: '',
    role: 'VIEWER',
  });
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof CreateUserRequest, string>>>(
    {},
  );
  const [createUser, { isLoading, error }] = useCreateUserMutation();

  function set(key: keyof CreateUserRequest, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
    setFieldErrors((e) => ({ ...e, [key]: undefined }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const errors = validate(form);
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    try {
      await createUser(form).unwrap();
      onClose();
    } catch {
      // error shown via RTK Query `error` state
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-user-title"
    >
      <Card className="w-full max-w-md">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle id="create-user-title" className="text-lg">
            Add User
          </CardTitle>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-muted-foreground hover:bg-accent"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </CardHeader>

        <CardContent>
          <form onSubmit={(e) => void handleSubmit(e)} noValidate className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="cu-name" className="text-sm font-medium">
                Name
              </label>
              <Input
                id="cu-name"
                value={form.name}
                onChange={(e) => set('name', e.target.value)}
                disabled={isLoading}
                placeholder="Jane Smith"
                aria-invalid={!!fieldErrors.name}
              />
              {fieldErrors.name && <p className="text-xs text-destructive">{fieldErrors.name}</p>}
            </div>

            <div className="space-y-1.5">
              <label htmlFor="cu-email" className="text-sm font-medium">
                Email
              </label>
              <Input
                id="cu-email"
                type="email"
                value={form.email}
                onChange={(e) => set('email', e.target.value)}
                disabled={isLoading}
                placeholder="jane@example.com"
                aria-invalid={!!fieldErrors.email}
              />
              {fieldErrors.email && <p className="text-xs text-destructive">{fieldErrors.email}</p>}
            </div>

            <div className="space-y-1.5">
              <label htmlFor="cu-password" className="text-sm font-medium">
                Password
              </label>
              <Input
                id="cu-password"
                type="password"
                value={form.password}
                onChange={(e) => set('password', e.target.value)}
                disabled={isLoading}
                placeholder="Min. 8 characters"
                aria-invalid={!!fieldErrors.password}
              />
              {fieldErrors.password && (
                <p className="text-xs text-destructive">{fieldErrors.password}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label htmlFor="cu-role" className="text-sm font-medium">
                Role
              </label>
              <select
                id="cu-role"
                value={form.role}
                onChange={(e) => set('role', e.target.value)}
                disabled={isLoading}
                className={selectClassName}
              >
                {ROLES.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>

            {error && (
              <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {extractApiError(error)}
              </p>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Creating…' : 'Create user'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
