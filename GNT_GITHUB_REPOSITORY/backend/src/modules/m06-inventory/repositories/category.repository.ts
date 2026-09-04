// GNT M06 — Category Repository (INTERNAL ONLY)
import { PrismaClient, category_master } from '@prisma/client';
import { CategoryDTO } from '../types/inventory.types';

const prisma = new PrismaClient();

export class CategoryRepository {
  async create(data: CategoryDTO): Promise<category_master> {
    // पहले यह `data as any` था। `as any` हटाते ही tsc ने पकड़ा कि CategoryDTO
    // सीधे Prisma के create input में नहीं बैठता — parent_id एक scalar FK है,
    // इसलिए Unchecked रूप चाहिए। अब हर field नाम लेकर लिखा है, यानी आगे कोई
    // नाम ग़लत हुआ तो tsc वहीं रोकेगा, चलते वक़्त नहीं टूटेगा।
    return prisma.category_master.create({
      data: {
        company_id: data.company_id,
        name: data.name,
        parent_id: data.parent_id ?? null,
        code: data.code ?? null,
        description: data.description ?? null,
        ...(data.is_active !== undefined ? { is_active: data.is_active } : {}),
      },
    });
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

  // company_id यहाँ भी सिर्फ़ नाम का था — where में न होने से दूसरी company की
  // category बदली/मिटाई जा सकती थी।
  async update(id: string, data: Partial<CategoryDTO>, company_id: string): Promise<category_master> {
    const { count } = await prisma.category_master.updateMany({
      where: { id, company_id },
      data: data,
    });
    if (count === 0) throw new Error('Category not found for this company');
    return this.findById(id, company_id) as Promise<category_master>;
  }

  async delete(id: string, company_id: string): Promise<category_master> {
    // मिटाने से पहले पढ़ लो — वरना लौटाने को कुछ बचता नहीं
    const existing = await this.findById(id, company_id);
    if (!existing) throw new Error('Category not found for this company');
    await prisma.category_master.deleteMany({ where: { id, company_id } });
    return existing;
  }

  async hasChildren(id: string, company_id: string): Promise<boolean> {
    const count = await prisma.category_master.count({
      where: { parent_id: id, company_id },
    });
    return count > 0;
  }
}
