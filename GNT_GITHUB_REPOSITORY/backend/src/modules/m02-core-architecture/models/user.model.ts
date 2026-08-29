// Prisma model extensions for user_master
// These are type-safe extensions over the auto-generated Prisma client

import { Prisma } from '@prisma/client';

export const userMasterExtensions = {
  // Add computed fields or custom methods here
  // Example: fullName, formattedPhone, etc.
};

// Type for user with roles included
export type UserWithRoles = Prisma.user_masterGetPayload<{
  include: {
    user_role: {
      include: {
        role_master: true;
      };
    };
  };
}>;
