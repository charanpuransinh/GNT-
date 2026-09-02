import { CompanyRepository } from "../repositories/company.repository";
import { BranchRepository } from "../repositories/branch.repository";
import { CompanyInternal } from "./company.internal";
import { EventBus } from "../../../common/events/event-bus";
import { AuditLogger } from "../../../common/logging/audit-logger";
import { AppError } from "../../../common/errors/error-classes";

export class CompanyService {
  constructor(
    private readonly companyRepo: CompanyRepository,
    private readonly branchRepo: BranchRepository,
    private readonly internal: CompanyInternal,
    private readonly eventBus: EventBus,
    private readonly audit: AuditLogger,
  ) {}

  async getProfile(companyId: string) { return this.companyRepo.findById(companyId); }

  async updateProfile(companyId: string, data: any) {
    const updated = await this.companyRepo.update(companyId, data);
    this.eventBus.publish("company.profile.updated", { companyId, timestamp: new Date() });
    this.audit.log({ action: "COMPANY_PROFILE_UPDATE", target: companyId });
    return updated;
  }

  async getFinancialYears(companyId: string) { return this.companyRepo.findFinancialYears(companyId); }

  async createFinancialYear(companyId: string, data: any) {
    const fy = await this.companyRepo.createFY({ ...data, companyId });
    this.audit.log({ action: "FY_CREATED", target: fy.id });
    return fy;
  }

  async switchFinancialYear(fyId: string, companyId: string) {
    await this.companyRepo.deactivateAllFY(companyId);
    await this.companyRepo.activateFY(fyId);
    this.eventBus.publish("company.fy.switched", { companyId, fyId, timestamp: new Date() });
    this.audit.log({ action: "FY_SWITCHED", target: fyId });
  }

  async getRoles(companyId: string) { return this.companyRepo.findRoles(companyId); }

  async updateRolePermissions(roleId: string, companyId: string, permissions: string[]) {
    const role = await this.companyRepo.findRoleById(roleId);
    if (!role || role.company_id !== companyId) throw new AppError("GNT-ERR-0401", "Role not found", 404);
    await this.companyRepo.updateRolePermissions(roleId, permissions);
    this.audit.log({ action: "ROLE_PERMISSIONS_UPDATED", target: roleId });
  }

  async getUsers(companyId: string) { return this.companyRepo.findUsers(companyId); }

  async createUser(companyId: string, data: any) {
    const user = await this.companyRepo.createUser({ ...data, companyId });
    this.eventBus.publish("company.user.created", { userId: user.id, companyId });
    this.audit.log({ action: "USER_CREATED", target: user.id });
    return user;
  }

  async toggleUserStatus(userId: string, companyId: string) {
    const user = await this.companyRepo.findUserById(userId);
    if (!user || user.company_id !== companyId) throw new AppError("GNT-ERR-0402", "User not found", 404);
    await this.companyRepo.toggleUserStatus(userId, !user.is_active);
    this.audit.log({ action: "USER_STATUS_TOGGLED", target: userId });
  }
}