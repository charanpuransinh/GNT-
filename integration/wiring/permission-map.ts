export const MODULE_PERMISSION_MAP = {
  M23: ['security:read','security:manage','security:audit:read','security:retention:manage'],
  M24: ['performance:read','cache:read','cache:manage','index:read','index:manage'],
  M25: ['notification:read','notification:send','notification:manage','event:read','event:manage','realtime:connect'],
  M26: ['search:use','search:advanced','search:index','search:admin'],
  M27: ['analytics:read','analytics:manage','dashboard:read','dashboard:manage','kpi:read','kpi:manage'],
  M28: ['report:read','report:create','report:export','report:schedule','communication:send','communication:read'],
  M29: ['mobile:use','mobile:admin','sync:read','sync:manage'],
  M30: ['ai:use','ai:admin','ai:model:manage','integration:read','integration:manage'],
  M31: ['workforce:read','workforce:manage','talent:read','talent:match','recruitment:read','recruitment:manage','interview:manage','career:read','career:manage'],
  M32: ['workflow:read','workflow:manage','approval:read','approval:act','approval:admin','agent:read','agent:manage','task:read','task:manage'],
  M33: ['integration:read','integration:manage','connector:manage','webhook:read','webhook:manage'],
  M34: ['plan:read','plan:manage','subscription:read','subscription:manage','entitlement:read','entitlement:manage','usage:read','usage:manage'],
} as const;
