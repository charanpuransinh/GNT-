// ============================================================================
// M05 PARTY MANAGEMENT — Events (module के अंदर के event नाम)
// ============================================================================

export const PARTY_EVENTS = {
  CREATED: 'party.created',
  UPDATED: 'party.updated',
  DEACTIVATED: 'party.deactivated',
} as const;

export type PartyEventPayload = {
  party_id: string;
  company_id: string;
  at: Date;
};
