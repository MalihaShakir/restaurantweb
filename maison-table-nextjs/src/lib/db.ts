/**
 * @deprecated Use @/server/lib/db instead.
 * This stub kept for backwards compatibility with any imports.
 */
import mongoose from "mongoose";

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  // eslint-disable-next-line no-var
  var _mongoose: MongooseCache | undefined;
}

const cached: MongooseCache = global._mongoose ?? { conn: null, promise: null };
global._mongoose = cached;

export async function connectDB() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.warn("MONGODB_URI not set — skipping database connection");
    return null;
  }
  if (cached.conn) return cached.conn;
  if (!cached.promise) {
    cached.promise = mongoose.connect(uri).then((m) => m);
  }
  cached.conn = await cached.promise;
  return cached.conn;
}
