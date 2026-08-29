import { z } from "zod";
export const companyProfileSchema = z.object({
  name: z.string().min(1).max(200),
  gstin: z.string().regex(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, "Invalid GSTIN").optional().or(z.literal("")),
  address: z.string().max(500).optional(),
  phone: z.string().max(20).optional(),
  email: z.string().email().optional().or(z.literal("")),
});
export const branchSchema = z.object({ name: z.string().min(1).max(100), code: z.string().min(1).max(20), address: z.string().optional() });
export const financialYearSchema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), prefix: z.string().max(10),
});
export const userSchema = z.object({ name: z.string().min(1).max(100), email: z.string().email(), roleId: z.string().uuid() });
