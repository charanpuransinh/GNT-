import { CompanyRepository } from "../repositories/company.repository";
import { BranchRepository } from "../repositories/branch.repository";
import { CompanyInternal } from "./company.internal";
import { EventBus } from "../../../common/events/event-bus";
import { AuditLogger } from "../../../common/logging/audit-logger";
import { Prisma } from "@prisma/client";
import { AppError } from "../../../common/errors/error-classes";

/** company के अंदर नया user बनाने के लिए ज़रूरी जानकारी (पहले यह `any` थी) */
export interface CreateCompanyUserInput {
  name: string;
  email: string;
  username: string;
  passwordHash: string;
  branchId?: string | null;
}

export class CompanyService {
  constructor(
    private readonly companyRepo: CompanyRepository,
    private readonly branchRepo: BranchRepository,
    private readonly internal: CompanyInternal,
    private readonly eventBus: EventBus,
    private readonly audit: AuditLogger,
  ) {}

  async getProfile(companyId: string) { return this.companyRepo.findById(companyId); }

  async updateProfile(companyId: string, data: Prisma.company_masterUncheckedUpdateInput) {
    const updated = await this.companyRepo.update(companyId, data);
    this.eventBus.publish("company.profile.updated", { companyId, timestamp: new Date() });
    this.audit.log({ action: "COMPANY_PROFILE_UPDATE", target: companyId });
    return updated;
  }

  async getFinancialYears(companyId: string) { return this.companyRepo.findFinancialYears(companyId); }

  // पहले `data: any` था — startDate/endDate/prefix में से कोई नाम ग़लत लिखा
  // जाता तो tsc चुप रहता। अब वही आकार माँगा जाता है जो createFY समझता है।
  async createFinancialYear(companyId: string, data: { startDate: string | Date; endDate: string | Date; prefix: string; isActive?: boolean }) {
    const fy = await this.companyRepo.createFY({ ...data, companyId });
    this.audit.log({ action: "FY_CREATED", target: fy.id });
    return fy;
  }

  async switchFinancialYear(fyId: string, companyId: string) {
    // ⚠️ पहले यहाँ कोई company-जाँच नहीं थी: अपनी company के सारे FY बंद करके,
    // फिर बिना जाँचे किसी भी id वाला FY चालू कर देता था। यानी दूसरी company का FY
    // चालू हो जाता और अपनी company बिना किसी चालू FY के रह जाती।
    // अब पहले जाँचो, फिर बंद करो — वरना नाकाम होने पर भी नुक़सान हो चुका होता।
    const fy = await this.companyRepo.findFinancialYears(companyId);
    if (!fy.some((f) => f.id === fyId)) throw new AppError("GNT-ERR-0403", "Financial year not found", 404);

    await this.companyRepo.deactivateAllFY(companyId);
    const ok = await this.companyRepo.activateFY(fyId, companyId);
    if (!ok) throw new AppError("GNT-ERR-0403", "Financial year not found", 404);
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

  async createUser(companyId: string, data: CreateCompanyUserInput) {
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