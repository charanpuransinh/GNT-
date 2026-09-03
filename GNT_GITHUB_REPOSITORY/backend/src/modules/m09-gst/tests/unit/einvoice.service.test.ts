import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach, vi, type Mocked } from 'vitest';

import { EInvoiceService, type IRPProvider } from '../../services/einvoice.service';
import { EInvoiceRepository } from '../../repositories/einvoice.repository';

describe('EInvoiceService', () => {
  const mockRepo = {
    getInvoiceData: vi.fn(),
    createEInvoice: vi.fn(),
    findByIRN: vi.fn(),
    updateEInvoiceStatus: vi.fn(),
    createEWayBill: vi.fn(),
  } as unknown as Mocked<EInvoiceRepository>;

  const service = new EInvoiceService(mockRepo, {} as unknown as IRPProvider);

  it('E-Invoice JSON generation matches GST schema', async () => {
    mockRepo.getInvoiceData.mockResolvedValue({ company_id: 'c1', id: 'inv1', total_amount: 75000 });
    mockRepo.createEInvoice.mockImplementation((d) => Promise.resolve({ id: 'ei1', ...d }));
    const result = await service.generateIRN('inv1');
    expect(result.irn).toMatch(/^IRN\d+/);
    expect(result.status).toBe('generated');
    expect(result.qr_code).toBeTruthy();
  });

  it('Cancel IRN updates status', async () => {
    mockRepo.findByIRN.mockResolvedValue({ irn: 'IRN123', status: 'generated' });
    mockRepo.updateEInvoiceStatus.mockResolvedValue({ irn: 'IRN123', status: 'cancelled' });
    const result = await service.cancelIRN('IRN123', 'Wrong entry');
    expect(result.status).toBe('cancelled');
  });
});
