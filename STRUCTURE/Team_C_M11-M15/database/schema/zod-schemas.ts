// ============================================================
// GNT MASTER BLUEPRINT V2 — ZOD VALIDATION SCHEMAS (M11-M15)
// Module Owner: TEAM C | Session 2: Validation Layer
// Lock Artifact: M11-M15_ZOD_SCHEMAS_v2.0.0
// ============================================================

import { z } from "zod";

// ============================================================
// SHARED VALIDATORS
// ============================================================

export const PaginationQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(500).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export const DateRangeFilterSchema = z.object({
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
}).refine((data) => {
  if (data.from && data.to) return new Date(data.from) <= new Date(data.to);
  return true;
}, { message: "From date must be before or equal to To date" });

export const TenantContextSchema = z.object({
  tenantId: z.string().cuid(),
  userId: z.string().cuid(),
  roles: z.array(z.string()),
  permissions: z.array(z.string()),
});

export const CuidSchema = z.string().cuid();
export const DecimalStringSchema = z.string().regex(/^-?\d+\.?\d*$/, "Must be a valid decimal string");
export const PhoneSchema = z.string().regex(/^[+]?[\d\s-]{10,15}$/).optional();
export const EmailSchema = z.string().email();
export const JsonSchema = z.record(z.unknown()).optional();

// ============================================================
// M11 — PAYMENT VALIDATION SCHEMAS
// ============================================================

export const CreatePaymentMethodSchema = z.object({
  code: z.string().min(1).max(50).regex(/^[A-Z_]+$/, "Code must be uppercase with underscores"),
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  providerCode: z.string().max(100).optional(),
  providerConfig: JsonSchema,
  configJson: JsonSchema,
});

export const UpdatePaymentMethodSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional(),
  isActive: z.boolean().optional(),
  providerConfig: JsonSchema,
  configJson: JsonSchema,
});

export const CreatePaymentTransactionSchema = z.object({
  partyType: z.enum(["CUSTOMER", "VENDOR", "EMPLOYEE", "SYSTEM"]),
  partyId: CuidSchema,
  partyName: z.string().min(1).max(500),
  partyContact: z.string().max(100).optional(),
  amount: DecimalStringSchema,
  currency: z.string().length(3).default("INR"),
  exchangeRate: DecimalStringSchema.default("1.0"),
  direction: z.enum(["IN", "OUT"]),
  paymentMethodId: CuidSchema,
  referenceType: z.string().max(100).optional(),
  referenceId: z.string().optional(),
  referenceNumber: z.string().max(100).optional(),
  transactionDate: z.string().datetime(),
  valueDate: z.string().datetime().optional(),
  narration: z.string().max(2000).optional(),
  internalNotes: z.string().max(2000).optional(),
  bankAccountId: CuidSchema.optional(),
});

export const UpdatePaymentStatusSchema = z.object({
  status: z.enum(["PENDING", "PROCESSING", "COMPLETED", "FAILED", "CANCELLED", "REFUNDED"]),
  reason: z.string().max(1000).optional(),
  providerRef: z.string().max(500).optional(),
  providerResponse: JsonSchema,
});

// PUBLIC API Schema
export const RecordPaymentSchema = z.object({
  sourceModule: z.string().regex(/^M\d{2}$/),
  sourceEntityType: z.string().min(1).max(100),
  sourceEntityId: z.string().min(1),
  sourceEntityNumber: z.string().max(100),
  partyType: z.enum(["CUSTOMER", "VENDOR", "EMPLOYEE", "SYSTEM"]),
  partyId: z.string().min(1),
  partyName: z.string().min(1).max(500),
  amount: DecimalStringSchema,
  paymentMethodId: CuidSchema,
  transactionDate: z.string().datetime(),
  narration: z.string().max(2000).optional(),
  bankAccountId: CuidSchema.optional(),
});

export const GetPartyBalanceSchema = z.object({
  partyType: z.enum(["CUSTOMER", "VENDOR", "EMPLOYEE", "SYSTEM"]),
  partyId: z.string().min(1),
  asOfDate: z.string().datetime().optional(),
});

export const CreateRefundSchema = z.object({
  originalTxnId: CuidSchema,
  amount: DecimalStringSchema,
  reason: z.string().min(1).max(2000),
});

