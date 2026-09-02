import { hrService } from '@/modules/m12-hr';
import { IHRService } from '../report.internal';
import { HRReportFilters } from '../../types/report.types';

/**
 * M17 → M12 adapter (टास्क #012)
 * M12 की facade (सिर्फ़-पढ़ने वाला दरवाज़ा) — अभी खाली है (समीक्षक AI का rough, TODO(#016)),
 * इसलिए adapter भी खाली रहता है। झूठा डेटा नहीं।
 */
export class HRAdapter implements IHRService {
  async getAttendanceReport(_filters: HRReportFilters): Promise<Array<{ employeeId: string; employeeName: string; department: string; month: string; presentDays: number; absentDays: number; leaveDays: number; halfDays: number; overtimeHours: number }>> {
    return [];
  }

  async getSalaryRegister(_filters: HRReportFilters): Promise<Array<{ employeeId: string; employeeName: string; basicSalary: number; hra: number; da: number; otherAllowances: number; grossSalary: number; pfDeduction: number; esiDeduction: number; tds: number; otherDeductions: number; netSalary: number }>> {
    return [];
  }

  async getEmployeeCount(): Promise<number> {
    return hrService.getEmployeeCount(''); // TODO(#016): companyId से असली गिनती
  }
}
