// GNT M06 — Stock Repository (INTERNAL ONLY)
import { PrismaClient, stock_master, stock_movement, Prisma } from '@prisma/client';
import { StockDTO, StockMovementDTO, StockFilter, MovementFilter, PaginatedResult } from '../types/inventory.types';

const prisma = new PrismaClient();

export class StockRepository {
  async findById(id: string, company_id: string): Promise<stock_master | null> {
    return prisma.stock_master.findFirst({
      where: { id, company_id },
      include: { product: true, batch: true },
    });
  }

  async findByProduct(product_id: string, company_id: string, branch_id?: string | null): Promise<stock_master[]> {
    return prisma.stock_master.findMany({
      where: {
        product_id,
        company_id,
        branch_id: branch_id || undefined,
      },
      include: { batch: true },
    });
  }

  async findOrCreate(data: StockDTO): Promise<stock_master> {
    const existing = await prisma.stock_master.findFirst({
      where: {
        company_id: data.company_id,
        product_id: data.product_id,
        branch_id: data.branch_id || null,
        batch_id: data.batch_id || null,
      },
    });

    if (existing) return existing;

    return prisma.stock_master.create({ data: data as any });
  }

  async updateQuantity(id: string, quantity: number, company_id: string): Promise<stock_master> {
    return prisma.stock_master.update({
      where: { id },
      data: { quantity },
    });
  }

  async updateAvgPrice(id: string, avg_price: number, last_price: number, company_id: string): Promise<stock_master> {
    return prisma.stock_master.update({
      where: { id },
      data: { avg_purchase_price: avg_price, last_purchase_price: last_price },
    });
  }

  async findAll(filter: StockFilter, company_id: string): Promise<stock_master[]> {
    return prisma.stock_master.findMany({
      where: {
        company_id,
        branch_id: filter.branch_id || undefined,
        product_id: filter.product_id || undefined,
        batch_id: filter.batch_id || undefined,
      },
      include: { product: true, batch: true },
    });
  }

  async createMovement(data: StockMovementDTO): Promise<stock_movement> {
    return prisma.stock_movement.create({ data: data as any });
  }

  async findMovements(filter: MovementFilter, company_id: string): Promise<PaginatedResult<stock_movement>> {
    const page = filter.page || 1;
    const limit = filter.limit || 20;
    const skip = (page - 1) * limit;

    const where: Prisma.stock_movementWhereInput = { company_id };

    if (filter.product_id) where.product_id = filter.product_id;
    if (filter.branch_id) where.branch_id = filter.branch_id;
    if (filter.reference_type) where.reference_type = filter.reference_type;
    if (filter.from_date || filter.to_date) {
      where.created_at = {};
      if (filter.from_date) (where.created_at as any).gte = filter.from_date;
      if (filter.to_date) (where.created_at as any).lte = filter.to_date;
    }

    const [data, total] = await Promise.all([
      prisma.stock_movement.findMany({
        where,
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
        include: { product: true },
      }),
      prisma.stock_movement.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getTotalQuantity(product_id: string, company_id: string, branch_id?: string | null): Promise<number> {
    const result = await prisma.stock_master.aggregate({
      where: {
        product_id,
        company_id,
        branch_id: branch_id || undefined,
      },
      _sum: { quantity: true },
    });
    return Number(result._sum.quantity || 0);
  }
}
