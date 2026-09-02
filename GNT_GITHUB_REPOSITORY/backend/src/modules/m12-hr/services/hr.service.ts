/**
 * M12 — Reporting Facade (ROUGH SCAFFOLDING — समीक्षक AI, 2026-09-02)
 * सिर्फ़-पढ़ने वाला दरवाज़ा M17 के लिए। मालिक M12 ही है।
 */

export interface AttendanceRow {
  employee_id: string;
  employee_name: string;
  present_days: number;
  absent_days: number;
  leave_days: number;
}

export interface SalaryRegisterRow {
  employee_id: string;
  employee_name: string;
  gross: number;
  deductions: number;
  net: number;
}

export class HRService {
  /** TODO(#016): m12 के employee model से जोड़ना — model अभी canonical schema में गायब है (#008)। */
  async getEmployeeCount(_company_id: string): Promise<number> {
    return 0;
  }

  /** TODO(#016): attendance model schema में आने के बाद असली आँकड़े। अभी खाली — झूठा डेटा नहीं। */
  async getAttendanceReport(_company_id: string, _from: Date, _to: Date): Promise<AttendanceRow[]> {
    return [];
  }

  /** TODO(#016): payroll model schema में आने के बाद। */
  async getSalaryRegister(_company_id: string, _month: number, _year: number): Promise<SalaryRegisterRow[]> {
    return [];
  }
}

export const hrService = new HRService();
