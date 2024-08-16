const redis = require('redis');


const REDIS_HOST = process.env.REDIS_HOST || 'localhost';


const redisClient = redis.createClient({
    url: REDIS_HOST
});

redisClient.on('error', (err) => console.log('Redis Client Error', err));
redisClient.on('connect', () => console.log('Connected to Redis'));
// Connect to Redis
(async () => {
    try {
        await redisClient.connect();
    } catch (err) {
        console.error('Failed to connect to Redis:', err);
    }
})();
module.exports = redisClient;