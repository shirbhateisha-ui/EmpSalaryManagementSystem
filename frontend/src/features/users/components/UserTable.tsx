import { cn } from '@/lib/utils';
import type { User } from '@/features/auth/types/auth.types';
import type { Role, UserStatus } from '@/features/auth/types/auth.types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { useUpdateUserMutation } from '../api/users.api';

const ROLE_LABELS: Record<Role, string> = {
  ADMIN: 'Admin',
  HR_MANAGER: 'HR Manager',
  VIEWER: 'Viewer',
};

const ROLE_CLASSES: Record<Role, string> = {
  ADMIN: 'bg-primary/10 text-primary',
  HR_MANAGER: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  VIEWER: 'bg-muted text-muted-foreground',
};

function RoleBadge({ role }: { role: Role }) {
  return (
    <span
      className={cn(
        'inline-block rounded px-2 py-0.5 text-xs font-semibold',
        ROLE_CLASSES[role],
      )}
    >
      {ROLE_LABELS[role]}
    </span>
  );
}

function StatusBadge({ status }: { status: UserStatus }) {
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

interface UserTableProps {
  users: User[];
  currentUserId?: number;
}

export function UserTable({ users, currentUserId }: UserTableProps) {
  const [updateUser, { isLoading }] = useUpdateUserMutation();

  async function toggleStatus(user: User) {
    const nextStatus: UserStatus = user.status === 'active' ? 'inactive' : 'active';
    await updateUser({ id: user.id, body: { status: nextStatus } });
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Role</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="w-32 text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {users.map((user) => {
          const isSelf = user.id === currentUserId;
          return (
            <TableRow key={user.id}>
              <TableCell className="font-medium">
                {user.name}
                {isSelf && (
                  <span className="ml-2 text-xs text-muted-foreground">(you)</span>
                )}
              </TableCell>
              <TableCell className="text-muted-foreground">{user.email}</TableCell>
              <TableCell><RoleBadge role={user.role} /></TableCell>
              <TableCell><StatusBadge status={user.status} /></TableCell>
              <TableCell className="text-right">
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={isLoading || isSelf}
                  onClick={() => void toggleStatus(user)}
                  className={cn(
                    'text-xs',
                    user.status === 'active'
                      ? 'text-destructive hover:text-destructive'
                      : 'text-green-600 hover:text-green-700',
                  )}
                >
                  {user.status === 'active' ? 'Deactivate' : 'Activate'}
                </Button>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
