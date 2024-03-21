require("dotenv").config();
const cron = require("node-cron");
const express = require("express");
const mongoose = require("mongoose");
const axios = require("axios");
const app = express();
const cors = require("cors");
const PORT = 5000 || process.env.PORT;
const MongoURI = process.env.MONGO_URI;
const BusinessWireRoute = require("./Routes/BusinessWireRoute");
const PRNewsWireRoute = require("./Routes/PRNewsWireRoute");
const NewsFilesRoute = require("./Routes/NewsFileRoute");
const GlobeNewsWireRoute = require("./Routes/GlobeNewsWireRoute");
const AccessWireRoute = require("./Routes/AccessWireRoute");
const NewFirmWireRoute = require("./Routes/NewFirmWireRoute");
const AuthRoute = require("./Routes/AuthRoute");

// Install node-cron package and then use it.

// Import Controllers
const accessWire = require("./controllers/accesswire.controller.js");
const businessWire = require("./controllers/bussinesswire.controller.js");
const globenewswire = require("./controllers/globenewswire.controller.js");
const newsfilewire = require("./controllers/newsfile.controller.js");
const prnewswire = require("./controllers/prnewswire.controller.js");

const swaggerDocs = require("./swagger.js");


app.use(cors());
app.use(express.json());

// News Routes

BusinessWireRoute(app);
PRNewsWireRoute(app);
NewsFilesRoute(app);
GlobeNewsWireRoute(app);
AccessWireRoute(app);
NewFirmWireRoute(app);
AuthRoute(app);

// Database connection
const connection = mongoose.connect(MongoURI);
connection
  .then(() => {
    console.log("Database connected");
  })
  .catch((error) => {
    console.log("Database not connected!", error);
  });

// Database connection Ends

app.get("/test", (req, res) => {
  res.send("API working on TEST!");
});

// Cron job for every 20 minutes

cron.schedule("*/20 * * * *", () => {
  axios.get('https://cuddly-octo-fiesta.onrender.com/api/business-wire');
  axios.get('https://cuddly-octo-fiesta.onrender.com/api/access-wire');
  axios.get('https://cuddly-octo-fiesta.onrender.com/api/globe-news-wire');
  axios.get('https://cuddly-octo-fiesta.onrender.com/api/pr-news-wire');
  axios.get('https://cuddly-octo-fiesta.onrender.com/api/news-files');
})

app.listen(PORT, () => {
  console.log(`Listening to PORT: ${PORT}`);
  swaggerDocs(app, PORT);
});
