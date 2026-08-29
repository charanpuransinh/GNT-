import { GSTService } from '../../services/gst.service';
import { GSTRepository } from '../../repositories/gst.repository';

describe('GSTService', () => {
  const mockRepo = {
    getTaxSlabsAsMap: jest.fn(),
    getCompanyTurnoverCr: jest.fn(),
    compileGSTR1: jest.fn(),
    compileGSTR3B: jest.fn(),
    reconcileAgainstGSTR2B: jest.fn(),
  } as unknown as GSTRepository;

  const service = new GSTService(mockRepo);
  beforeEach(() => jest.clearAllMocks());

  it('Intra-state CGST+SGST calculation', async () => {
    mockRepo.getTaxSlabsAsMap.mockResolvedValue({ '1001': { cgst_rate: 9, sgst_rate: 9, igst_rate: 18, cess_rate: 0 } });
    const result = await service.calculateTax([{ hsn_code: '1001', taxable_amount: 1000 }], '27', '27', 'comp-1');
    expect(result.cgst_amount).toBe(90);
    expect(result.sgst_amount).toBe(90);
    expect(result.igst_amount).toBe(0);
  });

  it('Inter-state IGST calculation', async () => {
    mockRepo.getTaxSlabsAsMap.mockResolvedValue({ '1001': { cgst_rate: 9, sgst_rate: 9, igst_rate: 18, cess_rate: 0 } });
    const result = await service.calculateTax([{ hsn_code: '1001', taxable_amount: 1000 }], '08', '27', 'comp-1');
    expect(result.igst_amount).toBe(180);
    expect(result.cgst_amount).toBe(0);
    expect(result.sgst_amount).toBe(0);
  });

  it('CESS calculation on special HSN', async () => {
    mockRepo.getTaxSlabsAsMap.mockResolvedValue({ '2401': { cgst_rate: 14, sgst_rate: 14, igst_rate: 28, cess_rate: 5 } });
    const result = await service.calculateTax([{ hsn_code: '2401', taxable_amount: 1000 }], '27', '27', 'comp-1');
    expect(result.cess_amount).toBe(50);
  });

  it('validateGSTIN returns true for valid GSTIN', () => {
    expect(service.validateGSTIN('27AABCU9603R1ZX')).toBe(true);
  });

  it('validateGSTIN returns false for invalid GSTIN', () => {
    expect(service.validateGSTIN('INVALIDGSTIN')).toBe(false);
  });
});
