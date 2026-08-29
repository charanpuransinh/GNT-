// Prisma model extensions for role_master
// These are type-safe extensions over the auto-generated Prisma client

import { Prisma } from '@prisma/client';

export const roleMasterExtensions = {
  // Add computed fields or custom methods here
  // Example: permissionCount, isSystemRole, etc.
};

// Type for role with its permissions included
export type RoleWithPermissions = Prisma.role_masterGetPayload<{
  include: {
    role_permission: {
      include: {
        permission_master: true;
      };
    };
  };
}>;
