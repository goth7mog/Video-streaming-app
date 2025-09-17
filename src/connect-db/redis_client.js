const { createClient } = require('redis');

module.exports = async () => {
    try {
        const host = process.env.REDIS_HOST || 'redis';
        const port = process.env.REDIS_PORT || 6379;
        const password = process.env.REDIS_PASSWORD;

        const url = password
            ? `redis://:${password}@${host}:${port}`
            : `redis://${host}:${port}`;

        console.log('[Redis Debug] Connecting to Redis with url:', url);
        const client = createClient({ url });

        client.on('connect', () => {
            console.log('[Redis Debug] node-redis client connected');
        });
        client.on('ready', () => {
            console.log('[Redis Debug] node-redis client ready');
        });
        client.on('error', (err) => {
            console.error('[Redis Debug] node-redis client error:', err);
        });
        client.on('end', () => {
            console.log('[Redis Debug] node-redis connection closed');
        });
        client.on('reconnecting', () => {
            console.log('[Redis Debug] node-redis client reconnecting');
        });

        await client.connect();
        return client;
    } catch (err) {
        console.error('[Redis Debug] Failed to connect to Redis:', err);
        throw err;
    }
};
