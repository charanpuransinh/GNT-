import React from 'react';
export const AppLogo: React.FC<{ alt?: string; size?: 'sm' | 'md' | 'lg'; className?: string }> = ({ alt = 'GNT', size = 'md', className }) => (
  <span aria-label={alt} className={`${size === 'lg' ? 'text-3xl font-bold' : size === 'sm' ? 'text-sm font-semibold' : 'text-xl font-bold'}${className ? ` ${className}` : ''}`}>{alt}</span>
);
