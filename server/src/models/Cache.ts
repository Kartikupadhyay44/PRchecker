import mongoose, { Schema, Document } from 'mongoose';

export interface ICacheDoc extends Document {
  key: string;
  data: any;
  createdAt: Date;
}

const CacheSchema: Schema = new Schema(
  {
    key: { type: String, required: true, unique: true, index: true },
    data: { type: Schema.Types.Mixed, required: true },
    createdAt: { type: Date, default: Date.now, expires: 1800 }, // 30 minutes TTL
  }
);

export const CacheModel = mongoose.model<ICacheDoc>('Cache', CacheSchema);

// In-memory fallback cache in case DB is temporarily disconnected
class MemoryCache {
  private store = new Map<string, { data: any; expiry: number }>();

  get<T>(key: string): T | null {
    const item = this.store.get(key);
    if (!item) return null;
    if (Date.now() > item.expiry) {
      this.store.delete(key);
      return null;
    }
    return item.data as T;
  }

  set(key: string, data: any, ttlSeconds: number = 1800): void {
    this.store.set(key, {
      data,
      expiry: Date.now() + ttlSeconds * 1000,
    });
  }
}

export const memoryCache = new MemoryCache();
