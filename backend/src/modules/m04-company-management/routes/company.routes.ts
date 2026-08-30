import { Router } from "express";
import { CompanyController } from "../controllers/company.controller";
import { CompanyService } from "../services/company.service";
import { BranchService } from "../services/branch.service";
import { CompanyInternal } from "../services/company.internal";
import { CompanyRepository } from "../repositories/company.repository";
import { BranchRepository } from "../repositories/branch.repository";
import { authMiddleware } from "../../../common/middleware/auth-middleware";
import { tenantMiddleware } from "../../../common/middleware/tenant-middleware";
import { requestTracer } from "../../../common/middleware/request-tracer";
import { validationMiddleware } from "../../../common/middleware/validation-middleware";
import { companyProfileSchema, branchCreateSchema, financialYearSchema, rolePermissionsSchema, userCreateSchema } from "../validators/company.schema";
import { prisma } from "../../../common/config/prisma";
import { EventBus } from "../../../common/events/event-bus";
import { AuditLogger } from "../../../common/logging/audit-logger";
import { apiRateLimiter } from '../../../common/middleware/rate-limit';

const router = Router();
const companyRepo = new CompanyRepository(prisma);
const branchRepo = new BranchRepository(prisma);
const internal = new CompanyInternal();
const eventBus = new EventBus();
const audit = new AuditLogger();
const companyService = new CompanyService(companyRepo, branchRepo, internal, eventBus, audit);
const branchService = new BranchService(branchRepo, eventBus, audit);
const controller = new CompanyController(companyService, branchService);

router.use(authMiddleware);
router.use(tenantMiddleware);
router.use(requestTracer);
router.use(apiRateLimiter);

router.get("/profile", (req, res, next) => controller.getProfile(req, res, next));
router.put("/profile", validationMiddleware(companyProfileSchema), (req, res, next) => controller.updateProfile(req, res, next));
router.get("/branches", (req, res, next) => controller.getBranches(req, res, next));
router.post("/branches", validationMiddleware(branchCreateSchema), (req, res, next) => controller.createBranch(req, res, next));
router.delete("/branches/:branchId", (req, res, next) => controller.deleteBranch(req, res, next));
router.get("/financial-years", (req, res, next) => controller.getFinancialYears(req, res, next));
router.post("/financial-years", validationMiddleware(financialYearSchema), (req, res, next) => controller.createFY(req, res, next));
router.post("/financial-years/:fyId/switch", (req, res, next) => controller.switchFY(req, res, next));
router.get("/roles", (req, res, next) => controller.getRoles(req, res, next));
router.put("/roles/:roleId/permissions", validationMiddleware(rolePermissionsSchema), (req, res, next) => controller.updateRolePermissions(req, res, next));
router.get("/users", (req, res, next) => controller.getUsers(req, res, next));
router.post("/users", validationMiddleware(userCreateSchema), (req, res, next) => controller.createUser(req, res, next));
router.post("/users/:userId/toggle", (req, res, next) => controller.toggleUserStatus(req, res, next));

export default router;