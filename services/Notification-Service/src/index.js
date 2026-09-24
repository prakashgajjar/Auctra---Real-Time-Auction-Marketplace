import app from './app.js';
import config from './config/index.js';
import prisma from './prisma/client.js';
import redis, { subscriberRedis } from './redis/client.js';
import { startEventConsumer, stopEventConsumer } from './events/event-consumer.js';

async function startServer() {
  console.log('\n======================================================');
  console.log('   Starting Auctra Multi-Channel Notification Engine  ');
  console.log('======================================================\n');

  // 1. Verify PostgreSQL
  try {
    await prisma.$connect();
    console.log('✓ PostgreSQL connected via Prisma');
  } catch (err) {
    console.error('✗ PostgreSQL connection error:', err.message);
    process.exit(1);
  }

  // 2. Connect Redis Clients
  try {
    await Promise.all([redis.connect(), subscriberRedis.connect()]);
  } catch (err) {
    console.warn('⚠ Redis connect notice:', err.message);
  }

  // 3. Start Event Consumer (Pub/Sub & DLQ)
  await startEventConsumer();

  // 4. Start HTTP Server
  const server = app.listen(config.port, () => {
    console.log(`\n✓ Auctra Notification Service listening on port ${config.port}`);
    console.log(`  Health Check: http://localhost:${config.port}/health`);
    console.log(`  Readiness:    http://localhost:${config.port}/readiness`);
    console.log(`  Liveness:     http://localhost:${config.port}/liveness`);
    console.log(`  Environment:  ${config.env}\n`);
  });

  // Graceful Shutdown
  const shutdown = async (signal) => {
    console.log(`\nReceived ${signal}. Shutting down Notification Service gracefully...`);
    server.close(async () => {
      try {
        await stopEventConsumer();
        await prisma.$disconnect();
        await Promise.all([redis.quit(), subscriberRedis.quit()]);
        console.log('✓ Database, consumer, and Redis connections closed cleanly.');
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
