import { Link } from 'react-router-dom';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { Employee, EmployeeSortField, EmployeeStatus } from '../types/employee.types';

const USD = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

function StatusBadge({ status }: { status: EmployeeStatus }) {
  return (
    <span
      className={cn(
        'inline-block rounded px-2 py-0.5 text-xs font-semibold',
        status === 'active'
          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
          : 'bg-muted text-muted-foreground line-through',
      )}
    >
      {status === 'active' ? 'Active' : 'Inactive'}
    </span>
  );
}

interface SortHeaderProps {
  label: string;
  field: EmployeeSortField;
  currentSort: EmployeeSortField;
  currentOrder: 'asc' | 'desc';
  onSort: (field: EmployeeSortField) => void;
}

function SortHeader({ label, field, currentSort, currentOrder, onSort }: SortHeaderProps) {
  const isActive = currentSort === field;
  return (
    <button
      type="button"
      onClick={() => onSort(field)}
      className="flex items-center gap-1 font-medium hover:text-foreground"
    >
      {label}
      {isActive ? (
        currentOrder === 'asc' ? (
          <ArrowUp className="h-3 w-3" />
        ) : (
          <ArrowDown className="h-3 w-3" />
        )
      ) : (
        <ArrowUpDown className="h-3 w-3 opacity-40" />
      )}
    </button>
  );
}

interface EmployeeTableProps {
  employees: Employee[];
  sort: EmployeeSortField;
  order: 'asc' | 'desc';
  onSort: (field: EmployeeSortField) => void;
}

export function EmployeeTable({ employees, sort, order, onSort }: EmployeeTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>
            <SortHeader
              label="Name"
              field="name"
              currentSort={sort}
              currentOrder={order}
              onSort={onSort}
            />
          </TableHead>
          <TableHead>Email</TableHead>
          <TableHead>
            <SortHeader
              label="Country"
              field="country"
              currentSort={sort}
              currentOrder={order}
              onSort={onSort}
            />
          </TableHead>
          <TableHead>
            <SortHeader
              label="Department"
              field="department"
              currentSort={sort}
              currentOrder={order}
              onSort={onSort}
            />
          </TableHead>
          <TableHead>
            <SortHeader
              label="Salary (USD/yr)"
              field="base_salary_usd"
              currentSort={sort}
              currentOrder={order}
              onSort={onSort}
            />
          </TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {employees.map((emp) => (
          <TableRow key={emp.id}>
            <TableCell className="font-medium">
              <Link to={`/employees/${emp.id}`} className="hover:underline text-primary">
                {emp.name}
              </Link>
            </TableCell>
            <TableCell className="text-muted-foreground">{emp.email}</TableCell>
            <TableCell>{emp.country}</TableCell>
            <TableCell>{emp.department}</TableCell>
            <TableCell>
              {emp.current_salary ? (
                USD.format(emp.current_salary.base_salary_usd)
              ) : (
                <span className="text-muted-foreground">—</span>
              )}
            </TableCell>
            <TableCell>
              <StatusBadge status={emp.status} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
