const Redis = require('ioredis');

// Get Redis host from environment variable or fallback to localhost
const REDIS_HOST = process.env.REDIS_HOST || 'localhost';
const REDIS_PORT = process.env.REDIS_PORT || '6379';
const REDIS_PASSWORD = process.env.REDIS_PASSWORD || ''; // If you don't use a password, leave it blank

// Initialize Redis with options (no need for explicit connect call in ioredis)
const redisClient = new Redis({
    host: REDIS_HOST,
    port: REDIS_PORT,
    password: REDIS_PASSWORD
});

// Handle Redis connection events
redisClient.on('error', (err) => console.log('Redis Client Error', err));
redisClient.on('connect', () => console.log('Connected to Redis'));

// No need for manual connect() in ioredis
module.exports = redisClient;
