// ============================================================================
// M04 — tenant (company) की सीमा के tests
//
// क्यों बने: 2026-09-04 को `switchFinancialYear` में एक असली छेद मिला —
// वो पहले अपनी company के सारे financial year बंद करता था, फिर **बिना कोई
// company-जाँच किए** दी हुई id वाला FY चालू कर देता था। नतीजा दोहरा नुक़सान:
//   • दूसरी company का FY चालू हो जाता (उनके बही-खाते पर असर)
//   • अपनी company बिना किसी चालू FY के रह जाती
//
// tsc इसे कभी नहीं पकड़ता (दोनों बस string id हैं), और पुराने tests भी नहीं —
// वे सिर्फ़ "सही रास्ता" जाँचते थे, हमलावर वाला नहीं।
// ============================================================================

import { describe, it, expect, vi, beforeEach } from "vitest";
import { CompanyService } from "../../services/company.service";
import { AppError } from "../../../../common/errors/error-classes";

const MERI_COMPANY = "company-mine";
const DUSRI_COMPANY = "company-other";

function banaoService(meriFYs: Array<{ id: string }>) {
  const companyRepo = {
    findFinancialYears: vi.fn().mockResolvedValue(meriFYs),
    deactivateAllFY: vi.fn().mockResolvedValue({ count: meriFYs.length }),
    // असली repository अब company से बँधी updateMany चलाती है — दूसरी company की
    // id पर कुछ नहीं बदलेगा, इसलिए false
    activateFY: vi.fn(async (id: string, companyId: string) =>
      meriFYs.some((f) => f.id === id) && companyId === MERI_COMPANY),
    findRoleById: vi.fn(),
    updateRolePermissions: vi.fn(),
    findUserById: vi.fn(),
    toggleUserStatus: vi.fn(),
  };
  const service = new CompanyService(
    companyRepo as never,
    {} as never,
    {} as never,
    { publish: vi.fn() } as never,
    { log: vi.fn() } as never,
  );
  return { service, companyRepo };
}

describe("M04 — financial year पर company की सीमा", () => {
  beforeEach(() => vi.clearAllMocks());

  it("अपनी company का FY चालू हो जाता है", async () => {
    const { service, companyRepo } = banaoService([{ id: "fy-1" }, { id: "fy-2" }]);

    await service.switchFinancialYear("fy-2", MERI_COMPANY);

    expect(companyRepo.deactivateAllFY).toHaveBeenCalledWith(MERI_COMPANY);
    expect(companyRepo.activateFY).toHaveBeenCalledWith("fy-2", MERI_COMPANY);
  });

  it("🔒 दूसरी company का FY चालू न हो सके", async () => {
    const { service } = banaoService([{ id: "fy-1" }]);

    await expect(
      service.switchFinancialYear("fy-dusri-company-ka", MERI_COMPANY),
    ).rejects.toThrow(AppError);
  });

  it("🔒 और नाकाम होने पर अपनी company के FY बंद भी न हों", async () => {
    // यही सबसे ज़रूरी बात है: पुराना कोड पहले सब बंद कर देता था, फिर नाकाम होता।
    // इसलिए हमला नाकाम होने पर भी company बिना चालू FY के रह जाती।
    const { service, companyRepo } = banaoService([{ id: "fy-1" }]);

    await expect(
      service.switchFinancialYear("fy-dusri-company-ka", MERI_COMPANY),
    ).rejects.toThrow(AppError);

    expect(companyRepo.deactivateAllFY).not.toHaveBeenCalled();
  });
});
