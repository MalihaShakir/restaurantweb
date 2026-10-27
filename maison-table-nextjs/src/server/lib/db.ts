/**
 * MongoDB connection helper — Vercel/serverless safe.
 *
 * Uses a module-level cached promise so the same connection is reused across
 * hot-reloads in development and within a single Lambda warm container.
 *
 * NEVER import this file in "use client" components.
 */
import mongoose from "mongoose";

interface ConnectionCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  // eslint-disable-next-line no-var
  var __mongooseCache: ConnectionCache | undefined;
}

const cache: ConnectionCache = global.__mongooseCache ?? { conn: null, promise: null };
global.__mongooseCache = cache;

export async function connectDB(): Promise<typeof mongoose> {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error(
      "MONGODB_URI is not set. Add it to .env.local (development) " +
      "or to your Vercel project environment variables (production).",
    );
  }

  if (cache.conn) return cache.conn;

  if (!cache.promise) {
    cache.promise = mongoose
      .connect(uri, {
        maxPoolSize: 5,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      })
      .then((m) => {
        console.log("✅ MongoDB connected");
        return m;
      })
      .catch((err) => {
        cache.promise = null; // allow retry on next request
        throw err;
      });
  }

  cache.conn = await cache.promise;
  return cache.conn;
}

export const db = connectDB;
