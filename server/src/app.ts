import * as express from "express";
import * as compression from "compression";  // compresses requests
import * as session from "express-session";
import * as bodyParser from "body-parser";
import * as logger from "morgan";
import * as lusca from "lusca";
import * as dotenv from "dotenv";
import * as mongo from "connect-mongo";
import * as mongoose from "mongoose";
import * as passport from "passport";
import * as bluebird from "bluebird";
import * as fs from "fs";
import * as path from "path";

import * as routes from "./routes";
import { Sandbox } from "./docker_sandbox/sandbox";
import { Parsers } from "./controllers/parsers";

process.umask(0);

dotenv.config({ path: ".env.example" });

// Connect to MongoDB
const mongoUrl = process.env.MONGOLAB_URI;
(<any>mongoose).Promise = bluebird;

mongoose.connect(mongoUrl).catch(err => {
  console.log("MongoDB connection error. Please make sure MongoDB is running. " + err);
  process.exit();
});

const MongoStore = mongo(session);

Sandbox.getInstance({ poolSize: 1 });
Parsers.getInstance().catch((err) => {
  console.warn("Failed to load some plugins." + err);
});

fs.mkdir(path.join(process.cwd(), "uploads"), (err) => {
  if (err && err.code !== "EEXIST") {
    console.log(err);
    process.exit();
  }

  fs.chmod(path.join(process.cwd(), "uploads"), 0o777, (err) => {
    if (err) {
      console.log(err);
      process.exit();
    }
  });
});

// Create Express server
const app = express();

// Express configuration
app.set("port", process.env.PORT || 3000);
app.use(compression());
app.use(logger("dev"));
app.use(bodyParser.json({ limit: "2mb" }));
app.use(bodyParser.urlencoded({ extended: true }));

app.use(session({
  resave: true,
  saveUninitialized: true,
  secret: process.env.SESSION_SECRET,
  store: new MongoStore({
    url: mongoUrl,
    autoReconnect: true
  })
}));

app.use(passport.initialize());
app.use(passport.session());
app.use(lusca.xframe("SAMEORIGIN"));
app.use(lusca.xssProtection(true));

// Routes Setup
routes.setup(app);

module.exports = app;
