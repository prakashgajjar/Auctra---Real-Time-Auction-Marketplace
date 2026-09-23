import app from './app.js';
import config from './config/index.js';
import prisma from './prisma/client.js';
import redis from './redis/client.js';

async function startServer() {
  console.log('\n========================================');
  console.log('   Starting Auctra Bid Service...');
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

  // 3. Start HTTP Server
  const server = app.listen(config.port, () => {
    console.log(`\n✓ Auctra Bid Service listening on port ${config.port}`);
    console.log(`  Health Check: http://localhost:${config.port}/health`);
    console.log(`  Environment:  ${config.env}\n`);
  });

  // Graceful Shutdown
  const shutdown = async (signal) => {
    console.log(`\nReceived ${signal}. Shutting down Bid Service gracefully...`);
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
