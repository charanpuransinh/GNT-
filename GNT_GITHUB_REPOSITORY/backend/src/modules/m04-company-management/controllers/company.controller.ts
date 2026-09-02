import { Request, Response, NextFunction } from "express";
import { CompanyService } from "../services/company.service";
import { BranchService } from "../services/branch.service";
import { AppError } from "../../../common/errors/error-classes";

export class CompanyController {
  constructor(
    private readonly companyService: CompanyService,
    private readonly branchService: BranchService,
  ) {}

  async getProfile(req: Request, res: Response, next: NextFunction) {
    try { const c = await this.companyService.getProfile(req.tenant.companyId); res.json({ success: true, data: c, meta: { requestId: req.requestId } }); }
    catch(err){ next(err); }
  }

  async updateProfile(req: Request, res: Response, next: NextFunction) {
    try { const c = await this.companyService.updateProfile(req.tenant.companyId, req.body); res.json({ success: true, data: c }); }
    catch(err){ next(err); }
  }

  async getBranches(req: Request, res: Response, next: NextFunction) {
    try { const b = await this.branchService.getBranches(req.tenant.companyId); res.json({ success: true, data: b }); }
    catch(err){ next(err); }
  }

  async createBranch(req: Request, res: Response, next: NextFunction) {
    try { const b = await this.branchService.createBranch(req.tenant.companyId, req.body); res.status(201).json({ success: true, data: b }); }
    catch(err){ next(err); }
  }

  async deleteBranch(req: Request, res: Response, next: NextFunction) {
    try { await this.branchService.deleteBranch(String(req.params.branchId), req.tenant.companyId); res.json({ success: true, message: "Branch deleted" }); }
    catch(err){ next(err); }
  }

  async getFinancialYears(req: Request, res: Response, next: NextFunction) {
    try { const f = await this.companyService.getFinancialYears(req.tenant.companyId); res.json({ success: true, data: f }); }
    catch(err){ next(err); }
  }

  async createFY(req: Request, res: Response, next: NextFunction) {
    try { const f = await this.companyService.createFinancialYear(req.tenant.companyId, req.body); res.status(201).json({ success: true, data: f }); }
    catch(err){ next(err); }
  }

  async switchFY(req: Request, res: Response, next: NextFunction) {
    try { await this.companyService.switchFinancialYear(String(req.params.fyId), req.tenant.companyId); res.json({ success: true, message: "FY switched" }); }
    catch(err){ next(err); }
  }

  async getRoles(req: Request, res: Response, next: NextFunction) {
    try { const r = await this.companyService.getRoles(req.tenant.companyId); res.json({ success: true, data: r }); }
    catch(err){ next(err); }
  }

  async updateRolePermissions(req: Request, res: Response, next: NextFunction) {
    try { await this.companyService.updateRolePermissions(String(req.params.roleId), req.tenant.companyId, req.body.permissions); res.json({ success: true, message: "Permissions updated" }); }
    catch(err){ next(err); }
  }

  async getUsers(req: Request, res: Response, next: NextFunction) {
    try { const u = await this.companyService.getUsers(req.tenant.companyId); res.json({ success: true, data: u }); }
    catch(err){ next(err); }
  }

  async createUser(req: Request, res: Response, next: NextFunction) {
    try { const u = await this.companyService.createUser(req.tenant.companyId, req.body); res.status(201).json({ success: true, data: u }); }
    catch(err){ next(err); }
  }

  async toggleUserStatus(req: Request, res: Response, next: NextFunction) {
    try { await this.companyService.toggleUserStatus(String(req.params.userId), req.tenant.companyId); res.json({ success: true, message: "User status toggled" }); }
    catch(err){ next(err); }
  }
}
