import express from 'express';
import cors from 'cors';
import categoryRoutes from './routes/category.routes.js';
import productRoutes from './routes/product.routes.js';
import auctionRoutes from './routes/auction.routes.js';
import watchlistRoutes from './routes/watchlist.routes.js';
import uploadRoutes from './routes/upload.routes.js';
import { errorHandler } from './middleware/error.middleware.js';
import prisma from './prisma/client.js';
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
    console.log(`[Auction-Service] [${req.method}] ${req.originalUrl} ${res.statusCode} - ${duration}ms`);
  });
  next();
});

// Root Information
app.get('/', (req, res) => {
  res.status(200).json({
    service: 'Auctra Auction & Marketplace Engine',
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

  const redisOk = await isRedisHealthy();
  const isHealthy = postgresOk && redisOk;

  res.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? 'HEALTHY' : 'DEGRADED',
    timestamp: new Date().toISOString(),
    service: 'auctra-auction-service',
    dependencies: {
      postgres: postgresOk ? 'UP' : 'DOWN',
      redis: redisOk ? 'UP' : 'DOWN',
    },
  });
});

// Mount Marketplace & Auction Routes
app.use('/api/v1/categories', categoryRoutes);
app.use('/api/v1/products', productRoutes);
app.use('/api/v1/auctions', auctionRoutes);
app.use('/api/v1/watchlist', watchlistRoutes);
app.use('/api/v1/upload', uploadRoutes);

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
