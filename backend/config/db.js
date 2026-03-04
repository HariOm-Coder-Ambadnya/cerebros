import { MongoClient } from 'mongodb';
import logger from './logger.js';

let client = null;
let db = null;

export async function connectDB() {
  if (db) return db;

  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI environment variable is not set');

  client = new MongoClient(uri, {
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
  });

  await client.connect();
  db = client.db('cerebro');

  logger.info('✅ Connected to MongoDB Atlas');

  // Graceful shutdown
  process.on('SIGINT', async () => {
    await client.close();
    logger.info('MongoDB connection closed');
    process.exit(0);
  });

  return db;
}

export function getDB() {
  if (!db) throw new Error('Database not initialized. Call connectDB() first.');
  return db;
}

export function getCollection(name) {
  return getDB().collection(name);
}
