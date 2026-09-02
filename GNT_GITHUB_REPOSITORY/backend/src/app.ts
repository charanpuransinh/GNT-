import express from 'express';
import { EventEmitter } from 'node:events';
import companyRouter from './modules/m04-company-management/routes/company.routes';
import authRouter from './modules/m02-core-architecture/routes/auth.routes';
import deviceRouter from './modules/m03-device-platform/routes/device.routes';
import appRouter from './modules/m01-foundation/routes/app.routes';
import purchaseRouter from './modules/m07-purchase/routes/purchase.routes';
import salesRouter from './modules/m08-sales/routes/sales.routes';
import hrRouter from './modules/m12-hr';
import paymentRouter from './modules/m11-payment/routes';
import { initM13Module } from './modules/m13-automation';
import { importRoutes, exportRoutes } from './modules/m14-import-export';
import syncRouter from './modules/m15-sync';
import { createIntegrationRoutes } from './modules/m18-external-integration';
import { IntegrationController } from './modules/m18-external-integration/controllers/integration.controller';
import { WebhookController } from './modules/m18-external-integration/controllers/webhook.controller';
import { IntegrationService } from './modules/m18-external-integration/services/integration.service';
import { WebhookService } from './modules/m18-external-integration/services/webhook.service';
import { IntegrationRepository } from './modules/m18-external-integration/repositories/integration.repository';
import { GatewayService } from './modules/m18-external-integration/services/gateway.service';
import { prisma } from './common/config/prisma';

export const app = express();

// Middleware
app.use(express.json({ limit: '10mb' }));

// M01 — Foundation
app.use('/api/v1/app', appRouter);

// M02 — Core Architecture (Auth)
app.use('/api/v1/auth', authRouter);

// M03 — Device Platform
app.use('/api/v1/device', deviceRouter);

// M04 — Company Management
app.use('/api/v1/company', companyRouter);

// M07 — Purchase
app.use('/api/v1/purchase', purchaseRouter);

// M08 — Sales
app.use('/api/v1/sales', salesRouter);

// M11 — Payment
app.use('/api/v1/payments', paymentRouter);

// M12 — HR
app.use('/api/v1/hr', hrRouter);

// M13 — Automation
app.use('/api/v1/automation', initM13Module());

// M14 — Import/Export
app.use('/api/v1/imports', importRoutes);
app.use('/api/v1/exports', exportRoutes);

// M15 — Sync
app.use('/api/v1/sync', syncRouter);

// M18 — External Integration
const integrationRepository = new IntegrationRepository(prisma);
const gatewayService = new GatewayService(integrationRepository);
const integrationEventBus = new EventEmitter();
const integrationService = new IntegrationService(integrationRepository, gatewayService, integrationEventBus);
const webhookService = new WebhookService(integrationRepository, gatewayService, integrationService, integrationEventBus);
const integrationController = new IntegrationController(integrationService);
const webhookController = new WebhookController(webhookService);
const integrationRouter = createIntegrationRoutes(integrationController, webhookController);
app.use('/api/v1/integrations', integrationRouter);

// Health check
app.get('/healthz', (_req, res) => res.json({ ok: true }));
