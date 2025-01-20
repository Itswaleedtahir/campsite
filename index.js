"use strict";
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/dbConfig"); // Adjust the path as necessary
const Router = require("./routes/index");
const { stripeWebhooks } = require("./controllers/subscriptionCreate");
const upload = require("express-fileupload");
const app = express();
app.use(cors());
app.post("/api/webhook", express.raw({ type: 'application/json' }), stripeWebhooks);
app.use(express.json());
app.use(upload());
app.use("/", Router);
var port = process.env.PORT || 3001;
var env = process.env.NODE_ENV;
const startServer = async () => {
  try {
    await connectDB();
    if (env === "development") {
      console.log("Running in Development");
      app.listen(port, (err) => {
        if (err) console.log("Error starting server:", err);
        console.log(`Server is running on port ${port}`);
      });
    } else {
      console.log("Running in production mode");
      app.listen(port, (err) => {
        if (err) console.log("Error starting server:", err);
        console.log(`Server is running on port ${port}`);
      });
    }
  } catch (err) {
    console.error("Failed to start server", err);
  }
};
startServer();







