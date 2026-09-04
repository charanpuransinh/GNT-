// M11 Payment Module - Payment Method Repository
// (tenant-scope: हर write पर tenantId की बंदिश)

import { PrismaClient, Prisma, PaymentMethod } from '@prisma/client';
import { CreatePaymentMethodDto, UpdatePaymentMethodDto } from '../types';

type Db = PrismaClient | Prisma.TransactionClient;

export class PaymentMethodRepository {
  constructor(private prisma: Db) {}

  async findById(id: string, tenantId: string): Promise<PaymentMethod | null> {
    return this.prisma.paymentMethod.findFirst({ where: { id, tenantId } });
  }

  async findAll(tenantId: string, isActive?: boolean) {
    const where: Prisma.PaymentMethodWhereInput = { tenantId };
    if (isActive !== undefined) where.isActive = isActive;

    return this.prisma.paymentMethod.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(dto: CreatePaymentMethodDto, tenantId: string, userId: string): Promise<PaymentMethod> {
    return this.prisma.paymentMethod.create({
      data: {
        tenantId,
        name: dto.name,
        code: dto.type,
        configJson: (dto.configJson ?? undefined) as Prisma.InputJsonValue | undefined,
        isActive: dto.isActive ?? true,
        createdBy: userId,
        updatedBy: userId,
      },
    });
  }

  async update(id: string, dto: UpdatePaymentMethodDto, tenantId: string, userId: string): Promise<PaymentMethod> {
    const result = await this.prisma.paymentMethod.updateMany({
      where: { id, tenantId },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.configJson !== undefined && { configJson: dto.configJson as Prisma.InputJsonValue }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
        updatedBy: userId,
      },
    });
    if (result.count === 0) throw new Error('Payment method not found');
    const method = await this.prisma.paymentMethod.findFirst({ where: { id, tenantId } });
    if (!method) throw new Error('Payment method not found');
    return method;
  }

  async delete(id: string, tenantId: string): Promise<PaymentMethod> {
    const existing = await this.findById(id, tenantId);
    if (!existing) throw new Error('Payment method not found');
    await this.prisma.paymentMethod.deleteMany({ where: { id, tenantId } });
    return existing;
  }
}
