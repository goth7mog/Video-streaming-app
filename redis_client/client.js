module.exports = async () => {
    try {
        const { Client } = require('redis-om');
        let url = '';

        // Connect to Redis
        if (process.env.REDIS_PASSWORD !== undefined && process.env.REDIS_PASSWORD !== '' && process.env.REDIS_PASSWORD !== null) {
            url = `redis://:${process.env.REDIS_PASSWORD}@${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`;
        } else {
            url = `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`;
        }

        // Asign url to global variable
        global.redisUrl = url;

        const client = await new Client().open(url);

        return client;

    } catch (err) {
        console.log(err);
    }

};


