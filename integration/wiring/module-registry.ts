export interface ModuleRegistryEntry {
  moduleId: string;
  moduleName: string;
  version: string;
  status: 'REGISTERED' | 'MOUNTED' | 'DEGRADED' | 'FAILED';
  routerAvailable: boolean;
  serviceAvailable: boolean;
  eventAvailable: boolean;
  permissionAvailable: boolean;
  healthStatus: boolean;
}

export const MODULE_REGISTRY: Record<string, ModuleRegistryEntry> = {
  M23: {
    moduleId: 'M23',
    moduleName: 'Security & Governance',
    version: '1.0.0',
    status: 'REGISTERED',
    routerAvailable: false,
    serviceAvailable: false,
    eventAvailable: false,
    permissionAvailable: false,
    healthStatus: false,
  },

  M24: {
    moduleId: 'M24',
    moduleName: 'Performance & Cache',
    version: '1.0.0',
    status: 'REGISTERED',
    routerAvailable: false,
    serviceAvailable: false,
    eventAvailable: false,
    permissionAvailable: false,
    healthStatus: false,
  },

  M25: {
    moduleId: 'M25',
    moduleName: 'Real-Time & Notifications',
    version: '1.0.0',
    status: 'REGISTERED',
    routerAvailable: false,
    serviceAvailable: false,
    eventAvailable: false,
    permissionAvailable: false,
    healthStatus: false,
  },

  M26: {
    moduleId: 'M26',
    moduleName: 'Search & Indexing',
    version: '1.0.0',
    status: 'REGISTERED',
    routerAvailable: false,
    serviceAvailable: false,
    eventAvailable: false,
    permissionAvailable: false,
    healthStatus: false,
  },

  M27: {
    moduleId: 'M27',
    moduleName: 'Analytics & Dashboards',
    version: '1.0.0',
    status: 'REGISTERED',
    routerAvailable: false,
    serviceAvailable: false,
    eventAvailable: false,
    permissionAvailable: false,
    healthStatus: false,
  },

  M28: {
    moduleId: 'M28',
    moduleName: 'Reports & Communication',
    version: '1.0.0',
    status: 'REGISTERED',
    routerAvailable: false,
    serviceAvailable: false,
    eventAvailable: false,
    permissionAvailable: false,
    healthStatus: false,
  },

  M29: {
    moduleId: 'M29',
    moduleName: 'Mobile & Sync',
    version: '1.0.0',
    status: 'REGISTERED',
    routerAvailable: false,
    serviceAvailable: false,
    eventAvailable: false,
    permissionAvailable: false,
    healthStatus: false,
  },

  M30: {
    moduleId: 'M30',
    moduleName: 'AI & Integrations',
    version: '1.0.0',
    status: 'REGISTERED',
    routerAvailable: false,
    serviceAvailable: false,
    eventAvailable: false,
    permissionAvailable: false,
    healthStatus: false,
  },

  M31: {
    moduleId: 'M31',
    moduleName: 'Workforce & HR Intelligence',
    version: '1.0.0',
    status: 'REGISTERED',
    routerAvailable: false,
    serviceAvailable: false,
    eventAvailable: false,
    permissionAvailable: false,
    healthStatus: false,
  },

  M32: {
    moduleId: 'M32',
    moduleName: 'Workflow & Agents',
    version: '1.0.0',
    status: 'REGISTERED',
    routerAvailable: false,
    serviceAvailable: false,
    eventAvailable: false,
    permissionAvailable: false,
    healthStatus: false,
  },

  M33: {
    moduleId: 'M33',
    moduleName: 'Integration Hub',
    version: '1.0.0',
    status: 'REGISTERED',
    routerAvailable: false,
    serviceAvailable: false,
    eventAvailable: false,
    permissionAvailable: false,
    healthStatus: false,
  },

  M34: {
    moduleId: 'M34',
    moduleName: 'Subscription & Entitlement',
    version: '1.0.0',
    status: 'REGISTERED',
    routerAvailable: false,
    serviceAvailable: false,
    eventAvailable: false,
    permissionAvailable: false,
    healthStatus: false,
  },
};

export function getModule(moduleId: string): ModuleRegistryEntry | undefined {
  return MODULE_REGISTRY[moduleId];
}

export function getAllModules(): ModuleRegistryEntry[] {
  return Object.values(MODULE_REGISTRY);
}

export function updateModuleHealth(
  moduleId: string,
  health: Partial<
    Pick<
      ModuleRegistryEntry,
      | 'status'
      | 'routerAvailable'
      | 'serviceAvailable'
      | 'eventAvailable'
      | 'permissionAvailable'
      | 'healthStatus'
    >
  >,
): void {
  const module = MODULE_REGISTRY[moduleId];

  if (!module) {
    throw new Error(`Unknown GNT module: ${moduleId}`);
  }

  Object.assign(module, health);
}
