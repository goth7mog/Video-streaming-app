const Redis = require('ioredis');

module.exports = async () => {
    try {
        const host = process.env.REDIS_HOST || '127.0.0.1';
        const port = process.env.REDIS_PORT || 6379;
        const password = process.env.REDIS_PASSWORD;

        const options = { host, port };
        
        if (password) options.password = password;

    const redis = new Redis(options);
    await redis.ping();
    return redis;
    } catch (err) {
        // console.error('Failed to connect to Redis:', err);
        throw err;
    }
};
