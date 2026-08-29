import { prisma } from './prisma';
export { prisma };

function required(name: string): string {
  const value = process.env[name];
  if (!value && process.env.NODE_ENV === 'production') throw new Error(`Missing required production environment variable: ${name}`);
  return value || '';
}
export const env = { DATABASE_URL: required('DATABASE_URL') };
