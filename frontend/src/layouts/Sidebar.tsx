import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { mainNavItems } from '@/config/navigation';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/features/auth/hooks/useAuth';

interface SidebarProps {
  onNavigate?: () => void;
}

export function Sidebar({ onNavigate }: SidebarProps) {
  const { role } = useAuth();

  const visibleItems = mainNavItems.filter(
    (item) => !item.requiresRole || (role && item.requiresRole.includes(role)),
  );

  return (
    <aside className="flex h-full w-64 flex-col border-r bg-card">
      <div className="border-b px-6 py-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">ACME</p>
        <h1 className="text-lg font-semibold">Salary Management</h1>
      </div>

      <nav className="flex-1 space-y-1 p-4">
        {visibleItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                item.comingSoon && 'opacity-80',
              )
            }
          >
            <item.icon className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span className="flex-1">{item.label}</span>
            {item.comingSoon ? (
              <Badge variant="secondary" className="text-[10px]">
                Soon
              </Badge>
            ) : null}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
