module.exports = async (database) => {
    try {
        const { MongoClient } = require("mongodb");
        let URL = '';

        if (process.env.MONGO_PASSWORD !== undefined && process.env.MONGO_PASSWORD !== '' && process.env.MONGO_PASSWORD !== null) {
            URL = `mongodb://:${process.env.MONGO_PASSWORD}@${process.env.MONGO_HOST}:${process.env.MONGO_PORT}`;
        } else {
            URL = `mongodb://${process.env.MONGO_HOST}:${process.env.MONGO_PORT}`;
        }

        // console.log(URL);

        // Connect to the MongoDB
        const client = await MongoClient.connect(URL, { useUnifiedTopology: true });
        const DB = client.db(database);

        return DB;

    } catch (err) {
        console.log(err);
    }

};


