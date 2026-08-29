import express from 'express';
import companyRouter from './modules/m04-company-management/routes/company.routes';
import authRouter from './modules/m02-core-architecture/routes/auth.routes';
import deviceRouter from './modules/m03-device-platform/routes/device.routes';
import appRouter from './modules/m01-foundation/routes/app.routes';
import purchaseRouter from './modules/m07-purchase/routes/purchase.routes';
import salesRouter from './modules/m08-sales/routes/sales.routes';

export const app = express();
app.use(express.json({ limit: '10mb' }));
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/company', companyRouter);
app.use('/api/v1/device', deviceRouter);
app.use('/api/v1/app', appRouter);
app.use('/api/v1/purchase', purchaseRouter);
app.use('/api/v1/sales', salesRouter);
app.get('/healthz', (_req, res) => res.json({ ok: true }));
