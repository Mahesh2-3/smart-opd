import { Redis } from "ioredis";

const globalForRedis = global;

const redisOptions = {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  retryStrategy: (times) => {
    if (times > 3) {
      return null; // Stop retrying
    }
    return Math.min(times * 50, 2000);
  }
};

const redis =
  globalForRedis.redis ||
  new Redis(process.env.REDIS_URL || "redis://localhost:6379", redisOptions);

redis.on("error", (err) => {
  console.warn("Redis connection error, falling back to un-cached operations.", err.message);
});

if (process.env.NODE_ENV !== "production") {
  globalForRedis.redis = redis;
}

export default redis;
