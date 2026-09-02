import React from 'react';

/** ROUGH SCAFFOLDING — समीक्षक AI, 2026-09-02। */
export type BadgeVariant = 'success' | 'warning' | 'info' | 'muted' | 'danger' | 'default' | (string & {});

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

export const Badge: React.FC<BadgeProps> = ({ variant = 'default', children, ...rest }) => (
  <span data-variant={variant} {...rest}>{children}</span>
);
