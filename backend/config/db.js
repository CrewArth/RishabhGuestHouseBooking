import mongoose from 'mongoose';

// Cache the connection across serverless invocations.
// On Vercel, the Node module is kept warm between requests in the same
// instance — reusing the existing connection avoids a full reconnect on
// every call and cuts cold-start latency significantly.
let cached = global._mongooseConnection;

if (!cached) {
  cached = global._mongooseConnection = { conn: null, promise: null };
}

const connectDb = async () => {
  // Already connected — return immediately
  if (cached.conn) return cached.conn;

  // Connection in progress — wait for it
  if (!cached.promise) {
    cached.promise = mongoose.connect(process.env.MONGODB_URI, {
      // Keep the pool small for serverless — one connection is enough per instance
      maxPoolSize: 5,
      minPoolSize: 1,
      // Fail fast if the DB is unreachable rather than hanging
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 30000,
      // Buffers Mongoose operations until the connection is ready
      bufferCommands: true,
    }).then((m) => {
      console.log('MongoDB connected');
      return m;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (err) {
    // Reset so the next request retries
    cached.promise = null;
    console.error('MongoDB connection error:', err);
    throw err;
  }

  return cached.conn;
};

export default connectDb;
