// Prisma model extensions for permission_master
// These are type-safe extensions over the auto-generated Prisma client

import { Prisma } from '@prisma/client';

export const permissionMasterExtensions = {
  // Add computed fields or custom methods here
  // Example: fullyQualifiedName (module.action), etc.
};

// Type for permission with the roles it is assigned to
export type PermissionWithRoles = Prisma.permission_masterGetPayload<{
  include: {
    role_permission: {
      include: {
        role_master: true;
      };
    };
  };
}>;
