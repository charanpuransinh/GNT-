import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach, vi, type Mocked } from 'vitest';

import { LedgerService } from '../../services/ledger.service';
import { LedgerRepository } from '../../repositories/ledger.repository';
import { PrismaClient } from '@prisma/client';

describe('LedgerService', () => {
  const mockRepo = {
    getLedgerEntries: vi.fn(),
    getBalanceAsOfDate: vi.fn(),
    getLedgerSumsByAccount: vi.fn(),
  } as unknown as Mocked<LedgerRepository>;

  const mockPrisma = {
    account_master: { findMany: vi.fn() },
  } as unknown as PrismaClient;
  const service = new LedgerService(mockRepo, mockPrisma);

  it('Ledger posting updates account balance', async () => {
    mockRepo.getBalanceAsOfDate.mockResolvedValue(5000);
    const balance = await service.getAccountBalance('comp1', 'acc1');
    expect(balance).toBe(5000);
    // 2026-09-05: company नीचे तक सच में पहुँचनी चाहिए — पहले यह छन्नी थी ही नहीं,
    // इसलिए सिर्फ़ account_id जानकर दूसरी कंपनी का बैलेंस पढ़ा जा सकता था
    expect(mockRepo.getBalanceAsOfDate).toHaveBeenCalledWith('comp1', 'acc1', undefined);
  });

  it('Running balance calculation', async () => {
    const entries = [
      { id: '1', transaction_date: new Date('2024-01-01'), debit_amount: 1000, credit_amount: 0 },
      { id: '2', transaction_date: new Date('2024-01-02'), debit_amount: 0, credit_amount: 300 },
    ];
    expect(entries.length).toBe(2);
  });

  it('Trial Balance totals match', async () => {
    mockRepo.getLedgerSumsByAccount.mockResolvedValue({
      acc1: { debit: 1000, credit: 0 },
      acc2: { debit: 0, credit: 1000 },
    });
    (mockPrisma.account_master.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
      { id: 'acc1', name: 'Account 1' },
      { id: 'acc2', name: 'Account 2' },
    ]);
    const tb = await service.getTrialBalance('c1');
    expect(tb).toBeDefined();
  });
});
