// ============================================================
// GNT MASTER BLUEPRINT V2 — API CONTRACTS (M11-M15)
// Module Owner: TEAM C | Session 2: API Contracts
// Lock Artifact: M11-M15_API_CONTRACTS_v2.0.0
// Rule: All cross-module calls go through PUBLIC API layer only.
// ============================================================

// ============================================================
// SHARED / COMMON TYPES
// ============================================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
  meta?: ResponseMeta;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, string[]>;
  traceId?: string;
}

export interface ResponseMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginationQuery {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface DateRangeFilter {
  from?: string;
  to?: string;
}

export interface TenantContext {
  tenantId: string;
  userId: string;
  roles: string[];
  permissions: string[];
}

// ============================================================
// M11 — PAYMENT MODULE API CONTRACTS
// ============================================================

export interface PaymentMethod {
  id: string;
  code: string;
  name: string;
  description?: string;
  isActive: boolean;
  configJson?: Record<string, unknown>;
  providerCode?: string;
  providerConfig?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePaymentMethodRequest {
  code: string;
  name: string;
  description?: string;
  providerCode?: string;
  providerConfig?: Record<string, unknown>;
  configJson?: Record<string, unknown>;
}

export interface UpdatePaymentMethodRequest {
  name?: string;
  description?: string;
  isActive?: boolean;
  providerConfig?: Record<string, unknown>;
  configJson?: Record<string, unknown>;
}

export interface PaymentTransaction {
  id: string;
  transactionNumber: string;
  partyType: "CUSTOMER" | "VENDOR" | "EMPLOYEE" | "SYSTEM";
  partyId: string;
  partyName: string;
  partyContact?: string;
  amount: string;
  currency: string;
  exchangeRate: string;
  baseAmount: string;
  direction: "IN" | "OUT";
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED" | "CANCELLED" | "REFUNDED";
  statusHistory: StatusHistoryEntry[];
  paymentMethodId: string;
  paymentMethod?: PaymentMethod;
  referenceType?: string;
  referenceId?: string;
  referenceNumber?: string;
  providerRef?: string;
  transactionDate: string;
  valueDate?: string;
  settledAt?: string;
  narration?: string;
  internalNotes?: string;
  reconciled: boolean;
  bankAccountId?: string;
  createdAt: string;
}

export interface StatusHistoryEntry {
  status: string;
  at: string;
  by: string;
  reason?: string;
}

export interface CreatePaymentTransactionRequest {
  partyType: string;
  partyId: string;
  partyName: string;
  partyContact?: string;
  amount: string;
  currency?: string;
  exchangeRate?: string;
  direction: "IN" | "OUT";
  paymentMethodId: string;
  referenceType?: string;
  referenceId?: string;
  referenceNumber?: string;
  transactionDate: string;
  valueDate?: string;
  narration?: string;
  internalNotes?: string;
  bankAccountId?: string;
}

export interface UpdatePaymentStatusRequest {
  status: string;
  reason?: string;
  providerRef?: string;
  providerResponse?: Record<string, unknown>;
}

// PUBLIC API: Record Payment (Called by M07, M08, M12)
export interface RecordPaymentRequest {
  sourceModule: string;
  sourceEntityType: string;
  sourceEntityId: string;
  sourceEntityNumber: string;
  partyType: string;
  partyId: string;
  partyName: string;
  amount: string;
  paymentMethodId: string;
  transactionDate: string;
  narration?: string;
  bankAccountId?: string;
}

export interface RecordPaymentResponse {
  transactionId: string;
  transactionNumber: string;
  status: string;
  message: string;
}

// PUBLIC API: Get Party Balance
export interface GetPartyBalanceRequest {
  partyType: string;
  partyId: string;
  asOfDate?: string;
}

export interface GetPartyBalanceResponse {
  partyType: string;
  partyId: string;
  totalReceivable: string;
  totalReceived: string;
  totalPayable: string;
  totalPaid: string;
  netBalance: string;
  currency: string;
}

export interface PaymentAllocation {
  id: string;
  transactionId: string;
  targetType: string;
  targetId: string;
  targetNumber?: string;
  allocatedAmount: string;
  isFullPayment: boolean;
}

export interface PaymentSchedule {
  id: string;
  scheduleNumber: string;
  sourceType: string;
  sourceId: string;
  totalAmount: string;
  paidAmount: string;
  pendingAmount: string;
  frequency?: string;
  installments: number;
  startDate: string;
  endDate?: string;
  nextDueDate?: string;
  status: string;
  paymentMethodId?: string;
  installmentsList: PaymentInstallment[];
}

export interface PaymentInstallment {
  id: string;
  installmentNo: number;
  amount: string;
  dueDate: string;
  paidDate?: string;
  status: string;
  transactionId?: string;
}

export interface Refund {
  id: string;
  refundNumber: string;
  originalTxnId: string;
  amount: string;
  reason: string;
  status: string;
  processedAt?: string;
  providerRef?: string;
}

export interface CreateRefundRequest {
  originalTxnId: string;
  amount: string;
  reason: string;
}

export interface BankAccount {
  id: string;
  accountCode: string;
  accountName: string;
  bankName: string;
  accountNumber: string;
  ifscCode?: string;
  branch?: string;
  accountType: string;
  currency: string;
  openingBalance: string;
  currentBalance: string;
  isDefault: boolean;
  isActive: boolean;
  syncConfig?: Record<string, unknown>;
  lastSyncedAt?: string;
}

export interface CreateBankAccountRequest {
  accountCode: string;
  accountName: string;
  bankName: string;
  accountNumber: string;
  ifscCode?: string;
  branch?: string;
  accountType: string;
  currency?: string;
  openingBalance?: string;
  isDefault?: boolean;
  syncConfig?: Record<string, unknown>;
}

export interface PaymentReconciliation {
  id: string;
  reconNumber: string;
  bankAccountId: string;
  statementDate: string;
  openingBalance: string;
  closingBalance: string;
  matchedCount: number;
  unmatchedCount: number;
  matchedAmount: string;
  unmatchedAmount: string;
  status: string;
  statementFileId?: string;
}

// ============================================================
// M12 — HR MODULE API CONTRACTS
// ============================================================

export interface Employee {
  id: string;
  employeeCode: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  alternatePhone?: string;
  dateOfBirth?: string;
  gender?: string;
  bloodGroup?: string;
  panNumber?: string;
  aadhaarNumber?: string;
  uanNumber?: string;
  esicNumber?: string;
  departmentId: string;
  department?: Department;
  designationId: string;
  designation?: Designation;
  employmentType: string;
  employmentStatus: string;
  dateOfJoining: string;
  dateOfExit?: string;
  reportingToId?: string;
  reportingTo?: Pick<Employee, "id" | "firstName" | "lastName" | "employeeCode">;
  basicSalary: string;
  salaryStructure?: Record<string, unknown>;
  bankAccountName?: string;
  bankAccountNo?: string;
  bankIfsc?: string;
  bankName?: string;
  shiftId?: string;
  shift?: Shift;
  workLocation?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateEmployeeRequest {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: string;
  panNumber?: string;
  aadhaarNumber?: string;
  uanNumber?: string;
  departmentId: string;
  designationId: string;
  employmentType?: string;
  dateOfJoining: string;
  reportingToId?: string;
  basicSalary: string;
  salaryStructure?: Record<string, unknown>;
  bankAccountName?: string;
  bankAccountNo?: string;
  bankIfsc?: string;
  bankName?: string;
  shiftId?: string;
  workLocation?: string;
}

export interface UpdateEmployeeRequest {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  departmentId?: string;
  designationId?: string;
  employmentStatus?: string;
  dateOfExit?: string;
  reportingToId?: string;
  basicSalary?: string;
  salaryStructure?: Record<string, unknown>;
  bankAccountName?: string;
  bankAccountNo?: string;
  bankIfsc?: string;
  bankName?: string;
  shiftId?: string;
  workLocation?: string;
}

// PUBLIC API: Get Employee Basic Info
export interface GetEmployeeBasicResponse {
  id: string;
  employeeCode: string;
  fullName: string;
  email: string;
  departmentName: string;
  designationName: string;
  employmentStatus: string;
  bankAccountNo?: string;
  bankIfsc?: string;
  bankName?: string;
}

export interface Department {
  id: string;
  code: string;
  name: string;
  description?: string;
  parentId?: string;
  parent?: Pick<Department, "id" | "name" | "code">;
  children?: Department[];
  costCenterCode?: string;
  isActive: boolean;
}

export interface CreateDepartmentRequest {
  code: string;
  name: string;
  description?: string;
  parentId?: string;
  costCenterCode?: string;
}

export interface Designation {
  id: string;
  code: string;
  name: string;
  level: number;
  description?: string;
  isActive: boolean;
}

export interface CreateDesignationRequest {
  code: string;
  name: string;
  level?: number;
  description?: string;
}

export interface Shift {
  id: string;
  code: string;
  name: string;
  startTime: string;
  endTime: string;
  breakDuration: number;
  workingDays: string[];
  gracePeriod: number;
  halfDayAfter: number;
  isNightShift: boolean;
  isActive: boolean;
}

export interface Attendance {
  id: string;
  employeeId: string;
  employee?: Pick<Employee, "id" | "firstName" | "lastName" | "employeeCode">;
  date: string;
  checkIn?: string;
  checkOut?: string;
  checkInLocation?: GeoLocation;
  checkOutLocation?: GeoLocation;
  checkInDevice?: string;
  checkOutDevice?: string;
  totalHours?: string;
  breakHours?: string;
  workingHours?: string;
  overtimeHours?: string;
  status: string;
  lateByMinutes: number;
  earlyExitMinutes: number;
  remarks?: string;
}

export interface GeoLocation {
  lat: number;
  lng: number;
  address?: string;
}

export interface MarkAttendanceRequest {
  employeeId: string;
  date: string;
  checkIn?: string;
  checkOut?: string;
  checkInLocation?: GeoLocation;
  checkOutLocation?: GeoLocation;
  device?: string;
  status?: string;
  remarks?: string;
}

export interface BulkAttendanceRequest {
  records: MarkAttendanceRequest[];
}

// PUBLIC API: Get Attendance Summary
export interface GetAttendanceSummaryRequest {
  employeeId: string;
  month: number;
  year: number;
}

export interface GetAttendanceSummaryResponse {
  employeeId: string;
  month: number;
  year: number;
  daysPresent: number;
  daysAbsent: number;
  daysLeave: number;
  daysHoliday: number;
  daysWeekOff: number;
  halfDays: number;
  totalWorkingHours: string;
  totalOvertimeHours: string;
  lateCount: number;
  earlyExitCount: number;
}

export interface LeaveType {
  id: string;
  code: string;
  name: string;
  description?: string;
  annualQuota: string;
  maxCarryForward: string;
  encashable: boolean;
  minDaysPerRequest: number;
  maxDaysPerRequest?: number;
  noticeDaysRequired: number;
  isPaid: boolean;
  payPercentage: string;
  isActive: boolean;
}

export interface Leave {
  id: string;
  leaveNumber: string;
  employeeId: string;
  employee?: Pick<Employee, "id" | "firstName" | "lastName" | "employeeCode">;
  leaveTypeId: string;
  leaveType?: LeaveType;
  startDate: string;
  endDate: string;
  daysRequested: string;
  daysApproved?: string;
  reason: string;
  attachmentUrl?: string;
  status: string;
  approvedById?: string;
  approvedAt?: string;
  rejectionReason?: string;
  isHalfDay: boolean;
  halfDayType?: string;
}

export interface ApplyLeaveRequest {
  employeeId: string;
  leaveTypeId: string;
  startDate: string;
  endDate: string;
  reason: string;
  isHalfDay?: boolean;
  halfDayType?: string;
  attachmentUrl?: string;
}

export interface ApproveLeaveRequest {
  leaveId: string;
  approvedDays?: string;
  comments?: string;
}

// PUBLIC API: Get Leave Balance
export interface GetLeaveBalanceRequest {
  employeeId: string;
  leaveTypeId?: string;
  asOfDate?: string;
}

export interface LeaveBalanceEntry {
  leaveTypeId: string;
  leaveTypeName: string;
  annualQuota: string;
  used: string;
  pending: string;
  available: string;
  carryForward: string;
}

export interface GetLeaveBalanceResponse {
  employeeId: string;
  asOfDate: string;
  balances: LeaveBalanceEntry[];
}

export interface Holiday {
  id: string;
  name: string;
  date: string;
  holidayType: string;
  description?: string;
  isRecurring: boolean;
}

export interface Payroll {
  id: string;
  payrollNumber: string;
  employeeId: string;
  employee?: Pick<Employee, "id" | "firstName" | "lastName" | "employeeCode">;
  month: number;
  year: number;
  periodStart: string;
  periodEnd: string;
  daysWorked: string;
  daysLeave: string;
  daysAbsent: string;
  daysHoliday: string;
  overtimeHours: string;
  basicSalary: string;
  hra: string;
  da: string;
  conveyance: string;
  medical: string;
  specialAllowance: string;
  overtimePay: string;
  bonus: string;
  otherEarnings: string;
  totalEarnings: string;
  pfEmployee: string;
  pfEmployer: string;
  esiEmployee: string;
  esiEmployer: string;
  tds: string;
  professionalTax: string;
  advanceRecovery: string;
  otherDeductions: string;
  totalDeductions: string;
  netPay: string;
  status: string;
  paymentTransactionId?: string;
  paidAt?: string;
  paidBy?: string;
  payslipGeneratedAt?: string;
  payslipUrl?: string;
}

export interface GeneratePayrollRequest {
  month: number;
  year: number;
  employeeIds?: string[];
}

export interface ProcessPayrollPaymentRequest {
  payrollIds: string[];
  paymentMethodId: string;
  bankAccountId?: string;
  paymentDate: string;
}

// PUBLIC API: Payroll Summary for Finance
export interface GetPayrollSummaryRequest {
  month: number;
  year: number;
  departmentId?: string;
}

export interface PayrollSummaryEntry {
  departmentId: string;
  departmentName: string;
  employeeCount: number;
  totalEarnings: string;
  totalDeductions: string;
  netPay: string;
  pfEmployerTotal: string;
  esiEmployerTotal: string;
}

export interface GetPayrollSummaryResponse {
  month: number;
  year: number;
  summaries: PayrollSummaryEntry[];
  grandTotalEarnings: string;
  grandTotalDeductions: string;
  grandNetPay: string;
}

export interface PayrollTemplate {
  id: string;
  name: string;
  description?: string;
  components: PayrollComponent[];
  isDefault: boolean;
  isActive: boolean;
}

export interface PayrollComponent {
  type: "EARNING" | "DEDUCTION";
  name: string;
  formula: string;
  isMandatory: boolean;
  isTaxable?: boolean;
  displayOrder: number;
}

// ============================================================
// M13 — AUTOMATION MODULE API CONTRACTS
// ============================================================

export interface Workflow {
  id: string;
  workflowCode: string;
  name: string;
  description?: string;
  entityType: string;
  entityModule: string;
  triggerType: string;
  triggerConfig?: Record<string, unknown>;
  status: string;
  version: number;
  steps: WorkflowStep[];
  createdAt: string;
  updatedAt: string;
}

export interface WorkflowStep {
  id: string;
  stepNumber: number;
  name: string;
  description?: string;
  stepType: string;
  config: Record<string, unknown>;
  approverType?: string;
  approverIds?: string[];
  approvalType?: string;
  escalationAfterMinutes?: number;
  onSuccessStepId?: string;
  onFailureStepId?: string;
  positionX: number;
  positionY: number;
}

export interface CreateWorkflowRequest {
  workflowCode: string;
  name: string;
  description?: string;
  entityType: string;
  entityModule: string;
  triggerType: string;
  triggerConfig?: Record<string, unknown>;
  steps: CreateWorkflowStepRequest[];
}

export interface CreateWorkflowStepRequest {
  stepNumber: number;
  name: string;
  description?: string;
  stepType: string;
  config: Record<string, unknown>;
  approverType?: string;
  approverIds?: string[];
  approvalType?: string;
  escalationAfterMinutes?: number;
  onSuccessStepId?: string;
  onFailureStepId?: string;
  positionX?: number;
  positionY?: number;
}

// PUBLIC API: Trigger Workflow
export interface TriggerWorkflowRequest {
  workflowCode: string;
  entityType: string;
  entityId: string;
  entityData?: Record<string, unknown>;
  triggeredBy: string;
}

export interface TriggerWorkflowResponse {
  executionId: string;
  executionNumber: string;
  status: string;
  message: string;
}

// PUBLIC API: Get Pending Approvals
export interface GetPendingApprovalsRequest {
  userId: string;
  entityType?: string;
  page?: number;
  limit?: number;
}

export interface PendingApprovalItem {
  executionId: string;
  stepLogId: string;
  workflowName: string;
  stepName: string;
  entityType: string;
  entityId: string;
  entitySummary: string;
  requestedAt: string;
  escalationAt?: string;
}

export interface WorkflowExecution {
  id: string;
  executionNumber: string;
  workflowId: string;
  workflow?: Pick<Workflow, "id" | "name" | "workflowCode">;
  entityType: string;
  entityId: string;
  entityData?: Record<string, unknown>;
  status: string;
  currentStepId?: string;
  startedAt: string;
  completedAt?: string;
  resultData?: Record<string, unknown>;
  errorMessage?: string;
  stepLogs: WorkflowStepLog[];
}

export interface WorkflowStepLog {
  id: string;
  stepId: string;
  stepName: string;
  stepType: string;
  status: string;
  startedAt: string;
  completedAt?: string;
  inputData?: Record<string, unknown>;
  outputData?: Record<string, unknown>;
  errorDetails?: Record<string, unknown>;
  actedBy?: string;
  actedAt?: string;
  action?: string;
  comments?: string;
}

// PUBLIC API: Act on Approval Step
export interface ActOnWorkflowStepRequest {
  executionId: string;
  stepLogId: string;
  action: "APPROVED" | "REJECTED";
  comments?: string;
  actedBy: string;
}

export interface ScheduledJob {
  id: string;
  jobCode: string;
  name: string;
  description?: string;
  cronExpression: string;
  timezone: string;
  actionType: string;
  actionConfig: Record<string, unknown>;
  targetModule?: string;
  targetEndpoint?: string;
  status: string;
  lastRunAt?: string;
  lastRunStatus?: string;
  lastRunResult?: Record<string, unknown>;
  nextRunAt?: string;
  runCount: number;
  failureCount: number;
  notifyOnFailure: string[];
  notifyOnSuccess: string[];
}

export interface CreateScheduledJobRequest {
  jobCode: string;
  name: string;
  description?: string;
  cronExpression: string;
  timezone?: string;
  actionType: string;
  actionConfig: Record<string, unknown>;
  targetModule?: string;
  targetEndpoint?: string;
  notifyOnFailure?: string[];
  notifyOnSuccess?: string[];
}

export interface AutomationRule {
  id: string;
  ruleCode: string;
  name: string;
  description?: string;
  eventType: string;
  sourceModule: string;
  conditions: AutomationCondition[];
  actions: AutomationAction[];
  status: string;
  priority: number;
  maxExecutions?: number;
  executionCount: number;
}

export interface AutomationCondition {
  field: string;
  operator: string;
  value: unknown;
  connector?: "AND" | "OR";
}

export interface AutomationAction {
  actionType: string;
  params: Record<string, unknown>;
}

// PUBLIC API: Publish Event
export interface PublishAutomationEventRequest {
  eventType: string;
  sourceModule: string;
  sourceEntityId?: string;
  payload: Record<string, unknown>;
}

export interface PublishAutomationEventResponse {
  triggeredRules: number;
  executionIds: string[];
}

export interface WebhookEndpoint {
  id: string;
  name: string;
  endpointUrl: string;
  secretKey?: string;
  authType: string;
  authConfig?: Record<string, unknown>;
  eventTypes: string[];
  status: string;
  lastDeliveredAt?: string;
  lastDeliveryStatus?: string;
  failureCount: number;
}

export interface CreateWebhookEndpointRequest {
  name: string;
  endpointUrl: string;
  authType?: string;
  authConfig?: Record<string, unknown>;
  eventTypes: string[];
  secretKey?: string;
}

// PUBLIC API: Register Webhook
export interface RegisterWebhookRequest {
  integrationCode: string;
  eventTypes: string[];
  callbackUrl: string;
  authConfig?: Record<string, unknown>;
}

// ============================================================
// M14 — IMPORT/EXPORT MODULE API CONTRACTS
// ============================================================

export interface ImportJob {
  id: string;
  jobNumber: string;
  name: string;
  description?: string;
  targetModule: string;
  targetEntity: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  mappingId?: string;
  columnMapping?: Record<string, string>;
  totalRows: number;
  processedRows: number;
  successRows: number;
  failedRows: number;
  skippedRows: number;
  status: string;
  validationReport?: ImportValidationReport;
  importStrategy: string;
  duplicateHandling: string;
  resultFileUrl?: string;
  scheduledAt?: string;
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
}

export interface ImportValidationReport {
  errors: ValidationMessage[];
  warnings: ValidationMessage[];
  rowErrors: RowValidationError[];
}

export interface ValidationMessage {
  field: string;
  message: string;
  code: string;
}

export interface RowValidationError {
  rowNumber: number;
  errors: ValidationMessage[];
}

export interface CreateImportJobRequest {
  name: string;
  description?: string;
  targetModule: string;
  targetEntity: string;
  fileUrl: string;
  fileKey: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  mappingId?: string;
  columnMapping?: Record<string, string>;
  importStrategy?: string;
  duplicateHandling?: string;
  scheduledAt?: string;
}

// PUBLIC API: Import Data
export interface ImportDataRequest {
  sourceModule: string;
  targetEntity: string;
  fileData: string;
  fileType: string;
  mapping?: Record<string, string>;
  strategy?: string;
}

export interface ImportDataResponse {
  jobId: string;
  jobNumber: string;
  status: string;
  totalRows: number;
  successRows: number;
  failedRows: number;
  resultFileUrl?: string;
}

export interface ImportMapping {
  id: string;
  name: string;
  description?: string;
  targetModule: string;
  targetEntity: string;
  mappings: ColumnMapping[];
  validationRules: ValidationRule[];
  isDefault: boolean;
  isActive: boolean;
}

export interface ColumnMapping {
  sourceColumn: string;
  targetField: string;
  transform?: string;
  isRequired: boolean;
  defaultValue?: string;
}

export interface ValidationRule {
  field: string;
  rule: string;
  params?: Record<string, unknown>;
  errorMessage: string;
}

export interface ExportJob {
  id: string;
  jobNumber: string;
  name: string;
  description?: string;
  sourceModule: string;
  sourceEntity: string;
  filters?: Record<string, unknown>;
  format: string;
  templateId?: string;
  columns: ExportColumn[];
  status: string;
  totalRecords?: number;
  fileUrl?: string;
  fileSize?: number;
  expiresAt?: string;
  scheduledAt?: string;
  startedAt?: string;
  completedAt?: string;
  isRecurring: boolean;
  cronExpression?: string;
  createdAt: string;
}

export interface ExportColumn {
  field: string;
  header: string;
  width?: number;
  format?: string;
}

export interface CreateExportJobRequest {
  name: string;
  description?: string;
  sourceModule: string;
  sourceEntity: string;
  filters?: Record<string, unknown>;
  format: string;
  templateId?: string;
  columns: ExportColumn[];
  scheduledAt?: string;
  isRecurring?: boolean;
  cronExpression?: string;
}

// PUBLIC API: Export Data
export interface ExportDataRequest {
  sourceModule: string;
  sourceEntity: string;
  filters?: Record<string, unknown>;
  format: string;
  columns?: ExportColumn[];
  templateId?: string;
}

export interface ExportDataResponse {
  jobId: string;
  jobNumber: string;
  status: string;
  downloadUrl?: string;
  expiresAt?: string;
}

export interface ExportTemplate {
  id: string;
  name: string;
  description?: string;
  sourceModule: string;
  sourceEntity: string;
  format: string;
  columns: ExportColumn[];
  headerStyle?: Record<string, unknown>;
  rowStyle?: Record<string, unknown>;
  footerConfig?: Record<string, unknown>;
  defaultFilters?: Record<string, unknown>;
  isDefault: boolean;
  isActive: boolean;
}

export interface FileUpload {
  id: string;
  uploadCode: string;
  originalName: string;
  fileName: string;
  fileUrl: string;
  fileKey: string;
  mimeType: string;
  fileSize: number;
  module: string;
  entityType?: string;
  entityId?: string;
  checksum?: string;
  metadata?: Record<string, unknown>;
  expiresAt?: string;
  createdAt: string;
}

// PUBLIC API: Upload File
export interface UploadFileRequest {
  fileData: string;
  fileName: string;
  mimeType: string;
  module: string;
  entityType?: string;
  entityId?: string;
}

export interface UploadFileResponse {
  uploadId: string;
  uploadCode: string;
  fileUrl: string;
  fileKey: string;
}

// ============================================================
// M15 — SYNC MODULE API CONTRACTS
// ============================================================

export interface SyncConfig {
  id: string;
  configCode: string;
  name: string;
  description?: string;
  sourceSystem: string;
  sourceVersion?: string;
  syncDirection: string;
  entityConfigs: SyncEntityConfig[];
  connectionType: string;
  connectionConfig: Record<string, unknown>;
  syncMode: string;
  cronExpression?: string;
  status: string;
  lastSyncAt?: string;
  lastSyncStatus?: string;
  lastSyncJobId?: string;
  consecutiveErrors: number;
  errorThreshold: number;
  createdAt: string;
  updatedAt: string;
}

export interface SyncEntityConfig {
  id: string;
  internalEntity: string;
  externalEntity: string;
  fieldMappings: FieldMapping[];
  syncDirection: string;
  sourceFilter?: Record<string, unknown>;
  targetFilter?: Record<string, unknown>;
  conflictResolution: string;
  syncMode?: string;
  cronExpression?: string;
  isActive: boolean;
}

export interface FieldMapping {
  internalField: string;
  externalField: string;
  transform?: string;
  isKey: boolean;
}

export interface CreateSyncConfigRequest {
  configCode: string;
  name: string;
  description?: string;
  sourceSystem: string;
  sourceVersion?: string;
  syncDirection: string;
  connectionType: string;
  connectionConfig: Record<string, unknown>;
  syncMode?: string;
  cronExpression?: string;
  entityConfigs: CreateSyncEntityConfigRequest[];
}

export interface CreateSyncEntityConfigRequest {
  internalEntity: string;
  externalEntity: string;
  fieldMappings: FieldMapping[];
  syncDirection?: string;
  sourceFilter?: Record<string, unknown>;
  targetFilter?: Record<string, unknown>;
  conflictResolution?: string;
}

export interface SyncJob {
  id: string;
  jobNumber: string;
  syncConfigId: string;
  syncConfig?: Pick<SyncConfig, "id" | "name" | "configCode">;
  triggeredBy: string;
  triggeredByUser?: string;
  entityType?: string;
  status: string;
  totalEntities: number;
  processedEntities: number;
  createdCount: number;
  updatedCount: number;
  deletedCount: number;
  skippedCount: number;
  errorCount: number;
  conflictCount: number;
  startedAt?: string;
  completedAt?: string;
  durationMs?: number;
  resultSummary?: Record<string, unknown>;
  errorSummary?: Record<string, unknown>;
  createdAt: string;
}

export interface TriggerSyncRequest {
  syncConfigId: string;
  entityType?: string;
  triggeredBy: string;
}

// PUBLIC API: Sync Entity
export interface SyncEntityRequest {
  syncConfigCode: string;
  entityType: string;
  entityId: string;
  direction?: string;
  force?: boolean;
}

export interface SyncEntityResponse {
  jobId: string;
  jobNumber: string;
  status: string;
  actions: string[];
}

export interface SyncConflict {
  id: string;
  syncJobId: string;
  entityType: string;
  internalId: string;
  externalId: string;
  conflictType: string;
  conflictField?: string;
  internalValue?: Record<string, unknown>;
  externalValue?: Record<string, unknown>;
  internalVersion?: string;
  externalVersion?: string;
  resolution?: string;
  resolvedBy?: string;
  resolvedAt?: string;
  mergedValue?: Record<string, unknown>;
  status: string;
}

export interface ResolveConflictRequest {
  conflictId: string;
  resolution: string;
  mergedValue?: Record<string, unknown>;
  resolvedBy: string;
}

export interface ExternalIntegration {
  id: string;
  integrationCode: string;
  name: string;
  description?: string;
  provider: string;
  providerVersion?: string;
  authType: string;
  authConfig: Record<string, unknown>;
  baseUrl?: string;
  apiVersion?: string;
  endpoints?: Record<string, unknown>;
  status: string;
  lastHealthCheck?: string;
  healthStatus?: string;
  rateLimitConfig?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

// PUBLIC API: Health Check Integration
export interface IntegrationHealthCheckRequest {
  integrationCode: string;
}

export interface IntegrationHealthCheckResponse {
  integrationCode: string;
  status: string;
  latencyMs: number;
  lastChecked: string;
  details?: Record<string, unknown>;
}

export interface SyncState {
  id: string;
  syncConfigId: string;
  entityType: string;
  lastSyncAt: string;
  lastSyncJobId: string;
  watermark?: Record<string, unknown>;
  totalSynced: number;
  lastBatchSize: number;
  checksum?: string;
  updatedAt: string;
}
