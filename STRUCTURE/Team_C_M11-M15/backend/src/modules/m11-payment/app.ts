// M11 Payment Module - Express App Entry Point

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import routes from './routes';
import { errorMiddleware } from './middleware/error.middleware';
import { tenantMiddleware } from './middleware/tenant.middleware';

const app = express();

app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Tenant isolation check
app.use(tenantMiddleware);

// M11 Routes mounted at /api/v1/payments
app.use('/api/v1/payments', routes);

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    module: 'M11_Payment', 
    version: '2.0.0',
    team: 'C',
    timestamp: new Date().toISOString()
  });
});

// Error handling
app.use(errorMiddleware);

export default app;
