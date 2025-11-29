// utils/redisClient.js
import { createClient } from 'redis';
import dotenv from 'dotenv';

dotenv.config();

// Create Redis client connection URL
const redisUrl = process.env.REDIS_URL || 
  `redis://${process.env.REDIS_PASSWORD ? `:${process.env.REDIS_PASSWORD}@` : ''}${process.env.REDIS_HOST || 'localhost'}:${process.env.REDIS_PORT || 6379}`;

// Create Redis client
const redisClient = createClient({
  url: redisUrl,
});

// Handle connection errors
redisClient.on('error', (err) => {
  console.error('❌ Redis Client Error:', err);
});

// Handle successful connection
redisClient.on('connect', () => {
  console.log('🟡 Redis Client: Connecting...');
});

redisClient.on('ready', () => {
  console.log('🟢 Redis Client: Connected and ready!');
});

// Connect to Redis
redisClient.connect().catch((err) => {
  console.error('❌ Failed to connect to Redis:', err);
  console.log('⚠️  Application will continue without Redis caching');
});

// Cache helper functions
export const cache = {
  // Get data from cache
  get: async (key) => {
    try {
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

