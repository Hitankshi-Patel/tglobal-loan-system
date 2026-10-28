import express, { type Express } from 'express';
import cors from 'cors';
import loanSchemesRouter from './routes/loanSchemes.js';
import quotesRouter from './routes/quotes.js';
import leadsRouter from './routes/leads.js';
import otpRouter from './routes/otp.js';
import agentRouter from './routes/agent.js';
import adminRouter from './routes/admin.js';
import { errorHandler, AppError } from './middleware/errorHandler.js';

export function createApp(): Express {
  const app = express();

  // Middleware
  app.use(
    cors({
      origin: process.env.FRONTEND_URL || true,
      credentials: true,
    })
  );
  app.use(express.json());

  // Health check endpoint
  app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // API v1 Routes
  app.use('/api/v1/loan-schemes', loanSchemesRouter);
  app.use('/api/v1/quotes', quotesRouter);
  app.use('/api/v1/leads', leadsRouter);
  app.use('/api/v1/otp', otpRouter);
  app.use('/api/v1/agent', agentRouter);
  app.use('/api/v1/admin', adminRouter);

  // 404 Fallback
  app.use((req, _res, next) => {
    next(new AppError(404, 'NOT_FOUND', `Cannot ${req.method} ${req.path}`, []));
  });

  // Centralized Error Handler (Strict Error Contract)
  app.use(errorHandler);

  return app;
}