export const CreateBankAccountSchema = z.object({
  accountCode: z.string().min(1).max(50).regex(/^[A-Z0-9_-]+$/),
  accountName: z.string().min(1).max(200),
  bankName: z.string().min(1).max(200),
  accountNumber: z.string().min(5).max(50),
  ifscCode: z.string().regex(/^[A-Z]{4}0[A-Z0-9]{6}$/).optional(),
  branch: z.string().max(200).optional(),
  accountType: z.enum(["CURRENT", "SAVINGS", "CASH", "WALLET"]),
  currency: z.string().length(3).default("INR"),
  openingBalance: DecimalStringSchema.default("0"),
  isDefault: z.boolean().default(false),
  syncConfig: JsonSchema,
});

export const CreateReconciliationSchema = z.object({
  bankAccountId: CuidSchema,
  statementDate: z.string().datetime(),
  openingBalance: DecimalStringSchema,
  closingBalance: DecimalStringSchema,
  statementFileId: z.string().optional(),
});

// ============================================================
// M12 — HR VALIDATION SCHEMAS
// ============================================================

export const CreateEmployeeSchema = z.object({
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  email: EmailSchema,
  phone: PhoneSchema,
  dateOfBirth: z.string().datetime().optional(),
  gender: z.enum(["MALE", "FEMALE", "OTHER", "PREFER_NOT_TO_SAY"]).optional(),
  panNumber: z.string().regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/).optional(),
  aadhaarNumber: z.string().regex(/^\d{12}$/).optional(),
  uanNumber: z.string().max(20).optional(),
  departmentId: CuidSchema,
  designationId: CuidSchema,
  employmentType: z.enum(["FULL_TIME", "PART_TIME", "CONTRACT", "INTERN"]).default("FULL_TIME"),
  dateOfJoining: z.string().datetime(),
  reportingToId: CuidSchema.optional(),
  basicSalary: DecimalStringSchema,
  salaryStructure: JsonSchema,
  bankAccountName: z.string().max(200).optional(),
  bankAccountNo: z.string().max(50).optional(),
  bankIfsc: z.string().regex(/^[A-Z]{4}0[A-Z0-9]{6}$/).optional(),
  bankName: z.string().max(200).optional(),
  shiftId: CuidSchema.optional(),
  workLocation: z.string().max(200).optional(),
});

export const UpdateEmployeeSchema = z.object({
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  email: EmailSchema.optional(),
  phone: PhoneSchema,
  departmentId: CuidSchema.optional(),
  designationId: CuidSchema.optional(),
  employmentStatus: z.enum(["ACTIVE", "PROBATION", "NOTICE_PERIOD", "RESIGNED", "TERMINATED"]).optional(),
  dateOfExit: z.string().datetime().optional(),
  reportingToId: CuidSchema.optional(),
  basicSalary: DecimalStringSchema.optional(),
  salaryStructure: JsonSchema,
  bankAccountName: z.string().max(200).optional(),
  bankAccountNo: z.string().max(50).optional(),
  bankIfsc: z.string().regex(/^[A-Z]{4}0[A-Z0-9]{6}$/).optional(),
  bankName: z.string().max(200).optional(),
  shiftId: CuidSchema.optional(),
  workLocation: z.string().max(200).optional(),
});

export const CreateDepartmentSchema = z.object({
  code: z.string().min(1).max(50).regex(/^[A-Z0-9_-]+$/),
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  parentId: CuidSchema.optional(),
  costCenterCode: z.string().max(50).optional(),
});

export const CreateDesignationSchema = z.object({
  code: z.string().min(1).max(50).regex(/^[A-Z0-9_-]+$/),
  name: z.string().min(1).max(200),
  level: z.number().int().min(1).max(10).default(1),
  description: z.string().max(1000).optional(),
});

export const MarkAttendanceSchema = z.object({
  employeeId: CuidSchema,
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  checkIn: z.string().datetime().optional(),
  checkOut: z.string().datetime().optional(),
  checkInLocation: z.object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
    address: z.string().optional(),
  }).optional(),
  checkOutLocation: z.object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
    address: z.string().optional(),
  }).optional(),
  device: z.enum(["WEB", "MOBILE", "BIOMETRIC", "MANUAL"]).optional(),
  status: z.enum(["PRESENT", "ABSENT", "HALF_DAY", "ON_LEAVE", "WFH", "HOLIDAY", "WEEKLY_OFF"]).optional(),
  remarks: z.string().max(1000).optional(),
});

export const BulkAttendanceSchema = z.object({
  records: z.array(MarkAttendanceSchema).min(1).max(1000),
});

