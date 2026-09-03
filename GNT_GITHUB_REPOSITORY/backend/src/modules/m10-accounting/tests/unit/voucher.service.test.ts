import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach, vi, type Mocked } from 'vitest';

import { VoucherService } from '../../services/voucher.service';
import { PrismaClient } from '@prisma/client';

describe('VoucherService', () => {
  const mockPrisma = {
    voucher: {
      create: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  };

  const service = new VoucherService(mockPrisma as unknown as PrismaClient);

  it('Voucher debit = credit validation', async () => {
    await expect(
      service.createVoucher({
        items: [
          { account_id: 'a1', debit_amount: 100, credit_amount: 0 },
          { account_id: 'a2', debit_amount: 0, credit_amount: 50 },
        ],
      })
    ).rejects.toThrow('Debit and credit totals must be equal');
  });

  it('Balanced voucher creates successfully', async () => {
    mockPrisma.voucher.create.mockResolvedValue({ id: 'v1' });
    const result = await service.createVoucher({
      company_id: 'c1',
      voucher_type: 'journal',
      voucher_number: 'JV001',
      voucher_date: new Date(),
      items: [
        { account_id: 'a1', debit_amount: 100, credit_amount: 0 },
        { account_id: 'a2', debit_amount: 0, credit_amount: 100 },
      ],
    });
    expect(result.id).toBe('v1');
  });
});
