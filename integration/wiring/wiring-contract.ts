export interface GntWiringContract {
  moduleId: string;
  mounted: boolean;
  routerMounted: boolean;
  permissionsRegistered: boolean;
  eventsRegistered: boolean;
  dependenciesHealthy: boolean;
  tenantGuardActive: boolean;
  scopeGuardActive: boolean;
  lastVerifiedAt?: string;
}

export function isWiringReady(w: GntWiringContract): boolean {
  return (
    w.mounted &&
    w.routerMounted &&
    w.permissionsRegistered &&
    w.eventsRegistered &&
    w.dependenciesHealthy &&
    w.tenantGuardActive &&
    w.scopeGuardActive
  );
}
