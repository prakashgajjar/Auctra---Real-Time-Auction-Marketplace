import express from 'express';
import cors from 'cors';
import notificationRoutes from './routes/notification.routes.js';
import { errorHandler } from './middleware/error.middleware.js';
import prisma from './prisma/client.js';
import { isRedisHealthy } from './redis/client.js';
import config from './config/index.js';

const app = express();

// Security & Parsing Middlewares
app.use(
  cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Idempotency-Key', 'X-Device-Info'],
    exposedHeaders: ['X-RateLimit-Limit', 'X-RateLimit-Remaining'],
  })
);

app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[Notification-Service] [${req.method}] ${req.originalUrl} ${res.statusCode} - ${duration}ms`);
  });
  next();
});

// Root Information
app.get('/', (req, res) => {
  res.status(200).json({
    service: 'Auctra Multi-Channel Notification Engine',
    runtime: 'Bun',
    framework: 'Express',
    version: '1.0.0',
    status: 'ONLINE',
    channels: ['IN_APP', 'EMAIL', 'WEBSOCKET'],
    features: {
      emailEngine: config.features.enableEmail ? 'ENABLED' : 'DISABLED',
      webSocketPublish: config.features.enableWebSocketPublish ? 'ENABLED' : 'DISABLED',
      dlqProtection: 'ACTIVE',
    },
  });
});

// Comprehensive Health Check (plane.md Section 39)
app.get('/health', async (req, res) => {
  let postgresOk = false;
  try {
    await prisma.$queryRaw`SELECT 1`;
    postgresOk = true;
  } catch {
    postgresOk = false;
  }

  const redisOk = await isRedisHealthy();
  const isHealthy = postgresOk && redisOk;

  res.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? 'HEALTHY' : 'DEGRADED',
    timestamp: new Date().toISOString(),
    service: 'auctra-notification-service',
    dependencies: {
      postgres: postgresOk ? 'UP' : 'DOWN',
      redis: redisOk ? 'UP' : 'DOWN',
    },
  });
});

// Readiness Probe
app.get('/readiness', async (req, res) => {
  const redisOk = await isRedisHealthy();
  let postgresOk = false;
  try {
    await prisma.$queryRaw`SELECT 1`;
    postgresOk = true;
  } catch {
    postgresOk = false;
  }

  if (redisOk && postgresOk) {
    return res.status(200).json({ status: 'READY' });
  }
  return res.status(503).json({ status: 'NOT_READY' });
});

// Liveness Probe
app.get('/liveness', (req, res) => {
  res.status(200).json({ status: 'ALIVE', uptime: process.uptime() });
});

// Mount Notification Routes
app.use('/api/v1/notifications', notificationRoutes);

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
