require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
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

app.get('/test', (req, res) => {
  res.send("API working on TEST!")
})

app.listen(PORT, () => { console.log(`Listening to PORT: ${PORT}`)
swaggerDocs(app, PORT)}
);
