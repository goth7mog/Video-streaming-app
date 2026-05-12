const dotenv = require("dotenv");
dotenv.config();
const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const expressSession = require("express-session");
const MemoryStore = require('memorystore')(expressSession);
const cookieParser = require('cookie-parser');
const flash = require('connect-flash');
const MongoStore = require('connect-mongo')(expressSession);
const { RedisStore } = require('connect-redis');
const dayjs = require('dayjs');
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
const utc = require('dayjs/plugin/utc')
const timezone = require('dayjs/plugin/timezone')
dayjs.extend(utc);
dayjs.extend(timezone);
global.dayjs = dayjs;


console.log(RedisStore);
console.log('Hi');

const port = process.env.PORT || 8080;

<<<<<<< HEAD


/* 'TRUST PROXY', TRUE is only needed if I use any of these in my app: req.protocol, req.secure, req.ip, req.hostname give that my app is behind a proxy */
// app.set('trust proxy', true); // If I set this to true, I need to understand that my app should be not accesible directly, but only via a proxy (Nginx). Otherwise it's a great security concern.




=======
>>>>>>> 58e5b13 (another docker-compose is only for image testing now)
// Create Global Directory to use throughout the app
const path = require('path');
global.approute = path.resolve(__dirname);

<<<<<<< HEAD

=======
>>>>>>> 58e5b13 (another docker-compose is only for image testing now)
app.use(bodyParser.json({ limit: "10000mb" }));
app.use(bodyParser.urlencoded({ extended: true, limit: "10000mb", parameterLimit: 1000000 }));

app.use(cookieParser());


app.use("/public", express.static(global.approute + "/public"));
app.set("view engine", "ejs");



// Assign Mongo connection
const connectMongo = async () => {
	try {
		const createMongoDB = require(global.approute + '/connect-db/mongo_client.js');

		/* Creating a connection. 
		And assigning the database to the global variable */
		global.database = await createMongoDB(process.env.MONGO_DATABASE);

		console.log('MongoDB connection is running');
	} catch (err) {
		console.log(err);
	}

}

const connectRedis = async () => {
	try {
		const createRedisClient = require(global.approute + '/connect-db/redis_client.js');

		/* Creating a connection. 
		And assigning the database to the global variable */
		global.redisClient = await createRedisClient();

		console.log('Redis connection is running');
	} catch (err) {
		console.log(err);
	}
}

const siteRouter = require(global.approute + "/router/siteRouter.js");
const adminRouter = require(global.approute + "/router/adminRouter.js");






app.on('ready', () => {
	// Start the server only when the app is ready
	const host = process.env.HOST;
	app.listen(port, host, () => {
		console.log(`server is running on port ${port}`);
		console.log('NODE_ENV =', process.env.NODE_ENV);
		console.log('MONGO_HOST =', process.env.MONGO_HOST);
	});
});



const startup = async () => {
	try {
		await connectMongo();
		await connectRedis();

		const sessionOptions = {
			cookie: {
				maxAge: 86400000,
				httpOnly: true,
				secure: process.env.NODE_ENV === 'production' ? true : false, // auto-enabled in production
				sameSite: 'lax'      // blocks CSRF
			},
			store: new RedisStore({
				client: global.redisClient,
				ttl: 24 * 60 * 60 // 24 hours
			}),
			key: process.env.EXPRESS_SESSION_KEY,
			secret: process.env.EXPRESS_SESSION_SECRET,
			resave: true,
			saveUninitialized: true
		};
		app.use(expressSession(sessionOptions));
		app.use(flash());

		app.use("/", siteRouter);
		app.use("/admin", adminRouter);



		app.get('/app/info', (req, res) => {
			res.json({
				code: 1,
				message: `${process.env.npm_package_name} is running`,
				data: {
					NAME: process.env.npm_package_name,
					VERSION: process.env.npm_package_version,
					NODE_ENV: process.env.NODE_ENV,
					MONGO_HOST: process.env.MONGO_HOST,
					// MONGO_PORT: process.env.MONGO_PORT,
				},
				error: null
			});
		});

		app.emit('ready');

	} catch (err) {
		console.log(err);
	}
}



//----------------------------RUN APP------------------------------//
startup();

