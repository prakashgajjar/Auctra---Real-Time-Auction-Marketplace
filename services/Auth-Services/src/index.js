import app from './app.js';
import config from './config/index.js';
import prisma from './prisma/client.js';
import { connectMongo, disconnectMongo } from './mongo/connection.js';
import redis from './redis/client.js';

async function bootstrap() {
  console.log('\nStarting Auctra Auth Service (Express + JavaScript on Bun)...\n');

  // 1. Connect MongoDB
  try {
    if (config.mongodbUri) {
      await connectMongo();
    } else {
      console.warn('MONGODB_URI not specified in environment');
    }
  } catch (err) {
    console.warn('MongoDB connection could not be established immediately, retrying in background...');
  }

  // 2. Connect PostgreSQL (Prisma)
  try {
    await prisma.$connect();
    console.log('PostgreSQL (Prisma) connected successfully');
  } catch (err) {
    console.warn('PostgreSQL connection failed:', err.message);
  }

  // 3. Start HTTP Server
  const server = app.listen(config.port, () => {
    console.log(`
╔══════════════════════════════════════════════════════════════╗
║               AUCTRA AUTH MICROSERVICE                       ║
╠══════════════════════════════════════════════════════════════╣
║  Runtime    : Bun                                            ║
║  Framework  : Express.js (ES Modules)                        ║
║  Port       : ${String(config.port).padEnd(46)} ║
║  Env        : ${String(config.nodeEnv).padEnd(46)} ║
║  Health     : http://localhost:${config.port}/health${' '.repeat(Math.max(0, 31 - String(config.port).length))} ║
║  Auth API   : http://localhost:${config.port}/api/v1/auth${' '.repeat(Math.max(0, 26 - String(config.port).length))} ║
╚══════════════════════════════════════════════════════════════╝
    `);
  });

  // Graceful shutdown handling
  const shutdown = async (signal) => {
    console.log(`\nReceived ${signal}. Starting graceful shutdown...`);

    server.close(async () => {
      console.log('HTTP server closed.');

      try {
        await prisma.$disconnect();
        console.log('PostgreSQL disconnected.');
      } catch (err) {
        console.error('Error disconnecting PostgreSQL:', err);
      }

      try {
        await disconnectMongo();
        console.log('MongoDB disconnected.');
      } catch (err) {
        console.error('Error disconnecting MongoDB:', err);
      }

      try {
        redis.disconnect();
        console.log('Redis disconnected.');
      } catch (err) {
        console.error('Error disconnecting Redis:', err);
      }

      console.log('Auctra Auth Service gracefully stopped.');
      process.exit(0);
    });

    // Force shutdown after timeout
    setTimeout(() => {
      console.error('Forced shutdown after timeout');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

bootstrap().catch((err) => {
  console.error('Fatal error during service bootstrap:', err);
  process.exit(1);
});
