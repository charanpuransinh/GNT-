/**
 * M31 — workforce/capacity-planning.service.ts
 * OWN: Compare required vs available capacity.
 */

export interface CapacityInput {
  departmentId: string;
  requiredHeadcount: number;
  availableHeadcount: number;
}

export interface CapacityGap {
  departmentId: string;
  gap: number; // positive = understaffed, negative = overstaffed
  status: 'UNDERSTAFFED' | 'ADEQUATE' | 'OVERSTAFFED';
}

export class CapacityPlanningService {
  evaluate(inputs: CapacityInput[]): CapacityGap[] {
    return inputs.map((input) => {
      const gap = input.requiredHeadcount - input.availableHeadcount;
      const status: CapacityGap['status'] = gap > 0 ? 'UNDERSTAFFED' : gap < 0 ? 'OVERSTAFFED' : 'ADEQUATE';
      return { departmentId: input.departmentId, gap, status };
    });
  }
}

export const capacityPlanningService = new CapacityPlanningService();
