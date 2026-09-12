export function canAccessFrontendModule(
  permissions: string[],
  requiredPermission: string,
): boolean {
  return permissions.includes(requiredPermission);
}

export function filterAccessibleModules<
  T extends { permission: string },
>(
  modules: T[],
  permissions: string[],
): T[] {
  return modules.filter((module) =>
    canAccessFrontendModule(permissions, module.permission),
  );
}
