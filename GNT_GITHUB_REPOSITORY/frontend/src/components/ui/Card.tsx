/**
 * Card — shadcn-shaili ka chhota set (M19/M20 pages isi API ka istemal karte hain).
 * Purana `Card.tsx` sirf ek div tha; yeh usi ke upar poora parivaar deta hai.
 */
import React from 'react';

type DivProps = React.HTMLAttributes<HTMLDivElement>;

const cx = (...parts: Array<string | undefined>) => parts.filter(Boolean).join(' ');

export const Card: React.FC<DivProps> = ({ className, children, ...rest }) => (
  <div className={cx('rounded-lg border border-[#E2E8F0] bg-white shadow-sm', className)} {...rest}>
    {children}
  </div>
);

export const CardHeader: React.FC<DivProps> = ({ className, children, ...rest }) => (
  <div className={cx('flex flex-col space-y-1.5 p-6 pb-2', className)} {...rest}>{children}</div>
);

export const CardTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({ className, children, ...rest }) => (
  <h3 className={cx('text-lg font-semibold text-[#0F172A]', className)} {...rest}>{children}</h3>
);

export const CardDescription: React.FC<React.HTMLAttributes<HTMLParagraphElement>> = ({ className, children, ...rest }) => (
  <p className={cx('text-sm text-[#64748B]', className)} {...rest}>{children}</p>
);

export const CardContent: React.FC<DivProps> = ({ className, children, ...rest }) => (
  <div className={cx('p-6 pt-0', className)} {...rest}>{children}</div>
);

export const CardFooter: React.FC<DivProps> = ({ className, children, ...rest }) => (
  <div className={cx('flex items-center p-6 pt-0', className)} {...rest}>{children}</div>
);

export default Card;
