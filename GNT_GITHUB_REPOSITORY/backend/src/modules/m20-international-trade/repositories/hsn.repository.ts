// GNT M20 — HSN Repository (OWNER ONLY for hsn_master)
// Owner: D4-DELTA

import { PrismaClient, hsn_master } from '@prisma/client';

export class HSNRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async search(query: string, limit: number = 20): Promise<hsn_master[]> {
    return this.prisma.hsn_master.findMany({
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

  async findByCode(code: string): Promise<hsn_master | null> {
    return this.prisma.hsn_master.findUnique({ where: { code } });
  }

  async findByCodes(codes: string[]): Promise<hsn_master[]> {
    return this.prisma.hsn_master.findMany({
      where: { code: { in: codes }, is_active: true },
    });
  }

  async create(data: Omit<hsn_master, 'id' | 'created_at' | 'updated_at'>): Promise<hsn_master> {
    return this.prisma.hsn_master.create({ data });
  }

  async update(code: string, data: Partial<hsn_master>): Promise<hsn_master> {
    return this.prisma.hsn_master.update({ where: { code }, data });
  }

  async getChapters(): Promise<string[]> {
    const results = await this.prisma.hsn_master.findMany({
      where: { is_active: true },
      select: { chapter: true },
      distinct: ['chapter'],
      orderBy: { chapter: 'asc' },
    });
    return results.map((r) => r.chapter);
  }

  async getHeadingsByChapter(chapter: string): Promise<string[]> {
    const results = await this.prisma.hsn_master.findMany({
      where: { chapter, is_active: true },
      select: { heading: true },
      distinct: ['heading'],
      orderBy: { heading: 'asc' },
    });
    return results.map((r) => r.heading);
  }
}
