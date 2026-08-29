// [LOCK-13] HR Validators
import { z } from 'zod';

export const CreateEmployeeDto = z.object({
  firstName: z.string().min(2).max(50),
  lastName: z.string().min(2).max(50),
  email: z.string().email(),
  phone: z.string().optional(),
  dateOfBirth: z.string().datetime().optional(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  postalCode: z.string().optional(),
  departmentId: z.string().uuid().optional(),
  designation: z.string().min(2),
  employmentType: z.enum(['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERNSHIP']).default('FULL_TIME'),
  joinDate: z.string().datetime(),
  salary: z.number().positive(),
  currency: z.string().default('USD')
});

export const UpdateEmployeeDto = CreateEmployeeDto.partial();

export const CreateLeaveDto = z.object({
  employeeId: z.string().uuid(),
  type: z.enum(['ANNUAL', 'SICK', 'CASUAL', 'UNPAID', 'MATERNITY', 'PATERNITY', 'EMERGENCY']),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  reason: z.string().min(5)
});

export const CheckInDto = z.object({
  employeeId: z.string().uuid(),
  location: z.string().optional(),
  notes: z.string().optional()
});

export const CreateDepartmentDto = z.object({
  name: z.string().min(2).max(100),
  code: z.string().min(2).max(20),
  description: z.string().optional(),
  managerId: z.string().uuid().optional(),
  budget: z.number().positive().optional()
});

export const GeneratePayrollDto = z.object({
  month: z.number().min(1).max(12),
  year: z.number().min(2000).max(2100),
  employeeIds: z.array(z.string().uuid()).optional()
});

export type CreateEmployeeDto = z.infer<typeof CreateEmployeeDto>;
export type UpdateEmployeeDto = z.infer<typeof UpdateEmployeeDto>;
