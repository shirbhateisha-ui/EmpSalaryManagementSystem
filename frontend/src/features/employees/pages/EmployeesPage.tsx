import { useState } from 'react';
import { UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LoadingState } from '@/components/states/LoadingState';
import { EmptyState } from '@/components/states/EmptyState';
import { ErrorState } from '@/components/states/ErrorState';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useDebounce } from '@/hooks/useDebounce';
import { useListEmployeesQuery } from '../api/employees.api';
import { EmployeeFilters } from '../components/EmployeeFilters';
import { EmployeeTable } from '../components/EmployeeTable';
import { PaginationControls } from '../components/PaginationControls';
import { CreateEmployeeModal } from '../components/CreateEmployeeModal';
import type { EmployeeSortField } from '../types/employee.types';

export default function EmployeesPage() {
  const { user } = useAuth();
  const canWrite = user?.role === 'ADMIN' || user?.role === 'HR_MANAGER';

  const [search, setSearch]   = useState('');
  const [status, setStatus]   = useState('');
  const [sort, setSort]       = useState<EmployeeSortField>('created_at');
  const [order, setOrder]     = useState<'asc' | 'desc'>('desc');
  const [page, setPage]       = useState(1);
  const [showCreate, setShowCreate] = useState(false);

  const debouncedSearch = useDebounce(search, 300);

  const { data, isLoading, isError, refetch } = useListEmployeesQuery({
    search:  debouncedSearch || undefined,
    status:  status as 'active' | 'inactive' | '' || undefined,
    sort,
    order,
    page,
    limit: 20,
  });

  function handleSort(field: EmployeeSortField) {
    if (field === sort) {
      setOrder((o) => (o === 'asc' ? 'desc' : 'asc'));
    } else {
      setSort(field);
      setOrder('asc');
    }
    setPage(1);
  }

  function handleSearchChange(value: string) {
    setSearch(value);
    setPage(1);
  }

  function handleStatusChange(value: string) {
    setStatus(value);
    setPage(1);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Employees</h1>
          <p className="text-sm text-muted-foreground">
            Manage your workforce directory.
          </p>
        </div>
        {canWrite && (
          <Button onClick={() => setShowCreate(true)} className="gap-2">
            <UserPlus className="h-4 w-4" />
            Add Employee
          </Button>
        )}
      </div>

      <EmployeeFilters
        search={search}
        status={status}
        onSearchChange={handleSearchChange}
        onStatusChange={handleStatusChange}
      />

      {isLoading && <LoadingState message="Loading employees…" />}

      {isError && (
        <ErrorState
          title="Failed to load employees"
          message="Could not fetch the employee list. Please try again."
          onRetry={() => void refetch()}
        />
      )}

      {!isLoading && !isError && data && (
        data.employees.length === 0 ? (
          <EmptyState
            title="No employees found"
            description={
              debouncedSearch || status
                ? 'Try adjusting your filters.'
                : 'Add the first employee to get started.'
            }
          />
        ) : (
          <div className="space-y-4">
            <div className="rounded-md border">
              <EmployeeTable
                employees={data.employees}
                sort={sort}
                order={order}
                onSort={handleSort}
              />
            </div>
            <PaginationControls meta={data.meta} onPageChange={setPage} />
          </div>
        )
      )}

      {showCreate && <CreateEmployeeModal onClose={() => setShowCreate(false)} />}
    </div>
  );
}
