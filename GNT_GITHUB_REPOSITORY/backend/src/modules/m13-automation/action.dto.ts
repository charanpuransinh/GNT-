// ============================================================================
// GNT MASTER BLUEPRINT V2 — M13 AUTOMATION MODULE — ACTION DTOs
// Module: M13 | Layer: DTO
// ============================================================================

export interface CreateActionDto {
  workflowId: string;
  type: string;
  config: Record<string, unknown>;
  orderIndex?: number;
}

export interface UpdateActionDto {
  type?: string;
  config?: Record<string, unknown>;
  orderIndex?: number;
  isActive?: boolean;
}

export interface ActionResponseDto {
  id: string;
  workflowId: string;
  type: string;
  config: Record<string, unknown>;
  orderIndex: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
