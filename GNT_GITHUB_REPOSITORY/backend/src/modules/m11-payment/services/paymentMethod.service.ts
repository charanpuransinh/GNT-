// M11 Payment Module - Payment Method Service

import { PrismaClient } from '@prisma/client';
import { PaymentMethodRepository } from '../repositories/paymentMethod.repository';
import { EventBus } from '../events/event.bus';
import { CreatePaymentMethodDto, UpdatePaymentMethodDto, ApiError } from '../types';

export class PaymentMethodService {
  private repo: PaymentMethodRepository;
  private eventBus: EventBus;

  constructor(private prisma: PrismaClient, eventBus: EventBus) {
    this.repo = new PaymentMethodRepository(prisma);
    this.eventBus = eventBus;
  }

  async getMethod(id: string, tenantId: string) {
    const method = await this.repo.findById(id, tenantId);
    if (!method) throw this.notFound('Payment method not found');
    return method;
  }

  async listMethods(tenantId: string, isActive?: boolean) {
    return this.repo.findAll(tenantId, isActive);
  }

  async createMethod(dto: CreatePaymentMethodDto, tenantId: string, userId: string) {
    const method = await this.repo.create(dto, tenantId, userId);

    this.eventBus.publish('payment_method.created', {
      methodId: method.id,
      tenantId,
      name: method.name,
      type: method.code,
      timestamp: new Date(),
    });

    return method;
  }

  async updateMethod(id: string, dto: UpdatePaymentMethodDto, tenantId: string, userId: string) {
    const method = await this.repo.findById(id, tenantId);
    if (!method) throw this.notFound('Payment method not found');
    return this.repo.update(id, dto, tenantId, userId);
  }

  async deleteMethod(id: string, tenantId: string) {
    const method = await this.repo.findById(id, tenantId);
    if (!method) throw this.notFound('Payment method not found');

    // Check if method has transactions
    const txCount = await this.prisma.paymentTransaction.count({
      where: { paymentMethodId: id, tenantId },
    });
    if (txCount > 0) throw this.badRequest('Cannot delete method with transactions');

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
