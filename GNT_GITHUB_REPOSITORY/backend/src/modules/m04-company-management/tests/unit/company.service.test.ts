import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach, vi, type Mocked } from 'vitest';

import { CompanyService } from "../../services/company.service";
import { CompanyRepository } from "../../repositories/company.repository";
import { BranchRepository } from "../../repositories/branch.repository";
import { CompanyInternal } from "../../services/company.internal";
import { EventBus } from "../../../../common/events/event-bus";
import { AuditLogger } from "../../../../common/logging/audit-logger";

describe("CompanyService", () => {
  let service: CompanyService;
  let mockCompanyRepo: Mocked<CompanyRepository>;
  let mockBranchRepo: Mocked<BranchRepository>;
  let mockInternal: Mocked<CompanyInternal>;
  let mockEventBus: Mocked<EventBus>;
  let mockAudit: Mocked<AuditLogger>;

  beforeEach(() => {
    mockCompanyRepo = {
      findById: vi.fn(), update: vi.fn(), findFinancialYears: vi.fn(),
      createFY: vi.fn(), deactivateAllFY: vi.fn(), activateFY: vi.fn(),
      findRoles: vi.fn(), findRoleById: vi.fn(), updateRolePermissions: vi.fn(),
      findUsers: vi.fn(), findUserById: vi.fn(), createUser: vi.fn(), toggleUserStatus: vi.fn(),
    } as any;
    mockBranchRepo = { findByCompany: vi.fn(), create: vi.fn(), softDelete: vi.fn(), countByCompany: vi.fn() } as any;
    mockInternal = { validateGSTIN: vi.fn(), generateInvoicePrefix: vi.fn(), validateFYOverlap: vi.fn() } as any;
    mockEventBus = { publish: vi.fn() } as any;
    mockAudit = { log: vi.fn() } as any;
    service = new CompanyService(mockCompanyRepo, mockBranchRepo, mockInternal, mockEventBus, mockAudit);
  });

  it("getProfile returns company", async () => {
    mockCompanyRepo.findById.mockResolvedValue({ id: "c1", name: "Test Co" } as any);
    const r = await service.getProfile("c1");
    expect(r?.name).toBe("Test Co");
  });

  it("updateProfile publishes event", async () => {
    mockCompanyRepo.update.mockResolvedValue({ id: "c1", name: "Updated" } as any);
    await service.updateProfile("c1", { name: "Updated" });
    expect(mockEventBus.publish).toHaveBeenCalledWith("company.profile.updated", expect.any(Object));
    expect(mockAudit.log).toHaveBeenCalled();
  });
});
