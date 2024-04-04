const dotenv = require("dotenv");
dotenv.config();
const express = require("express");
const app = express();
// // const http = require("http").createServer(app);
// // const socketIO = require("socket.io")(http);
// const formidable = require("formidable");
// const fileSystem = require("fs");
// // const mongoClient = require("mongodb").MongoClient;
// const ObjectId = require("mongodb").ObjectId;
const bodyParser = require("body-parser");
const expressSession = require("express-session");
const cookieParser = require('cookie-parser');
const flash = require('connect-flash');
// const bcrypt = require("bcryptjs");
// const { getVideoDurationInSeconds } = require('get-video-duration');
const dayjs = require('dayjs');
const customParseFormat = require('dayjs/plugin/customParseFormat')
dayjs.extend(customParseFormat)
const utc = require('dayjs/plugin/utc')
const timezone = require('dayjs/plugin/timezone')
dayjs.extend(utc);
dayjs.extend(timezone);
// dayjs.tz.setDefault("America/Panama");
global.dayjs = dayjs;

// const some = global.dayjs.tz(`${userAppointmentDate} ${userAppointmentTime}`, "America/Panama").valueOf();

// console.log(some.valueOf(),);


const port = process.env.PORT || 4300;

// Create Global Directory to use throughout the app
const path = require('path');
global.approute = path.resolve(__dirname);

// const _KEYS = require(global.approute + '/config/keys');
// const { verifyToken } = require(global.approute + "/middleware/verifyToken");

// const nodemailer = require("nodemailer");

// const mainURL = `http://localhost:${port}`;

app.use(bodyParser.json({ limit: "10000mb" }));
app.use(bodyParser.urlencoded({ extended: true, limit: "10000mb", parameterLimit: 1000000 }));

app.use(cookieParser());
app.use(expressSession({
	"key": process.env.EXPRESS_SESSION_KEY,
	"secret": process.env.EXPRESS_SESSION_SECRET,
	"resave": true,
	"saveUninitialized": true
}));
app.use(flash());

app.use("/public", express.static(global.approute + "/public"));
app.set("view engine", "ejs");

// let database = null;

// function getUser(userId, callBack) {
// 	global.database.collection("users").findOne({
// 		"_id": ObjectId(userId)
// 	}, function (error, result) {
// 		if (error) {
// 			console.log(error);
// 			return;
// 		}
// 		if (callBack != null) {
// 			callBack(result);
// 		}
// 	});
// }

// Assign Mongo connection
const connectMongo = async () => {
	try {
		const createMongoDB = require(global.approute + '/mongo_client/client.js');

		/* Creating a connection. 
		And assigning the database to the global variable */
		global.database = await createMongoDB(process.env.MONGO_DATABASE);

		console.log('MongoDB connection is running');
	} catch (err) {
		console.log(err);
	}

}

const siteRouter = require(global.approute + "/router/siteRouter.js");
const adminRouter = require(global.approute + "/router/adminRouter.js");

// Import Routes
// const mainRoute = require(global.approute + "/routes/admin/main.js");
// const registerRoute = require(global.approute + "/routes/register.js");
// const loginRoute = require(global.approute + "/routes/login.js");
// const createStreamRoute = require(global.approute + "/routes/createStream.js");
// const chargeRoute = require(global.approute + "/routes/charge.js");

app.use("/", siteRouter);
app.use("/admin", adminRouter);
// app.use("/register", registerRoute);
// app.use("/login", loginRoute);
// app.use("/charge", chargeRoute);
// app.use("/assets/videos/", createStreamRoute);





app.get('/app/info', (req, res) => {
	// console.log(req.headers.authorization)
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

app.on('ready', () => {
	// Start the server only when the app is ready
	app.listen(port, () => {
		console.log('server is running  on port ' + port);
		console.log('NODE_ENV =', process.env.NODE_ENV);
		console.log('MONGO_HOST =', process.env.MONGO_HOST);
		console.log('MONGO_PORT =', process.env.MONGO_PORT);
	});
});


const startup = async () => {
	try {
		await connectMongo();

		// console.log("Hi")

		app.emit('ready');

	} catch (err) {
		console.log(err);
	}
}

// process.on('SIGTERM', process.exit);
// process.on('SIGINT', process.exit);


//----------------------------RUN APP------------------------------//
startup();

