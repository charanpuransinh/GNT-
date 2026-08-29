// M11 Payment Module - Bank Account Repository

import { PrismaClient, Prisma, BankAccount, BankAccountType } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { CreateBankAccountDto, UpdateBankAccountDto } from '../types';
import { toDecimal } from '../utils/decimal.helper';

export class BankAccountRepository {
  constructor(private prisma: PrismaClient) {}

  async findById(id: string, tenantId: string): Promise<BankAccount | null> {
    return this.prisma.bankAccount.findFirst({
      where: { id, tenantId },
      include: { transactions: { take: 5, orderBy: { createdAt: 'desc' } } },
    });
  }

  async findAll(tenantId: string, isActive?: boolean) {
    const where: Prisma.BankAccountWhereInput = { tenantId };
    if (isActive !== undefined) where.isActive = isActive;

    return this.prisma.bankAccount.findMany({
      where,
      orderBy: { isDefault: 'desc' },
    });
  }

  async create(dto: CreateBankAccountDto, tenantId: string, userId: string): Promise<BankAccount> {
    return this.prisma.bankAccount.create({
      data: {
        tenantId,
        accountName: dto.accountName,
        accountNumber: dto.accountNumber,
        ifscCode: dto.ifscCode || null,
        bankName: dto.bankName,
        branchName: dto.branchName || null,
        accountType: dto.accountType || 'CURRENT',
        openingBalance: dto.openingBalance ? toDecimal(dto.openingBalance) : new Decimal(0),
        currentBalance: dto.openingBalance ? toDecimal(dto.openingBalance) : new Decimal(0),
        isActive: dto.isActive ?? true,
        isDefault: dto.isDefault ?? false,
        description: dto.description || null,
        createdBy: userId,
        updatedBy: userId,
      },
    });
  }

  async update(id: string, dto: UpdateBankAccountDto, tenantId: string, userId: string): Promise<BankAccount> {
    return this.prisma.bankAccount.update({
      where: { id },
      data: { ...dto, updatedBy: userId },
    });
  }

  async updateBalance(id: string, amount: Decimal, tenantId: string, userId: string, isCredit: boolean): Promise<BankAccount> {
    const account = await this.findById(id, tenantId);
    if (!account) throw new Error('Bank account not found');

    const current = account.currentBalance as Decimal;
    const newBalance = isCredit ? current.add(amount) : current.sub(amount);

    return this.prisma.bankAccount.update({
      where: { id },
      data: { currentBalance: newBalance, updatedBy: userId },
    });
  }

  async delete(id: string, tenantId: string): Promise<BankAccount> {
    return this.prisma.bankAccount.delete({ where: { id } });
  }
}
