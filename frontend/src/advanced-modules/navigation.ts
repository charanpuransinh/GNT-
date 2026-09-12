import { ADVANCED_MODULE_CONFIG } from './module-config';

export interface NavigationItem {
  id: string;
  label: string;
  path: string;
  permission: string;
  icon: string;
}

export const ADVANCED_NAVIGATION: NavigationItem[] =
  ADVANCED_MODULE_CONFIG.map((module) => ({
    id: module.id,
    label: module.name,
    path: module.route,
    permission: module.permission,
    icon: module.icon,
  }));