export const GetAttendanceSummarySchema = z.object({
  employeeId: CuidSchema,
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(2000).max(2100),
});

export const ApplyLeaveSchema = z.object({
  employeeId: CuidSchema,
  leaveTypeId: CuidSchema,
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  reason: z.string().min(1).max(2000),
  isHalfDay: z.boolean().default(false),
  halfDayType: z.enum(["FIRST_HALF", "SECOND_HALF"]).optional(),
  attachmentUrl: z.string().url().optional(),
}).refine((data) => {
  return new Date(data.startDate) <= new Date(data.endDate);
}, { message: "Start date must be before or equal to end date", path: ["endDate"] });

export const ApproveLeaveSchema = z.object({
  leaveId: CuidSchema,
  approvedDays: DecimalStringSchema.optional(),
  comments: z.string().max(2000).optional(),
});

export const GetLeaveBalanceSchema = z.object({
  employeeId: CuidSchema,
  leaveTypeId: CuidSchema.optional(),
  asOfDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

export const GeneratePayrollSchema = z.object({
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(2000).max(2100),
  employeeIds: z.array(CuidSchema).optional(),
});

export const ProcessPayrollPaymentSchema = z.object({
  payrollIds: z.array(CuidSchema).min(1),
  paymentMethodId: CuidSchema,
  bankAccountId: CuidSchema.optional(),
  paymentDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export const GetPayrollSummarySchema = z.object({
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(2000).max(2100),
  departmentId: CuidSchema.optional(),
});

// ============================================================
// M13 — AUTOMATION VALIDATION SCHEMAS
// ============================================================

export const CreateWorkflowSchema = z.object({
  workflowCode: z.string().min(1).max(100).regex(/^[A-Z0-9_-]+$/),
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  entityType: z.string().min(1).max(100),
  entityModule: z.string().regex(/^M\d{2}$/),
  triggerType: z.enum(["MANUAL", "EVENT", "SCHEDULE", "WEBHOOK"]),
  triggerConfig: JsonSchema,
  steps: z.array(z.object({
    stepNumber: z.number().int().min(1),
    name: z.string().min(1).max(200),
    description: z.string().max(1000).optional(),
    stepType: z.enum(["CONDITION", "ACTION", "APPROVAL", "NOTIFICATION", "DELAY", "WEBHOOK", "SUB_WORKFLOW"]),
    config: z.record(z.unknown()),
    approverType: z.enum(["ROLE", "USER", "MANAGER", "DEPARTMENT_HEAD"]).optional(),
    approverIds: z.array(z.string()).optional(),
    approvalType: z.enum(["ANY", "ALL", "SEQUENTIAL"]).optional(),
    escalationAfterMinutes: z.number().int().min(1).optional(),
    onSuccessStepId: z.string().optional(),
    onFailureStepId: z.string().optional(),
    positionX: z.number().int().default(0),
    positionY: z.number().int().default(0),
  })).min(1),
});

export const TriggerWorkflowSchema = z.object({
  workflowCode: z.string().min(1).max(100),
  entityType: z.string().min(1).max(100),
  entityId: z.string().min(1),
  entityData: JsonSchema,
  triggeredBy: z.string().min(1),
});

export const GetPendingApprovalsSchema = z.object({
  userId: z.string().min(1),
  entityType: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
});

export const ActOnWorkflowStepSchema = z.object({
  executionId: CuidSchema,
  stepLogId: CuidSchema,
  action: z.enum(["APPROVED", "REJECTED"]),
  comments: z.string().max(2000).optional(),
  actedBy: z.string().min(1),
});

export const CreateScheduledJobSchema = z.object({
  jobCode: z.string().min(1).max(100).regex(/^[A-Z0-9_-]+$/),
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  cronExpression: z.string().min(1).max(100),
  timezone: z.string().max(100).default("Asia/Kolkata"),
  actionType: z.enum(["WORKFLOW", "API_CALL", "REPORT", "BACKUP", "SYNC", "CUSTOM_SCRIPT"]),
  actionConfig: z.record(z.unknown()),
  targetModule: z.string().regex(/^M\d{2}$/).optional(),
  targetEndpoint: z.string().max(500).optional(),
  notifyOnFailure: z.array(z.string().email()).default([]),
  notifyOnSuccess: z.array(z.string().email()).default([]),
});

export const CreateAutomationRuleSchema = z.object({
  ruleCode: z.string().min(1).max(100).regex(/^[A-Z0-9_-]+$/),
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  eventType: z.string().min(1).max(200),
  sourceModule: z.string().regex(/^M\d{2}$/),
  conditions: z.array(z.object({
    field: z.string().min(1),
    operator: z.enum(["EQ", "NEQ", "GT", "LT", "GTE", "LTE", "CONTAINS", "STARTS_WITH", "IN", "BETWEEN"]),
    value: z.unknown(),
    connector: z.enum(["AND", "OR"]).optional(),
  })).min(1),
  actions: z.array(z.object({
    actionType: z.enum(["SEND_EMAIL", "SEND_SMS", "CREATE_TASK", "UPDATE_FIELD", "CALL_API", "NOTIFY_USER"]),
    params: z.record(z.unknown()),
  })).min(1),
  priority: z.number().int().min(1).max(10).default(5),
  maxExecutions: z.number().int().min(1).optional(),
});

export const PublishAutomationEventSchema = z.object({
  eventType: z.string().min(1).max(200),
  sourceModule: z.string().regex(/^M\d{2}$/),
  sourceEntityId: z.string().optional(),
  payload: z.record(z.unknown()),
});

export const CreateWebhookEndpointSchema = z.object({
  name: z.string().min(1).max(200),
  endpointUrl: z.string().url(),
  authType: z.enum(["NONE", "BASIC", "BEARER", "HMAC"]).default("NONE"),
  authConfig: JsonSchema,
  eventTypes: z.array(z.string().min(1)).min(1),
  secretKey: z.string().max(500).optional(),
});

export const RegisterWebhookSchema = z.object({
  integrationCode: z.string().min(1).max(100),
  eventTypes: z.array(z.string().min(1)).min(1),
  callbackUrl: z.string().url(),
  authConfig: JsonSchema,
});

// ============================================================
// M14 — IMPORT/EXPORT VALIDATION SCHEMAS
// ============================================================

export const CreateImportJobSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  targetModule: z.string().regex(/^M\d{2}$/),
  targetEntity: z.string().min(1).max(100),
  fileUrl: z.string().url(),
  fileKey: z.string().min(1),
  fileName: z.string().min(1).max(500),
  fileSize: z.number().int().min(1),
  fileType: z.enum(["CSV", "XLSX", "JSON", "XML"]),
  mappingId: CuidSchema.optional(),
  columnMapping: z.record(z.string()).optional(),
  importStrategy: z.enum(["INSERT", "UPDATE", "UPSERT"]).default("UPSERT"),
  duplicateHandling: z.enum(["SKIP", "UPDATE", "FAIL"]).default("SKIP"),
  scheduledAt: z.string().datetime().optional(),
});

export const ImportDataSchema = z.object({
  sourceModule: z.string().regex(/^M\d{2}$/),
  targetEntity: z.string().min(1).max(100),
  fileData: z.string().min(1), // Base64
  fileType: z.enum(["CSV", "XLSX", "JSON", "XML"]),
  mapping: z.record(z.string()).optional(),
  strategy: z.enum(["INSERT", "UPDATE", "UPSERT"]).optional(),
});

export const CreateExportJobSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  sourceModule: z.string().regex(/^M\d{2}$/),
  sourceEntity: z.string().min(1).max(100),
  filters: JsonSchema,
  format: z.enum(["CSV", "XLSX", "PDF", "JSON", "XML"]),
  templateId: CuidSchema.optional(),
  columns: z.array(z.object({
    field: z.string().min(1),
    header: z.string().min(1),
    width: z.number().int().optional(),
    format: z.string().optional(),
  })).min(1),
  scheduledAt: z.string().datetime().optional(),
  isRecurring: z.boolean().default(false),
  cronExpression: z.string().max(100).optional(),
});

