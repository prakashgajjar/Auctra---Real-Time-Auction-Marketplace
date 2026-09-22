import mongoose from 'mongoose';
import config from '../config/index.js';

let isConnected = false;

export async function connectMongo() {
  if (isConnected) return;

  try {
    await mongoose.connect(config.mongodbUri);
    isConnected = true;
    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    throw error;
  }
}

export function isMongoHealthy() {
  return mongoose.connection.readyState === 1;
}

export const isMongoConnected = isMongoHealthy;

export async function disconnectMongo() {
  if (isConnected) {
    await mongoose.disconnect();
    isConnected = false;
  }
}

export default mongoose;
