// GNT M06 — Frontend Constants

export const UNITS = [
  'Piece', 'Kg', 'Gram', 'Liter', 'Ml', 'Meter', 'Cm', 'Box', 'Pack', 'Dozen',
  'Pair', 'Set', 'Roll', 'Sheet', 'Bundle', 'Bag', 'Carton', 'Case', 'Pallet',
  'Ton', 'Quintal', 'Foot', 'Inch', 'Yard', 'Gallon', 'Quart', 'Pint',
] as const;

export const GST_RATES = [0, 0.25, 3, 5, 12, 18, 28] as const;

export const STOCK_STATUS_COLORS = {
  in_stock: '#16A34A',
  low_stock: '#F59E0B',
  out_of_stock: '#DC2626',
  overstock: '#0EA5E9',
} as const;

export const MOVEMENT_TYPE_LABELS = {
  in: 'Stock In',
  out: 'Stock Out',
  adjustment: 'Adjustment',
  transfer: 'Transfer',
} as const;

export const MOVEMENT_TYPE_COLORS = {
  in: '#16A34A',
  out: '#DC2626',
  adjustment: '#F59E0B',
  transfer: '#0EA5E9',
} as const;
