// ============================================================================
// GNT MASTER BLUEPRINT V2 — M13 AUTOMATION MODULE — WORKFLOW DTOs
// Module: M13 | Layer: DTO
// ============================================================================

export interface CreateWorkflowDto {
  name: string;
  description?: string;
  isActive?: boolean;
}

export interface UpdateWorkflowDto {
  name?: string;
  description?: string;
  isActive?: boolean;
}

export interface WorkflowResponseDto {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
