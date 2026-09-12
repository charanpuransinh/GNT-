export interface FrontendModuleStatus {
  moduleId: string;
  loaded: boolean;
  routeRegistered: boolean;
  permissionChecked: boolean;
  apiAvailable: boolean;
  realtimeAvailable: boolean;
}

export function isFrontendModuleReady(
  status: FrontendModuleStatus,
): boolean {
  return (
    status.loaded &&
    status.routeRegistered &&
    status.permissionChecked &&
    status.apiAvailable
  );
}
