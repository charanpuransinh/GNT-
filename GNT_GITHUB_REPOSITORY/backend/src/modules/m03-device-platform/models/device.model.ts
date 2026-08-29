// Prisma model extensions for device_registry
// These are type-safe extensions over the auto-generated Prisma client

import { Prisma } from '@prisma/client';

export const deviceRegistryExtensions = {
  // Add computed fields or custom methods here
  // Example: isStale (lastSeenAt older than N days), etc.
};

// Type for device with its active sessions included
export type DeviceWithSessions = Prisma.device_registryGetPayload<{
  include: {
    active_session: true;
  };
}>;
