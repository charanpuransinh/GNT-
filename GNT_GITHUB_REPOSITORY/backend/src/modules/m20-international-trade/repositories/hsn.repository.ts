// GNT M20 — HSN Repository (OWNER ONLY for customs_tariff)
// Owner: D4-DELTA

import { PrismaClient, customs_tariff } from '@prisma/client';

export class HSNRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async search(query: string, limit: number = 20): Promise<customs_tariff[]> {
    return this.prisma.customs_tariff.findMany({
      where: {
        is_active: true,
        OR: [
          { code: { contains: query } },
          { description: { contains: query, mode: 'insensitive' } },
          { chapter: { contains: query } },
          { heading: { contains: query } },
          { subheading: { contains: query } },
        ],
      },
      take: limit,
      orderBy: { code: 'asc' },
    });
  }

  async findByCode(code: string): Promise<customs_tariff | null> {
    return this.prisma.customs_tariff.findUnique({ where: { code } });
  }

  async findByCodes(codes: string[]): Promise<customs_tariff[]> {
    return this.prisma.customs_tariff.findMany({
      where: { code: { in: codes }, is_active: true },
    });
  }

  async create(data: Omit<customs_tariff, 'id' | 'created_at' | 'updated_at'>): Promise<customs_tariff> {
    return this.prisma.customs_tariff.create({ data });
  }

  async update(code: string, data: Partial<customs_tariff>): Promise<customs_tariff> {
    return this.prisma.customs_tariff.update({ where: { code }, data });
  }

  async getChapters(): Promise<string[]> {
    const results = await this.prisma.customs_tariff.findMany({
      where: { is_active: true },
      select: { chapter: true },
      distinct: ['chapter'],
      orderBy: { chapter: 'asc' },
    });
    return results.map((r) => r.chapter);
  }

  async getHeadingsByChapter(chapter: string): Promise<string[]> {
    const results = await this.prisma.customs_tariff.findMany({
      where: { chapter, is_active: true },
      select: { heading: true },
      distinct: ['heading'],
      orderBy: { heading: 'asc' },
    });
    return results.map((r) => r.heading);
  }
}
