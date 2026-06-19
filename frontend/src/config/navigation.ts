import type { LucideIcon } from 'lucide-react';
import { BarChart3, LayoutDashboard, Shield, Users } from 'lucide-react';
import type { Role } from '@/features/auth/types/auth.types';

export interface NavItem {
  label: string;
  path: string;
  icon: LucideIcon;
  comingSoon?: boolean;
  requiresRole?: Role[];
}

export const mainNavItems: NavItem[] = [
  { label: 'Dashboard', path: '/', icon: LayoutDashboard },
  { label: 'Employees', path: '/employees', icon: Users },
  { label: 'Analytics', path: '/analytics', icon: BarChart3 },
  { label: 'User Management', path: '/users', icon: Shield, requiresRole: ['ADMIN'] },
];
