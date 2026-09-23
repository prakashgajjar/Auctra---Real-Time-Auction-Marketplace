import express from 'express';
import cors from 'cors';
import userRoutes from './routes/user.routes.js';
import addressRoutes from './routes/address.routes.js';
import sellerRoutes from './routes/seller.routes.js';
import adminRoutes from './routes/admin.routes.js';
import { errorHandler } from './middleware/error.middleware.js';
import prisma from './prisma/client.js';
import { isMongoConnected } from './mongo/connection.js';
import { isRedisHealthy } from './redis/client.js';

const app = express();

// Security & Parsing Middlewares
app.use(
  cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Device-Info'],
  })
);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    const isError = res.statusCode >= 400;
    console.log(`[User-Service] [${req.method}] ${req.originalUrl} ${res.statusCode} - ${duration}ms`);
  });
  next();
});

// Root Information
app.get('/', (req, res) => {
  res.status(200).json({
    service: 'Auctra User & Roles Service',
    runtime: 'Bun',
    framework: 'Express',
    version: '1.0.0',
    status: 'ONLINE',
  });
});

// Comprehensive Health Check
app.get('/health', async (req, res) => {
  let postgresOk = false;
  try {
    await prisma.$queryRaw`SELECT 1`;
    postgresOk = true;
  } catch {
    postgresOk = false;
  }

  const mongoOk = isMongoConnected();
  const redisOk = await isRedisHealthy();

  const isHealthy = postgresOk && redisOk;

  res.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? 'HEALTHY' : 'DEGRADED',
    timestamp: new Date().toISOString(),
    service: 'auctra-user-service',
    dependencies: {
      postgres: postgresOk ? 'UP' : 'DOWN',
      redis: redisOk ? 'UP' : 'DOWN',
      mongo: mongoOk ? 'UP' : 'DOWN (Optional for audit logging)',
    },
  });
});

// Mount Microservice API Routes
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/users/me/addresses', addressRoutes);
app.use('/api/v1/sellers', sellerRoutes);
app.use('/api/v1/admin', adminRoutes);

// 404 Catch-All
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Cannot ${req.method} ${req.path}`,
    },
  });
});

// Centralized Error Handling
app.use(errorHandler);

export default app;
