import mongoose from 'mongoose';
import config from '../config/index.js';

let isConnected = false;

export async function connectMongo() {
  try {
    await mongoose.connect(config.mongo.uri, {
      serverSelectionTimeoutMS: 5000,
    });
    isConnected = true;
    console.log('✓ MongoDB connected for User Audit Logging');
  } catch (err) {
    console.error('✗ MongoDB connection error:', err.message);
    isConnected = false;
  }
}

export function isMongoConnected() {
  return isConnected && mongoose.connection.readyState === 1;
}

export default mongoose;
