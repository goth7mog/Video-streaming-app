// module.exports = async (database) => {
//     try {
//         const { MongoClient } = require("mongodb");
//         let URL = '';

//         if (process.env.MONGO_PASSWORD !== undefined && process.env.MONGO_PASSWORD !== '' && process.env.MONGO_PASSWORD !== null) {
//             URL = `mongodb://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@${process.env.MONGO_HOST}:${process.env.MONGO_PORT}`;
//         } else {
//             URL = `mongodb://${process.env.MONGO_HOST}:${process.env.MONGO_PORT}`;
//         }

//         // console.log(URL);

//         // Connect to the MongoDB
//         const client = await MongoClient.connect(URL, { useUnifiedTopology: true });
//         const DB = client.db(database);

//         return DB;

//     } catch (err) {
//         console.log(err);
//     }

// };


module.exports = async (database) => {
    try {
        const { MongoClient, ServerApiVersion } = require("mongodb");
        let URL = '';

        if (process.env.MONGO_PASSWORD !== undefined && process.env.MONGO_PASSWORD !== '' && process.env.MONGO_PASSWORD !== null) {
            // URL = `mongodb://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@${process.env.MONGO_HOST}:${process.env.MONGO_PORT}`;
            URL = `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@${process.env.MONGO_HOST}/?retryWrites=true&w=majority`;
        } else {
            URL = `mongodb://${process.env.MONGO_HOST}:${process.env.MONGO_PORT}`;
        }

        // console.log(URL);

        // Connect to the MongoDB
        const client = await MongoClient.connect(URL, {
            useUnifiedTopology: true,
            serverApi: {
                version: ServerApiVersion.v1,
                strict: true,
                deprecationErrors: true,
            }
        });

        const DB = client.db(database);

        // Send a ping to confirm a successful connection
        await DB.command({ ping: 1 });

        return DB;

    } catch (err) {
        console.log(err);
    }

};