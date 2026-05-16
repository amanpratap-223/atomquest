import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { ENV } from './config/env';
import { connectDB } from './config/db';

// Routes
import authRoutes        from './routes/auth.routes';
import goalsRoutes       from './routes/goals.routes';
import checkinsRoutes    from './routes/checkins.routes';
import managerRoutes     from './routes/manager.routes';
import adminRoutes       from './routes/admin.routes';
import escalationRoutes  from './routes/escalation.routes';
import { startEscalationCron } from './jobs/escalationCron';

const app = express();

// ── Middleware ─────────────────────────────────────────────────────────────────
app.use(helmet());
app.use(cors({ origin: ENV.CLIENT_URL, credentials: true }));
app.use(express.json());
app.use(morgan(ENV.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Rate limiting on auth routes
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100, message: 'Too many requests' });
app.use('/api/auth', authLimiter);

// ── Routes ─────────────────────────────────────────────────────────────────────
app.use('/api/auth',       authRoutes);
app.use('/api/goals',      goalsRoutes);
app.use('/api/checkins',   checkinsRoutes);
app.use('/api/manager',    managerRoutes);
app.use('/api/admin',      adminRoutes);
app.use('/api/escalation', escalationRoutes);

// Health check
app.get('/health', (_req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

// 404 handler
app.use((_req, res) => res.status(404).json({ success: false, message: 'Route not found' }));

// Error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: 'Internal server error' });
});

// ── Boot ──────────────────────────────────────────────────────────────────────
const start = async () => {
  await connectDB();
  startEscalationCron();
  app.listen(ENV.PORT, () => console.log(`🚀 AtomQuest API running on http://localhost:${ENV.PORT}`));
};

start();

export default app;
