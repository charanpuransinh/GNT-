import { z } from 'zod';

export const loginSchema = z.object({
  username: z.string().min(3).max(50),
  password: z.string().min(6).max(100),
  companyCode: z.string().min(2).max(20),
});

export const otpVerifySchema = z.object({
  userId: z.string().uuid(),
  otp: z.string().length(6).regex(/^\d{6}$/),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1),
});

export const createUserSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  username: z.string().min(3).max(50),
  password: z.string().min(8).max(100),
  companyId: z.string().uuid(),
  branchId: z.string().uuid().optional(),
  roleIds: z.array(z.string().uuid()).min(1),
  isActive: z.boolean().default(true),
});

export const updateUserSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  email: z.string().email().optional(),
  password: z.string().min(8).max(100).optional(),
  branchId: z.string().uuid().optional(),
  roleIds: z.array(z.string().uuid()).optional(),
  isActive: z.boolean().optional(),
});

export const createRoleSchema = z.object({
  name: z.string().min(2).max(50),
  description: z.string().max(200).optional(),
  companyId: z.string().uuid(),
  permissionIds: z.array(z.string().uuid()),
});

export const updateRoleSchema = z.object({
  name: z.string().min(2).max(50).optional(),
  description: z.string().max(200).optional(),
  permissionIds: z.array(z.string().uuid()).optional(),
});
