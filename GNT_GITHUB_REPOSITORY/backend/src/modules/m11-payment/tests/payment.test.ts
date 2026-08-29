// M11 Payment Integration Tests
import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import app from '../src/index';

const prisma = new PrismaClient();
let authToken: string;
let testInvoiceId: string;
let testPaymentId: string;

describe('M11 Payment Module Integration Tests', () => {
  beforeAll(async () => {
    await prisma.payment.deleteMany();
    await prisma.invoice.deleteMany();
    await prisma.paymentMethod.deleteMany();
    const loginRes = await request(app).post('/api/m01/auth/login').send({ email: 'test@example.com', password: 'test123' });
    authToken = loginRes.body.data.token;
  });
  afterAll(async () => { await prisma.$disconnect(); });

  describe('Payment Methods', () => {
    it('should create a payment method', async () => {
      const res = await request(app).post('/api/m11/payment/methods').set('Authorization', `Bearer ${authToken}`).send({
        name: 'Test Bank Account', type: 'BANK_TRANSFER', accountNumber: 'TEST123456', currency: 'USD', isDefault: true
      });
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Test Bank Account');
    });
    it('should list all payment methods', async () => {
      const res = await request(app).get('/api/m11/payment/methods').set('Authorization', `Bearer ${authToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data).toBeInstanceOf(Array);
    });
  });

  describe('Invoices', () => {
    it('should create an invoice', async () => {
      const res = await request(app).post('/api/m11/payment/invoices').set('Authorization', `Bearer ${authToken}`).send({
        invoiceNumber: 'INV-2026-001', customerId: 'cust-123', customerName: 'Test Customer', customerEmail: 'customer@test.com',
        items: [{ description: 'Service A', quantity: 2, unitPrice: 100, tax: 10 }],
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), currency: 'USD'
      });
      expect(res.status).toBe(201);
      expect(res.body.data.total).toBe(220);
      testInvoiceId = res.body.data.id;
    });
    it('should get invoice by id', async () => {
      const res = await request(app).get(`/api/m11/payment/invoices/${testInvoiceId}`).set('Authorization', `Bearer ${authToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(testInvoiceId);
    });
    it('should list invoices with filters', async () => {
      const res = await request(app).get('/api/m11/payment/invoices?status=PENDING&page=1&limit=10').set('Authorization', `Bearer ${authToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data).toBeInstanceOf(Array);
      expect(res.body.meta).toBeDefined();
    });
    it('should update invoice status', async () => {
      const res = await request(app).patch(`/api/m11/payment/invoices/${testInvoiceId}/status`).set('Authorization', `Bearer ${authToken}`).send({ status: 'SENT' });
      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('SENT');
    });
  });

  describe('Payments', () => {
    it('should process a payment for an invoice', async () => {
      const res = await request(app).post('/api/m11/payment/payments').set('Authorization', `Bearer ${authToken}`).send({
        invoiceId: testInvoiceId, amount: 220, method: 'BANK_TRANSFER', reference: 'PAY-REF-001', notes: 'Test payment'
      });
      expect(res.status).toBe(201);
      expect(res.body.data.status).toBe('COMPLETED');
      testPaymentId = res.body.data.id;
    });
    it('should prevent overpayment', async () => {
      const res = await request(app).post('/api/m11/payment/payments').set('Authorization', `Bearer ${authToken}`).send({
        invoiceId: testInvoiceId, amount: 100, method: 'BANK_TRANSFER', reference: 'PAY-REF-002'
      });
      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Invoice already paid');
    });
    it('should get payment by id', async () => {
      const res = await request(app).get(`/api/m11/payment/payments/${testPaymentId}`).set('Authorization', `Bearer ${authToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(testPaymentId);
    });
    it('should refund a payment', async () => {
      const res = await request(app).post(`/api/m11/payment/payments/${testPaymentId}/refund`).set('Authorization', `Bearer ${authToken}`).send({ reason: 'Customer request' });
      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('REFUNDED');
    });
  });

  describe('Cross-Module Events (M12 -> M11)', () => {
    it('should process payroll event from M12', async () => {
      const eventRes = await request(app).post('/api/m11/payment/events/process').set('Authorization', `Bearer ${authToken}`).send({
        eventType: 'PAYROLL_GENERATED', payload: { employeeId: 'emp-123', amount: 5000, month: 8, year: 2026, targetModule: 'M11' }
      });
      expect(eventRes.status).toBe(200);
      expect(eventRes.body.success).toBe(true);
    });
  });

  describe('Reports', () => {
    it('should get payment report by date range', async () => {
      const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const endDate = new Date().toISOString();
      const res = await request(app).get(`/api/m11/payment/reports?startDate=${startDate}&endDate=${endDate}`).set('Authorization', `Bearer ${authToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data).toBeDefined();
    });
  });
});
