// ============================================================================
// GNT MASTER BLUEPRINT V2 — M13 AUTOMATION MODULE — JOB DTOs
// Module: M13 | Layer: DTO
// ============================================================================

export interface CreateJobDto {
  workflowId: string;
  payload?: Record<string, unknown>;
  maxRetries?: number;
}

export interface JobResponseDto {
  id: string;
  workflowId: string;
  status: string;
  payload: Record<string, unknown> | null;
  result: Record<string, unknown> | null;
  error: string | null;
  retryCount: number;
  maxRetries: number;
  startedAt: Date | null;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface JobLogResponseDto {
  id: string;
  jobId: string;
  level: string;
  message: string;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
}
