import React from 'react';

/** ROUGH SCAFFOLDING — समीक्षक AI, 2026-09-02। styling बाद के task में। */
export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline' | (string & {});
export type ButtonSize = 'sm' | 'md' | 'lg' | (string & {});

export interface ButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  children?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({ variant = 'primary', size = 'md', loading = false, disabled, children, ...rest }) => (
  <button data-variant={variant} data-size={size} data-loading={loading || undefined} disabled={disabled || loading} {...rest}>
    {loading ? '…' : children}
  </button>
);
