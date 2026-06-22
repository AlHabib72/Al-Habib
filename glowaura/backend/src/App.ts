import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { authRouter, productRouter, orderRouter, couponRouter, categoryRouter, reviewRouter, blogRouter } from './routes/index';
import { errorHandler, AppError } from './middleware/error';

const app: Application = express();

// ─── SECURITY ────────────────────────────────────────────
app.use(helmet());

// FIXED: Original used cors() with no config — allows ALL origins (security risk in prod)
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 100,
  message: { success: false, message: 'Too many requests, please try again later.' },
});
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, message: 'Too many login attempts, please try again later.' },
});

app.use('/api/', limiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// ─── BODY PARSING ────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ─── ROUTES ──────────────────────────────────────────────
app.use('/api/auth', authRouter);
app.use('/api/products', productRouter);
app.use('/api/orders', orderRouter);
app.use('/api/coupons', couponRouter);
app.use('/api/categories', categoryRouter);
app.use('/api/reviews', reviewRouter);
app.use('/api/blogs', blogRouter);

// Expose Razorpay public key safely
app.get('/api/config/razorpay', (_req: Request, res: Response) => {
  res.json({ key: process.env.RAZORPAY_KEY_ID });
});

// Health check
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Root
app.get('/', (_req: Request, res: Response) => {
  res.json({ message: 'GlowAura API', version: '1.0.0' });
});

// 404
app.use((_req: Request, _res: Response, next: NextFunction) => {
  next(new AppError('Route not found', 404));
});

// Global error handler
app.use(errorHandler);

export default app;
