// M11 Payment Module - Bank Account Repository

import { PrismaClient, Prisma, BankAccount } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { CreateBankAccountDto, UpdateBankAccountDto } from '../types';
import { toDecimal } from '../utils/decimal.helper';

export class BankAccountRepository {
  constructor(private prisma: PrismaClient) {}

  async findById(id: string, tenantId: string): Promise<BankAccount | null> {
    return this.prisma.bankAccount.findFirst({
      where: { id, tenantId },
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
        accountCode: dto.accountNumber,
        accountName: dto.accountName,
        accountNumber: dto.accountNumber,
        ifscCode: dto.ifscCode || null,
        bankName: dto.bankName,
        branch: dto.branchName || null,
        accountType: dto.accountType || 'CURRENT',
        openingBalance: dto.openingBalance ? toDecimal(dto.openingBalance) : new Decimal(0),
        currentBalance: dto.openingBalance ? toDecimal(dto.openingBalance) : new Decimal(0),
        isActive: dto.isActive ?? true,
        isDefault: dto.isDefault ?? false,
      },
    });
  }

  async update(id: string, dto: UpdateBankAccountDto, tenantId: string, userId: string): Promise<BankAccount> {
    return this.prisma.bankAccount.update({
      where: { id },
      data: {
        ...(dto.accountName && { accountName: dto.accountName }),
        ...(dto.ifscCode !== undefined && { ifscCode: dto.ifscCode }),
        ...(dto.bankName && { bankName: dto.bankName }),
        ...(dto.branchName !== undefined && { branch: dto.branchName }),
        ...(dto.accountType && { accountType: dto.accountType }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
        ...(dto.isDefault !== undefined && { isDefault: dto.isDefault }),
      },
    });
  }

  async updateBalance(id: string, amount: Decimal, tenantId: string, userId: string, isCredit: boolean): Promise<BankAccount> {
    const account = await this.findById(id, tenantId);
    if (!account) throw new Error('Bank account not found');

    const current = account.currentBalance as Decimal;
    const newBalance = isCredit ? current.add(amount) : current.sub(amount);

    return this.prisma.bankAccount.update({
      where: { id },
      data: { currentBalance: newBalance },
    });
  }

  async delete(id: string, tenantId: string): Promise<BankAccount> {
    return this.prisma.bankAccount.delete({ where: { id } });
  }
}
