const dotenv = require("dotenv");
dotenv.config();
const express = require('express');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const mongoose = require("mongoose");
const mainRoute = require("./routes/main");
const contentRoute = require("./routes/content");
const chargeRoute = require("./routes/charge");
const createStreamRoute = require("./routes/createStream");
const app = express();


app.use("/public", express.static(__dirname + "/public"));
app.set("view engine", "ejs");
// Body Parser Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
// Use cookies in project
app.use(cookieParser());
// Set Static Folder
app.use(express.static(`${__dirname}/public`));

console.log('test')

app.use("/", mainRoute);
app.use("/content", contentRoute);
app.use("/charge", chargeRoute);
app.use("/assets/videos/", createStreamRoute);

app.all('*', (req, res) => {
  res.status(404);
  res.render('404');
});


const port = process.env.PORT || 8081;
const start = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URL);
    app.listen(port, () => {
      console.log(`Server started on port ${port}`);
    });
  } catch (e) {
    console.log(e);
  }
};

start();

//---//e