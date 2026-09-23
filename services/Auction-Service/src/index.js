import app from './app.js';
import config from './config/index.js';
import prisma from './prisma/client.js';
import redis from './redis/client.js';
import { seedCategories } from './prisma/seed.js';
import { startAuctionLifecycleWorker, stopAuctionLifecycleWorker } from './workers/auction-lifecycle.worker.js';

async function startServer() {
  console.log('\n========================================');
  console.log('   Starting Auctra Auction Service...');
  console.log('========================================\n');

  // 1. Verify PostgreSQL
  try {
    await prisma.$connect();
    console.log('✓ PostgreSQL connected via Prisma');
  } catch (err) {
    console.error('✗ PostgreSQL connection error:', err.message);
    process.exit(1);
  }

  // 2. Connect Redis
  try {
    await redis.connect();
  } catch (err) {
    console.warn('⚠ Redis connect warning:', err.message);
  }

  // 3. Ensure initial categories exist
  try {
    await seedCategories();
  } catch (err) {
    console.warn('Category seed notice:', err.message);
  }

  // 4. Start Auction Lifecycle Worker
  startAuctionLifecycleWorker(30);

  // 5. Start HTTP Server
  const server = app.listen(config.port, () => {
    console.log(`\n✓ Auctra Auction Service listening on port ${config.port}`);
    console.log(`  Health Check: http://localhost:${config.port}/health`);
    console.log(`  Environment:  ${config.env}\n`);
  });

  // Graceful Shutdown
  const shutdown = async (signal) => {
    console.log(`\nReceived ${signal}. Shutting down Auction Service gracefully...`);
    stopAuctionLifecycleWorker();
    server.close(async () => {
      try {
        await prisma.$disconnect();
        await redis.quit();
        console.log('✓ Database and cache connections closed cleanly.');
        process.exit(0);
      } catch (err) {
        console.error('Error during shutdown:', err);
        process.exit(1);
      }
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

startServer();
