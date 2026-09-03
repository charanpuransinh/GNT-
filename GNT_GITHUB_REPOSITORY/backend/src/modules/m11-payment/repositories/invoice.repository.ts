// M11 Payment Module - Invoice Repository
// ⛔ टास्क #008 का फैसला: M11 को invoice का मालिक नहीं बनाया जाना — invoice M07 (purchase_invoice)
// और M08 (SalesInvoice) की चीज़ है। इसलिए prisma.invoice नाम का कोई model नहीं बनाया गया और यह
// repository अब एक साफ़ stub है जो ज़ोर से बताता है कि कौन-सा invoice चाहिए यह समीक्षक AI तय करेंगे
// (चुपचाप ग़लत कुछ नहीं)।
import { Decimal } from '@prisma/client/runtime/library';
import { Invoice, InvoiceStatus, InvoiceFilter, CreateInvoiceDto, UpdateInvoiceDto } from '../types';

const NOT_HERE = (): never => {
  throw new Error('M11 invoice repository disabled — invoice M07/M08 की चीज़ है (#008 का फैसला; समीक्षक AI तय करेंगे)');
};

export class InvoiceRepository {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  constructor(_prisma: unknown) {}

  async findById(_id: string, _tenantId: string): Promise<Invoice | null> {
    return NOT_HERE();
  }
  async findByNumber(_invoiceNumber: string, _tenantId: string): Promise<Invoice | null> {
    return NOT_HERE();
  }
  async findAll(_filter: InvoiceFilter, _tenantId: string): Promise<never> {
    return NOT_HERE();
  }
  async create(_dto: CreateInvoiceDto, _tenantId: string, _userId: string): Promise<Invoice> {
    return NOT_HERE();
  }
  async update(_id: string, _dto: UpdateInvoiceDto, _tenantId: string, _userId: string): Promise<Invoice> {
    return NOT_HERE();
  }
  async updateStatus(_id: string, _status: InvoiceStatus, _tenantId: string, _userId: string): Promise<Invoice> {
    return NOT_HERE();
  }
  async updatePaidAmount(_id: string, _amount: Decimal, _tenantId: string, _userId: string): Promise<Invoice> {
    return NOT_HERE();
  }
  async delete(_id: string, _tenantId: string): Promise<Invoice> {
    return NOT_HERE();
  }
  async getDashboardStats(_tenantId: string): Promise<never> {
    return NOT_HERE();
  }
}
