const redis = require('redis');

const redisClient = redis.createClient({
    url: process.env.REDIS_HOST_SEQUEL,
    password: process.env.REDIS_PASSWORD
});

redisClient.on('error', (err) => console.log('Redis Client Error', err));
redisClient.on('connect', () => console.log('Connected to Redis'));

// Connect the client
(async () => {
    try {
        await redisClient.connect();
        console.log('Redis connected');
    } catch (err) {
        console.error('Failed to connect to Redis:', err);
    }
})();

module.exports = redisClient;
