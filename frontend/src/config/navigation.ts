import type { LucideIcon } from 'lucide-react';
import { BarChart3, LayoutDashboard, Users } from 'lucide-react';

export interface NavItem {
  label: string;
  path: string;
  icon: LucideIcon;
  comingSoon?: boolean;
}

export const mainNavItems: NavItem[] = [
  { label: 'Dashboard', path: '/', icon: LayoutDashboard },
  { label: 'Employees', path: '/employees', icon: Users, comingSoon: true },
  { label: 'Analytics', path: '/analytics', icon: BarChart3, comingSoon: true },
];
