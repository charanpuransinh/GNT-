// ============================================================================
// GNT MASTER BLUEPRINT V2 — M13 AUTOMATION MODULE — TRIGGER DTOs
// Module: M13 | Layer: DTO
// ============================================================================

export interface CreateTriggerDto {
  workflowId: string;
  type: string;
  config: Record<string, unknown>;
}

export interface UpdateTriggerDto {
  type?: string;
  config?: Record<string, unknown>;
  isActive?: boolean;
}

export interface TriggerResponseDto {
  id: string;
  workflowId: string;
  type: string;
  config: Record<string, unknown>;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
