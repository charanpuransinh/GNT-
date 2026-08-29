import { CompanyService } from "../../services/company.service";
import { CompanyRepository } from "../../repositories/company.repository";
import { BranchRepository } from "../../repositories/branch.repository";
import { CompanyInternal } from "../../services/company.internal";
import { EventBus } from "../../../../common/events/event-bus";
import { AuditLogger } from "../../../../common/logging/audit-logger";

describe("CompanyService", () => {
  let service: CompanyService;
  let mockCompanyRepo: jest.Mocked<CompanyRepository>;
  let mockBranchRepo: jest.Mocked<BranchRepository>;
  let mockInternal: jest.Mocked<CompanyInternal>;
  let mockEventBus: jest.Mocked<EventBus>;
  let mockAudit: jest.Mocked<AuditLogger>;

  beforeEach(() => {
    mockCompanyRepo = {
      findById: jest.fn(), update: jest.fn(), findFinancialYears: jest.fn(),
      createFY: jest.fn(), deactivateAllFY: jest.fn(), activateFY: jest.fn(),
      findRoles: jest.fn(), findRoleById: jest.fn(), updateRolePermissions: jest.fn(),
      findUsers: jest.fn(), findUserById: jest.fn(), createUser: jest.fn(), toggleUserStatus: jest.fn(),
    } as any;
    mockBranchRepo = { findByCompany: jest.fn(), create: jest.fn(), softDelete: jest.fn(), countByCompany: jest.fn() } as any;
    mockInternal = { validateGSTIN: jest.fn(), generateInvoicePrefix: jest.fn(), validateFYOverlap: jest.fn() } as any;
    mockEventBus = { publish: jest.fn() } as any;
    mockAudit = { log: jest.fn() } as any;
    service = new CompanyService(mockCompanyRepo, mockBranchRepo, mockInternal, mockEventBus, mockAudit);
  });

  it("getProfile returns company", async () => {
    mockCompanyRepo.findById.mockResolvedValue({ id: "c1", name: "Test Co" } as any);
    const r = await service.getProfile("c1");
    expect(r.name).toBe("Test Co");
  });

  it("updateProfile publishes event", async () => {
    mockCompanyRepo.update.mockResolvedValue({ id: "c1", name: "Updated" } as any);
    await service.updateProfile("c1", { name: "Updated" });
    expect(mockEventBus.publish).toHaveBeenCalledWith("company.profile.updated", expect.any(Object));
    expect(mockAudit.log).toHaveBeenCalled();
  });
});
