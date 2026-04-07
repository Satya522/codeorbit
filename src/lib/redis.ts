import Redis from "ioredis";

type CacheEntry = {
  expiresAt: number;
  value: string;
};

const memoryStore = new Map<string, CacheEntry>();

let redisClient: Redis | null = null;

function getRedisClient() {
  const url = process.env.REDIS_URL?.trim();

  if (!url) {
    return null;
  }

  if (!redisClient) {
    redisClient = new Redis(url, {
      enableOfflineQueue: false,
      lazyConnect: true,
      maxRetriesPerRequest: 1,
    });
  }

  return redisClient;
}

async function readFromMemory(key: string) {
  const entry = memoryStore.get(key);

  if (!entry) {
    return null;
  }

  if (entry.expiresAt <= Date.now()) {
    memoryStore.delete(key);
    return null;
  }

  return entry.value;
}

export const redis = {
  async get(key: string) {
    const client = getRedisClient();

    if (!client) {
      return readFromMemory(key);
    }

    try {
      if (client.status === "wait") {
        await client.connect();
      }

      return await client.get(key);
    } catch (error) {
      console.error("Redis GET failed, falling back to memory cache.", error);
      return readFromMemory(key);
    }
  },

  async setex(key: string, seconds: number, value: string) {
    const client = getRedisClient();

    if (!client) {
      memoryStore.set(key, {
        expiresAt: Date.now() + seconds * 1000,
        value,
      });
      return;
    }

    try {
      if (client.status === "wait") {
        await client.connect();
      }

      await client.set(key, value, "EX", seconds);
    } catch (error) {
      console.error("Redis SETEX failed, falling back to memory cache.", error);
      memoryStore.set(key, {
        expiresAt: Date.now() + seconds * 1000,
        value,
      });
    }
  },
};
