// utils/redisClient.js
import { createClient } from 'redis';
import dotenv from 'dotenv';

dotenv.config();

let redisClient = null;
let redisEnabled = true;
let redisReady = false;

const buildRedisUrl = () =>
  process.env.REDIS_URL ||
  `redis://${process.env.REDIS_PASSWORD ? `:${encodeURIComponent(process.env.REDIS_PASSWORD)}@` : ''}${process.env.REDIS_HOST || 'localhost'}:${process.env.REDIS_PORT || 6379}`;

// Create Redis client (never crash server if it fails)
try {
  const redisUrl = buildRedisUrl();
  redisClient = createClient({
    url: redisUrl,
    socket: {
      connectTimeout: 1500,
      reconnectStrategy: () => new Error('Redis disabled (unavailable)'),
    },
  });
} catch (err) {
  redisEnabled = false;
  console.error('❌ Redis init failed (invalid config). Starting without Redis.', err);
}

// Handle connection errors
if (redisClient) {
  redisClient.on('error', (err) => {
    redisReady = false;
    console.error('❌ Redis Client Error:', err);
  });

// Handle successful connection
  redisClient.on('connect', () => {
    console.log('🟡 Redis Client: Connecting...');
  });

  redisClient.on('ready', () => {
    redisReady = true;
    console.log('🟢 Redis Client: Connected and ready!');
  });

  redisClient.on('end', () => {
    redisReady = false;
    console.log('🟠 Redis Client: Connection ended.');
  });

  // Connect to Redis (non-blocking; must never block server startup)
  const connectNonBlocking = async () => {
    try {
      await redisClient.connect();
      return true;
    } catch (err) {
      redisEnabled = false;
      redisReady = false;
      console.error('❌ Failed to connect to Redis:', err);
      console.log('⚠️  Application will continue without Redis caching');
      try {
        await redisClient.quit();
      } catch {
        // ignore
      }
      return false;
    }
  };

  // Fire-and-forget: server must be able to start even if Redis is down
  void connectNonBlocking();
}

// Cache helper functions
export const cache = {
  // Get data from cache
  get: async (key) => {
    try {
      if (!redisEnabled || !redisClient || !redisReady) return null;
      const data = await redisClient.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error(`❌ Redis GET error for key ${key}:`, error);
      return null; // Return null on error (fallback to database)
    }
  },

  // Set data in cache with TTL (Time To Live in seconds)
  set: async (key, value, ttlSeconds = null) => {
    try {
      if (!redisEnabled || !redisClient || !redisReady) return false;
      const stringValue = JSON.stringify(value);
      if (ttlSeconds) {
        await redisClient.setEx(key, ttlSeconds, stringValue);
      } else {
        await redisClient.set(key, stringValue);
      }
      return true;
    } catch (error) {
      console.error(`❌ Redis SET error for key ${key}:`, error);
      return false; // Return false on error (non-blocking)
    }
  },

  // Delete data from cache
  delete: async (key) => {
    try {
      if (!redisEnabled || !redisClient || !redisReady) return false;
      await redisClient.del(key);
      return true;
    } catch (error) {
      console.error(`❌ Redis DELETE error for key ${key}:`, error);
      return false;
    }
  },

  // Delete multiple keys matching a pattern
  deletePattern: async (pattern) => {
    try {
      if (!redisEnabled || !redisClient || !redisReady) return false;
      const keys = await redisClient.keys(pattern);
      if (keys.length > 0) {
        await redisClient.del(keys);
      }
      return true;
    } catch (error) {
      console.error(`❌ Redis DELETE PATTERN error for ${pattern}:`, error);
      return false;
    }
  },

  // Check if key exists
  exists: async (key) => {
    try {
      if (!redisEnabled || !redisClient || !redisReady) return false;
      const result = await redisClient.exists(key);
      return result === 1;
    } catch (error) {
      console.error(`❌ Redis EXISTS error for key ${key}:`, error);
      return false;
    }
  },
};

// Export the client for advanced usage
export default redisClient;

