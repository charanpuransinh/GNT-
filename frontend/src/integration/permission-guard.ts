export function hasPermission(
  permissions: string[],
  requiredPermission: string,
): boolean {
  return permissions.includes(requiredPermission);
}

export function canOpenModule(
  permissions: string[],
  requiredPermission: string,
): boolean {
  return hasPermission(permissions, requiredPermission);
}
