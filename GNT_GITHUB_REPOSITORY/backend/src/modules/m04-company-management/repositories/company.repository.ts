import { PrismaClient, Prisma } from "@prisma/client";

/**
 * 2026-09-04 — इस फ़ाइल में तीन असली गड़बड़ियाँ थीं, तीनों ठीक की गईं।
 * तीनों की जड़ एक ही थी: `data: any`. वो ग़लत field नाम को compile होने देता है
 * और गड़बड़ी तभी दिखती है जब कोई असली database पर चलाए — यही M02 में भी हुआ था
 * (वहाँ "user हटाना" कभी काम ही नहीं करता था)।
 */
export class CompanyRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(id: string) { return this.prisma.company_master.findUnique({ where: { id } }); }

  // पहले: `data: { ...data, updatedAt: new Date() }` — schema में field `updated_at` है,
  // `updatedAt` नहीं। चलाकर पकड़ा: PrismaClientValidationError — यानी "कंपनी की जानकारी
  // बदलना" कभी चला ही नहीं। test इसे नहीं पकड़ पाया क्योंकि वो mock पर चलता है।
  // `updated_at` schema में `@updatedAt` है, इसलिए Prisma उसे ख़ुद भरता है — हाथ से
  // भेजने की ज़रूरत ही नहीं।
  async update(id: string, data: Prisma.company_masterUncheckedUpdateInput) {
    return this.prisma.company_master.update({ where: { id }, data });
  }

  async findFinancialYears(companyId: string) {
    return this.prisma.financial_year.findMany({ where: { company_id: companyId }, orderBy: { start_date: "desc" } });
  }

  async createFY(data: { companyId: string; startDate: string | Date; endDate: string | Date; prefix: string; isActive?: boolean }) {
    return this.prisma.financial_year.create({
      data: {
        company_id: data.companyId,
        start_date: new Date(data.startDate),
        end_date: new Date(data.endDate),
        prefix: data.prefix,
        is_active: data.isActive ?? false,
      },
    });
  }

  async deactivateAllFY(companyId: string) {
    return this.prisma.financial_year.updateMany({ where: { company_id: companyId }, data: { is_active: false } });
  }

  // ⚠️ tenant: पहले यह सिर्फ़ `where: { id }` पर चलता था — यानी कोई भी **दूसरी company का**
  // financial year चालू कर सकता था, बस उसकी id जानकर। और चूँकि switchFinancialYear पहले
  // अपनी company के सारे FY बंद करता है, नतीजा यह होता कि अपनी company बिना किसी चालू FY
  // के रह जाती और दूसरी company का FY चालू हो जाता। अब company से बँधा है।
  // लौटाता है कि कुछ बदला या नहीं — service उसी से 404 तय करती है।
  async activateFY(id: string, companyId: string) {
    const res = await this.prisma.financial_year.updateMany({
      where: { id, company_id: companyId },
      data: { is_active: true },
    });
    return res.count > 0;
  }

  async findRoles(companyId: string) {
    return this.prisma.role_master.findMany({ where: { company_id: companyId }, include: { role_permission: { include: { permission_master: true } } } });
  }

  async findRoleById(id: string) { return this.prisma.role_master.findUnique({ where: { id } }); }

  // service पहले ही role.company_id जाँच लेती है, पर यहाँ भी company_id को WHERE में
  // रखा है (M02 के role.repository जैसा) — ताकि आगे कोई caller जाँच भूले तो भी
  // दूसरी company की भूमिका बदल न जाए।
  async updateRolePermissions(roleId: string, companyId: string, permissions: string[]) {
    const role = await this.prisma.role_master.findFirst({ where: { id: roleId, company_id: companyId } });
    if (!role) return null;
    return this.prisma.role_master.update({
      where: { id: roleId },
      data: {
        role_permission: {
          deleteMany: {},
          create: permissions.map((id: string) => ({ permission_id: id })),
        },
      },
    });
  }

  async findUsers(companyId: string) {
    return this.prisma.user_master.findMany({ where: { company_id: companyId }, include: { user_role: { include: { role_master: true } } } });
  }

  async findUserById(id: string) { return this.prisma.user_master.findUnique({ where: { id } }); }

  async findUserByUsername(companyId: string, username: string) {
    return this.prisma.user_master.findFirst({ where: { company_id: companyId, username } });
  }

  // पहले: `createUser(data: any)` और service `{ ...data, companyId }` भेजती थी — schema में
  // field `company_id` है। वही `updatedAt` वाली गड़बड़ी, दूसरी जगह। अब नाम साफ़ मैप होते हैं।
  async createUser(data: {
    companyId: string;
    name: string;
    email: string;
    username: string;
    passwordHash: string;
    branchId?: string | null;
  }) {
    return this.prisma.user_master.create({
      data: {
        company_id: data.companyId,
        branch_id: data.branchId ?? null,
        name: data.name,
        email: data.email,
        username: data.username,
        password_hash: data.passwordHash,
      },
    });
  }

  // caller (service) पहले़ verifyRolesBelongToCompany से जाँच चुका है — यहाँ सिर्फ़ लिखना है।
  async findRoleIdsInCompany(companyId: string, roleIds: string[]) {
    const rows = await this.prisma.role_master.findMany({
      where: { id: { in: roleIds }, company_id: companyId },
      select: { id: true },
    });
    return rows.map((r) => r.id);
  }

  async assignRoles(userId: string, roleIds: string[]) {
    return this.prisma.user_role.createMany({
      data: roleIds.map((roleId) => ({ user_id: userId, role_id: roleId })),
    });
  }

  async toggleUserStatus(id: string, companyId: string, isActive: boolean) {
    const { count } = await this.prisma.user_master.updateMany({
      where: { id, company_id: companyId },
      data: { is_active: isActive },
    });
    return count > 0;
  }
}
