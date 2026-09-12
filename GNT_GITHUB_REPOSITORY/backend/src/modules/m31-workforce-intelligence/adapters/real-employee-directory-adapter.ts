/**
 * M31 — adapters/real-employee-directory-adapter.ts
 * WIRED (2026-09-12): EmployeeDirectoryAdapter backed by M12's real
 * `m12_employees` table, read-only (M31 never writes M12's own tables —
 * Calling Rule).
 */

import { prisma } from '@/common/config/prisma';
import type { EmployeeDirectoryAdapter } from '../talent/talent-profile.service';

export class RealEmployeeDirectoryAdapter implements EmployeeDirectoryAdapter {
  async employeeExists(employeeId: string, tenantId: string): Promise<boolean> {
    const row = await prisma.employee.findFirst({ where: { id: employeeId, tenantId }, select: { id: true } });
    return row !== null;
  }
}

export const realEmployeeDirectoryAdapter = new RealEmployeeDirectoryAdapter();
