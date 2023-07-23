const dotenv = require("dotenv");
dotenv.config();
const express = require('express');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
// const cors = require('cors');


// Create Global Directory to use throughout app
const path = require('path');
global.approute = path.resolve(__dirname);


// Create an Express app
const app = new express();

const port = process.env.PORT || 8080;

app.use("/public", express.static(global.approute + "/public"));
app.set("view engine", "ejs");
// app.use(cors());

// Body Parser Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// Use cookies in the project
app.use(cookieParser());

// Set Static Folder
app.use(express.static(`${global.approute}/public`));



// Assign Redis connection
const connectRedis = async () => {
  try {
      const Client = require(global.approute + '/redis_client/client.js');
      global.client = await Client();

      console.log('Redis connection is running');
  } catch (err) {
      console.log(err);
  }

}


// Import Routes
const mainRoute = require(global.approute + "/routes/main.js");
const contentRoute = require(global.approute + "/routes/content.js");
const chargeRoute = require(global.approute + "/routes/charge.js");
const createStreamRoute = require(global.approute + "/routes/createStream.js");
const contentAPIRoute = require(global.approute + "/routes/interface/contentAPI.js");


// Use Routes
app.use("/", mainRoute);
app.use("/content", contentRoute);
app.use("/charge", chargeRoute);
app.use("/assets/videos/", createStreamRoute);

//API
app.use("/api/content", contentAPIRoute);



app.get('/app/info', (req, res) => {
  // console.log(req.headers.authorization)
  res.json({
      code: 1,
      message: `${process.env.npm_package_name} is running`,
      data: {
          NAME: process.env.npm_package_name,
          VERSION: process.env.npm_package_version,
          NODE_ENV: process.env.NODE_ENV,
          REDIS_HOST: process.env.REDIS_HOST,
          REDIS_PORT: process.env.REDIS_PORT,
      },
      error: null
  });
});

app.all('*', (req, res) => {
  res.status(404);
  res.render('404');
});



app.on('ready', () => {
  // Start the server only when the app is ready
  app.listen(port, () => {
      console.log('server is running  on port ' + port);
      console.log('VERSION', process.env.npm_package_version);
      console.log('NODE_ENV =', process.env.NODE_ENV);
      console.log('REDIS_HOST =', process.env.REDIS_HOST);
      console.log('REDIS_PORT =', process.env.REDIS_PORT);
  });

});



const startup = async () => {
  try {
      await connectRedis();

      app.emit('ready');
  } catch (err) {
      console.log(err);
  }
}


//----------------------------RUN APP------------------------------//
startup();