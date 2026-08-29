// GNT M20 — Internal Helper Logic
// Owner: D4-DELTA | Private helpers, not exposed to other modules

import { Prisma } from '@prisma/client';

export function calculateAssessableValue(
  valueCif: Prisma.Decimal | null,
  valueFob: Prisma.Decimal | null,
  freight: number,
  insurance: number,
  fxRate: number
): number {
  let baseValue = 0;
  if (valueCif) {
    baseValue = Number(valueCif) * fxRate;
  } else if (valueFob) {
    baseValue = (Number(valueFob) + freight + insurance) * fxRate;
  }
  return Math.round(baseValue * 100) / 100;
}

export function generateReferenceNo(prefix: string, sequence: number): string {
  const date = new Date();
  const yy = date.getFullYear().toString().slice(-2);
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const seq = String(sequence).padStart(6, '0');
  return `${prefix}-${yy}${mm}-${seq}`;
}

export function validateTradeJobTransition(
  currentStatus: string,
  nextStatus: string
): boolean {
  const allowedTransitions: Record<string, string[]> = {
    draft: ['submitted', 'cancelled'],
    submitted: ['under_review', 'cancelled'],
    under_review: ['customs_cleared', 'cancelled'],
    customs_cleared: ['completed', 'cancelled'],
    completed: [],
    cancelled: [],
  };
  return allowedTransitions[currentStatus]?.includes(nextStatus) ?? false;
}

export function sanitizeHSNQuery(query: string): string {
  return query.replace(/[^0-9a-zA-Z\s]/g, '').trim();
}
