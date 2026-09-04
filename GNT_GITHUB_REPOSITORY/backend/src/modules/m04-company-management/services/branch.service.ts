import { BranchRepository } from "../repositories/branch.repository";
import { EventBus } from "../../../common/events/event-bus";
import { AuditLogger } from "../../../common/logging/audit-logger";

export class BranchService {
  constructor(
    private readonly branchRepo: BranchRepository,
    private readonly eventBus: EventBus,
    private readonly audit: AuditLogger,
  ) {}

  async getBranches(companyId: string) { return this.branchRepo.findByCompany(companyId); }

  async createBranch(companyId: string, data: { name: string; address?: string | null }) {
    const code = await this.generateBranchCode(companyId);
    const branch = await this.branchRepo.create({ ...data, companyId, code, isActive: true });
    this.eventBus.publish("company.branch.created", { branchId: branch.id, companyId });
    this.audit.log({ action: "BRANCH_CREATED", target: branch.id });
    return branch;
  }

  async deleteBranch(branchId: string, companyId: string) {
    await this.branchRepo.softDelete(branchId, companyId);
    this.eventBus.publish("company.branch.deleted", { branchId, companyId });
    this.audit.log({ action: "BRANCH_DELETED", target: branchId });
  }

  private async generateBranchCode(companyId: string) {
    const count = await this.branchRepo.countByCompany(companyId);
    return `BR-${String(count + 1).padStart(3, "0")}`;
  }
}