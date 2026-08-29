import { z } from 'zod';

export const loginSchema = z.object({
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(50, 'Username too long'),
  password: z
    .string()
    .min(6, 'Password must be at least 6 characters')
    .max(100, 'Password too long'),
  companyCode: z
    .string()
    .min(2, 'Company code must be at least 2 characters')
    .max(20, 'Company code too long'),
});

export const otpSchema = z.object({
  otp: z
    .string()
    .length(6, 'OTP must be exactly 6 digits')
    .regex(/^\d{6}$/, 'OTP must contain only digits'),
});

export const roleSelectSchema = z.object({
  roleId: z.string().uuid('Invalid role ID'),
});

export const passwordChangeSchema = z
  .object({
    currentPassword: z.string().min(6, 'Current password required'),
    newPassword: z
      .string()
      .min(8, 'New password must be at least 8 characters')
      .regex(/[A-Z]/, 'Must contain uppercase letter')
      .regex(/[a-z]/, 'Must contain lowercase letter')
      .regex(/[0-9]/, 'Must contain number')
      .regex(/[^A-Za-z0-9]/, 'Must contain special character'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type LoginInput = z.infer<typeof loginSchema>;
export type OTPInput = z.infer<typeof otpSchema>;
export type RoleSelectInput = z.infer<typeof roleSelectSchema>;
export type PasswordChangeInput = z.infer<typeof passwordChangeSchema>;
