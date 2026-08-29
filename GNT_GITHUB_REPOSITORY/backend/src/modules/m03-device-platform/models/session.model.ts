// Prisma model extensions for active_session
// These are type-safe extensions over the auto-generated Prisma client

import { Prisma } from '@prisma/client';

export const activeSessionExtensions = {
  // Add computed fields or custom methods here
  // Example: isExpired (expiresAt < now), etc.
};

// Type for session with its parent device included
export type SessionWithDevice = Prisma.active_sessionGetPayload<{
  include: {
    device_registry: true;
  };
}>;
