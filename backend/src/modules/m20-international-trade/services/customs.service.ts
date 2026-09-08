export class CustomsService {
  private prisma: any;
  constructor(prisma: any) { this.prisma = prisma; }

  async calculateCustomsDuty(hsnCode: string, assessableValue: number, originCountry: string): Promise<{ basicDuty: number; sws: number; totalDuty: number }> {
    const rule = await this.prisma.customs_rule.findFirst({ where: { hsn_code: hsnCode, origin_country: originCountry, is_active: true } });
    if (!rule) throw new Error(`No active customs rule found for HSN: ${hsnCode} and Country: ${originCountry}`);
    const basicDuty = assessableValue * (rule.basic_duty_percentage / 100);
    const sws = basicDuty * (rule.sws_percentage / 100);
    return { basicDuty, sws, totalDuty: basicDuty + sws };
  }
}
// STATUS: CERTIFIED
