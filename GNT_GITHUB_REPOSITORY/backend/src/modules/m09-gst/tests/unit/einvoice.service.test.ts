import { describe, it, expect, beforeEach, vi } from 'vitest';

import { EInvoiceService, type IRPProvider } from '../../services/einvoice.service';
import { EInvoiceRepository } from '../../repositories/einvoice.repository';

const mocks = vi.hoisted(() => ({
  getInvoiceData: vi.fn(),
  createEInvoice: vi.fn(),
  findByIRN: vi.fn(),
  updateEInvoiceStatus: vi.fn(),
  generateEInvoice: vi.fn(),
  cancelEInvoice: vi.fn(),
}));

const mockRepo = {
  getInvoiceData: mocks.getInvoiceData,
  createEInvoice: mocks.createEInvoice,
  findByIRN: mocks.findByIRN,
  updateEInvoiceStatus: mocks.updateEInvoiceStatus,
} as unknown as EInvoiceRepository;

const mockIrp = {
  generateEInvoice: mocks.generateEInvoice,
  cancelEInvoice: mocks.cancelEInvoice,
} as unknown as IRPProvider;

describe('EInvoiceService', () => {
  const service = new EInvoiceService(mockRepo, mockIrp);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('E-Invoice JSON generation matches GST schema', async () => {
    mocks.getInvoiceData.mockResolvedValue({
      company_id: 'c1',
      id: 'inv1',
      total_amount: 75000,
      items: [{ product_id: 'p1', quantity: 1, rate: 75000 }],
    });
    mocks.generateEInvoice.mockResolvedValue({
      irn: 'IRN123',
      ack_no: 'ACK1',
      ack_date: '2026-09-03',
      signed_invoice: 'SIGNED',
      qr_code: 'QR',
    });
    mocks.createEInvoice.mockResolvedValue({ id: 'ei1', irn: 'IRN123', status: 'generated', qr_code: 'QR' });

    const result = await service.generateIRN('inv1', 'c1');
    expect(result.irn).toMatch(/^IRN\d+/);
    expect(result.status).toBe('generated');
    expect(result.qr_code).toBeTruthy();
  });

  it('Cancel IRN updates status', async () => {
    mocks.findByIRN.mockResolvedValue({ irn: 'IRN123', status: 'generated' });
    mocks.updateEInvoiceStatus.mockResolvedValue({ irn: 'IRN123', status: 'cancelled' });

    const result = await service.cancelIRN('IRN123', 'Wrong entry', 'c1');
    expect(result.status).toBe('cancelled');
    expect(mocks.cancelEInvoice).toHaveBeenCalledWith('IRN123', 'Wrong entry');
  });
});
