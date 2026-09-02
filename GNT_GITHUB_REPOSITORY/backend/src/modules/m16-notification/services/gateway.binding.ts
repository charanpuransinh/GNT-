/**
 * GNT M16 — Gateway binding (टास्क #011 Step 2)
 *
 * M18 की public contract (index.ts) से ही GatewayService लिया गया है —
 * internal M18 file सीधे import करना ILLEGAL है।
 * channel services यहीं से असली gateway लेते हैं।
 */
import { GatewayService, IntegrationRepository } from '@/modules/m18-external-integration';
import { prisma } from '@/common/config/prisma';

export const notificationGateway = new GatewayService(new IntegrationRepository(prisma));
