// GNT M06 — Category Repository (INTERNAL ONLY)
import { PrismaClient, category_master } from '@prisma/client';
import { CategoryDTO } from '../types/inventory.types';

const prisma = new PrismaClient();

export class CategoryRepository {
  async create(data: CategoryDTO): Promise<category_master> {
    return prisma.category_master.create({ data: data as any });
  }

  async findById(id: string, company_id: string): Promise<category_master | null> {
    return prisma.category_master.findFirst({
      where: { id, company_id },
      include: { parent: true, children: true },
    });
  }

  async findAll(company_id: string): Promise<category_master[]> {
    return prisma.category_master.findMany({
      where: { company_id, is_active: true },
      orderBy: { name: 'asc' },
      include: { children: true },
    });
  }

  async findTree(company_id: string): Promise<category_master[]> {
    return prisma.category_master.findMany({
      where: { company_id, is_active: true, parent_id: null },
      include: {
        children: {
          include: {
            children: {
              include: {
                children: true,
              },
            },
          },
        },
      },
    });
  }

  async update(id: string, data: Partial<CategoryDTO>, company_id: string): Promise<category_master> {
    return prisma.category_master.update({
      where: { id },
      data: data as any,
    });
  }

  async delete(id: string, company_id: string): Promise<category_master> {
    return prisma.category_master.delete({
      where: { id },
    });
  }

  async hasChildren(id: string, company_id: string): Promise<boolean> {
    const count = await prisma.category_master.count({
      where: { parent_id: id, company_id },
    });
    return count > 0;
  }
}