export const ExportDataSchema = z.object({
  sourceModule: z.string().regex(/^M\d{2}$/),
  sourceEntity: z.string().min(1).max(100),
  filters: JsonSchema,
  format: z.enum(["CSV", "XLSX", "PDF", "JSON", "XML"]),
  columns: z.array(z.object({
    field: z.string().min(1),
    header: z.string().min(1),
    width: z.number().int().optional(),
    format: z.string().optional(),
  })).optional(),
  templateId: CuidSchema.optional(),
});

export const UploadFileSchema = z.object({
  fileData: z.string().min(1), // Base64
  fileName: z.string().min(1).max(500),
  mimeType: z.string().min(1).max(200),
  module: z.string().regex(/^M\d{2}$/),
  entityType: z.string().max(100).optional(),
  entityId: z.string().optional(),
});

// ============================================================
// M15 — SYNC VALIDATION SCHEMAS
// ============================================================

export const CreateSyncConfigSchema = z.object({
  configCode: z.string().min(1).max(100).regex(/^[A-Z0-9_-]+$/),
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  sourceSystem: z.enum(["INTERNAL", "TALLY", "ZOHO_BOOKS", "QUICKBOOKS", "SALESFORCE", "SHOPIFY", "RAZORPAY", "GST_PORTAL"]),
  sourceVersion: z.string().max(50).optional(),
  syncDirection: z.enum(["BIDIRECTIONAL", "TO_EXTERNAL", "FROM_EXTERNAL"]),
  connectionType: z.enum(["API", "DATABASE", "FILE", "WEBHOOK", "SFTP"]),
  connectionConfig: z.record(z.unknown()),
  syncMode: z.enum(["MANUAL", "SCHEDULED", "REALTIME"]).default("MANUAL"),
  cronExpression: z.string().max(100).optional(),
  entityConfigs: z.array(z.object({
    internalEntity: z.string().min(1).max(100),
    externalEntity: z.string().min(1).max(100),
    fieldMappings: z.array(z.object({
      internalField: z.string().min(1),
      externalField: z.string().min(1),
      transform: z.string().optional(),
      isKey: z.boolean().default(false),
    })).min(1),
    syncDirection: z.enum(["BIDIRECTIONAL", "TO_EXTERNAL", "FROM_EXTERNAL"]).optional(),
    sourceFilter: JsonSchema,
    targetFilter: JsonSchema,
    conflictResolution: z.enum(["INTERNAL_WINS", "EXTERNAL_WINS", "TIMESTAMP_WINS", "MANUAL"]).optional(),
  })).min(1),
});

