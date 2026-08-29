// M11 Payment Module - Bank Account Service

import { PrismaClient } from '@prisma/client';
import { BankAccountRepository } from '../repositories/bankAccount.repository';
import { EventBus } from '../events/event.bus';
import { CreateBankAccountDto, UpdateBankAccountDto, ApiError } from '../types';

export class BankAccountService {
  private repo: BankAccountRepository;
  private eventBus: EventBus;

  constructor(private prisma: PrismaClient, eventBus: EventBus) {
    this.repo = new BankAccountRepository(prisma);
    this.eventBus = eventBus;
  }

  async getAccount(id: string, tenantId: string) {
    const account = await this.repo.findById(id, tenantId);
    if (!account) throw this.notFound('Bank account not found');
    return account;
  }

  async listAccounts(tenantId: string, isActive?: boolean) {
    return this.repo.findAll(tenantId, isActive);
  }

  async createAccount(dto: CreateBankAccountDto, tenantId: string, userId: string) {
    // Check for duplicate account number
    const existing = await this.prisma.bankAccount.findFirst({
      where: { tenantId, accountNumber: dto.accountNumber },
    });
    if (existing) throw this.badRequest('Account number already exists');

    const account = await this.repo.create(dto, tenantId, userId);

    this.eventBus.publish('bank_account.created', {
      accountId: account.id,
      tenantId,
      accountNumber: account.accountNumber,
      bankName: account.bankName,
      timestamp: new Date(),
    });

    return account;
  }

  async updateAccount(id: string, dto: UpdateBankAccountDto, tenantId: string, userId: string) {
    const account = await this.repo.findById(id, tenantId);
    if (!account) throw this.notFound('Bank account not found');
    return this.repo.update(id, dto, tenantId, userId);
  }

  async deleteAccount(id: string, tenantId: string) {
    const account = await this.repo.findById(id, tenantId);
    if (!account) throw this.notFound('Bank account not found');

    // Check if account has transactions
    const txCount = await this.prisma.paymentTransaction.count({
      where: { bankAccountId: id, tenantId },
    });
    if (txCount > 0) throw this.badRequest('Cannot delete account with transactions');

    return this.repo.delete(id, tenantId);
  }

  // ==================== ERROR HELPERS ====================
  private notFound(message: string): ApiError {
    return { code: 'NOT_FOUND', message };
  }

  private badRequest(message: string): ApiError {
    return { code: 'BAD_REQUEST', message };
  }
}
