import { useState } from 'react';
import { UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LoadingState } from '@/components/states/LoadingState';
import { EmptyState } from '@/components/states/EmptyState';
import { ErrorState } from '@/components/states/ErrorState';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useListUsersQuery } from '../api/users.api';
import { CreateUserModal } from '../components/CreateUserModal';
import { UserTable } from '../components/UserTable';

export default function UsersPage() {
  const { user: currentUser } = useAuth();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const { data, isLoading, isError } = useListUsersQuery();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">User Management</h1>
          <p className="text-sm text-muted-foreground">
            Manage system users and their roles.
          </p>
        </div>
        <Button onClick={() => setShowCreateModal(true)} className="gap-2">
          <UserPlus className="h-4 w-4" />
          Add User
        </Button>
      </div>

      {isLoading && <LoadingState message="Loading users…" />}

      {isError && (
        <ErrorState
          title="Failed to load users"
          message="Could not fetch the user list. Please try again."
        />
      )}

      {!isLoading && !isError && data && (
        data.users.length === 0 ? (
          <EmptyState
            title="No users found"
            description="Add the first user to get started."
          />
        ) : (
          <div className="rounded-md border">
            <UserTable users={data.users} currentUserId={currentUser?.id} />
          </div>
        )
      )}

      {showCreateModal && (
        <CreateUserModal onClose={() => setShowCreateModal(false)} />
      )}
    </div>
  );
}
