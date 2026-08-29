// M11 Payment Module - Payment Method Repository

import { PrismaClient, Prisma, PaymentMethod } from '@prisma/client';
import { CreatePaymentMethodDto, UpdatePaymentMethodDto } from '../types';

export class PaymentMethodRepository {
  constructor(private prisma: PrismaClient) {}

  async findById(id: string, tenantId: string): Promise<PaymentMethod | null> {
    return this.prisma.paymentMethod.findFirst({ where: { id, tenantId } });
  }

  async findAll(tenantId: string, isActive?: boolean) {
    const where: Prisma.PaymentMethodWhereInput = { tenantId };
    if (isActive !== undefined) where.isActive = isActive;

    return this.prisma.paymentMethod.findMany({
      where,
      orderBy: [{ isDefault: 'desc' }, { sortOrder: 'asc' }],
    });
  }

  async create(dto: CreatePaymentMethodDto, tenantId: string, userId: string): Promise<PaymentMethod> {
    return this.prisma.paymentMethod.create({
      data: {
        tenantId,
        name: dto.name,
        type: dto.type,
        configJson: dto.configJson || null,
        isActive: dto.isActive ?? true,
        isDefault: dto.isDefault ?? false,
        sortOrder: dto.sortOrder || 0,
        bankAccountId: dto.bankAccountId || null,
        createdBy: userId,
        updatedBy: userId,
      },
    });
  }

  async update(id: string, dto: UpdatePaymentMethodDto, tenantId: string, userId: string): Promise<PaymentMethod> {
    return this.prisma.paymentMethod.update({
      where: { id },
      data: { ...dto, updatedBy: userId },
    });
  }

  async delete(id: string, tenantId: string): Promise<PaymentMethod> {
    return this.prisma.paymentMethod.delete({ where: { id } });
  }
}
