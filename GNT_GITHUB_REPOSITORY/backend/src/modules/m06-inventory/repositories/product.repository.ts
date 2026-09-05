// GNT M06 — Product Repository (INTERNAL ONLY)
import { product_master, Prisma } from '@prisma/client';
import { prisma } from '@/common/config/prisma';
import { ProductDTO, ProductFilter, PaginatedResult } from '../types/inventory.types';

export class ProductRepository {
  async create(data: ProductDTO): Promise<product_master> {
    return prisma.product_master.create({ data: data });
  }

  async findById(id: string, company_id: string): Promise<product_master | null> {
    return prisma.product_master.findFirst({
      where: { id, company_id },
      include: { category: true },
    });
  }

  async findByCode(code: string, company_id: string): Promise<product_master | null> {
    return prisma.product_master.findFirst({
      where: { code, company_id },
    });
  }

  async findByBarcode(barcode: string, company_id: string): Promise<product_master | null> {
    return prisma.product_master.findFirst({
      where: { barcode, company_id },
    });
  }

  async findAll(filter: ProductFilter, company_id: string): Promise<PaginatedResult<product_master>> {
    const page = filter.page || 1;
    const limit = filter.limit || 20;
    const skip = (page - 1) * limit;

    const where: Prisma.product_masterWhereInput = {
      company_id,
      status: filter.status || 'active',
    };

    if (filter.search) {
      where.OR = [
        { name: { contains: filter.search, mode: 'insensitive' } },
        { code: { contains: filter.search, mode: 'insensitive' } },
        { barcode: { contains: filter.search, mode: 'insensitive' } },
      ];
    }

    if (filter.category_id) {
      where.category_id = filter.category_id;
    }

    if (filter.branch_id) {
      where.branch_id = filter.branch_id;
    }

    const [data, total] = await Promise.all([
      prisma.product_master.findMany({
        where,
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
        include: { category: true, stock: true },
      }),
      prisma.product_master.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findLowStock(company_id: string, branch_id?: string) {
    const products = await prisma.product_master.findMany({
      where: {
        company_id,
        status: 'active',
        branch_id: branch_id || undefined,
        reorder_level: { not: null },
      },
      include: { stock: true },
    });

    return products.filter((p) => {
      const totalStock = p.stock.reduce((sum, s) => sum + Number(s.quantity), 0);
      return totalStock <= Number(p.reorder_level);
    });
  }

  async update(id: string, data: Partial<ProductDTO>, company_id: string): Promise<product_master> {
    return prisma.product_master.updateMany({
      where: { id, company_id },
      data: data,
    }).then(() => this.findById(id, company_id) as Promise<product_master>);
  }

  async softDelete(id: string, company_id: string): Promise<product_master> {
    // update({ where: { id } }) दूसरी company का product भी बंद कर देता था
    const { count } = await prisma.product_master.updateMany({
      where: { id, company_id },
      data: { status: 'inactive', is_active: false },
    });
    if (count === 0) throw new Error('Product not found for this company');
    return this.findById(id, company_id) as Promise<product_master>;
  }

  async existsWithCode(code: string, company_id: string, excludeId?: string): Promise<boolean> {
    const count = await prisma.product_master.count({
      where: { code, company_id, id: excludeId ? { not: excludeId } : undefined },
    });
    return count > 0;
  }

  async existsWithBarcode(barcode: string, company_id: string, excludeId?: string): Promise<boolean> {
    const count = await prisma.product_master.count({
      where: { barcode, company_id, id: excludeId ? { not: excludeId } : undefined },
    });
    return count > 0;
  }

  async countByCategory(category_id: string, company_id: string): Promise<number> {
    return prisma.product_master.count({
      where: { category_id, company_id, status: 'active' },
    });
  }
}