export const TriggerSyncSchema = z.object({
  syncConfigId: CuidSchema,
  entityType: z.string().max(100).optional(),
  triggeredBy: z.string().min(1),
});

export const SyncEntitySchema = z.object({
  syncConfigCode: z.string().min(1).max(100),
  entityType: z.string().min(1).max(100),
  entityId: z.string().min(1),
  direction: z.enum(["BIDIRECTIONAL", "TO_EXTERNAL", "FROM_EXTERNAL"]).optional(),
  force: z.boolean().default(false),
});

export const ResolveConflictSchema = z.object({
  conflictId: CuidSchema,
  resolution: z.enum(["INTERNAL_WINS", "EXTERNAL_WINS", "MERGED", "MANUAL"]),
  mergedValue: JsonSchema,
  resolvedBy: z.string().min(1),
});

export const IntegrationHealthCheckSchema = z.object({
  integrationCode: z.string().min(1).max(100),
});

// ============================================================
// TYPE INFERENCE EXPORTS
// ============================================================

export type CreatePaymentMethodInput = z.infer<typeof CreatePaymentMethodSchema>;
export type UpdatePaymentMethodInput = z.infer<typeof UpdatePaymentMethodSchema>;
export type CreatePaymentTransactionInput = z.infer<typeof CreatePaymentTransactionSchema>;
export type RecordPaymentInput = z.infer<typeof RecordPaymentSchema>;
export type CreateEmployeeInput = z.infer<typeof CreateEmployeeSchema>;
export type UpdateEmployeeInput = z.infer<typeof UpdateEmployeeSchema>;
export type MarkAttendanceInput = z.infer<typeof MarkAttendanceSchema>;
export type ApplyLeaveInput = z.infer<typeof ApplyLeaveSchema>;
export type GeneratePayrollInput = z.infer<typeof GeneratePayrollSchema>;
export type CreateWorkflowInput = z.infer<typeof CreateWorkflowSchema>;
export type TriggerWorkflowInput = z.infer<typeof TriggerWorkflowSchema>;
export type CreateScheduledJobInput = z.infer<typeof CreateScheduledJobSchema>;
export type CreateAutomationRuleInput = z.infer<typeof CreateAutomationRuleSchema>;
export type PublishEventInput = z.infer<typeof PublishAutomationEventSchema>;
export type CreateImportJobInput = z.infer<typeof CreateImportJobSchema>;
export type CreateExportJobInput = z.infer<typeof CreateExportJobSchema>;
export type UploadFileInput = z.infer<typeof UploadFileSchema>;
export type CreateSyncConfigInput = z.infer<typeof CreateSyncConfigSchema>;
export type SyncEntityInput = z.infer<typeof SyncEntitySchema>;
