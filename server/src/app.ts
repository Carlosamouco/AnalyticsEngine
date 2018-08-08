import * as express from "express";
import * as compression from "compression";
import * as bodyParser from "body-parser";
import * as logger from "morgan";
import * as lusca from "lusca";
import * as dotenv from "dotenv";
import * as mongoose from "mongoose";
import * as bluebird from "bluebird";
import { Request, Response, NextFunction } from "express";

import * as routes from "./routes";
import { Sandbox } from "./docker_sandbox/sandbox";
import { Parsers } from "./controllers/parsers";
import * as userControler from "./controllers/user";

process.umask(0);

dotenv.config({ path: ".env.prod" });

const mongoUrl = process.env.MONGOLAB_URI;
(<any>mongoose).Promise = bluebird;

mongoose.connect(mongoUrl).catch(err => {
  console.log("MongoDB connection error. Please make sure MongoDB is running. " + err);
  process.exit();
});

const superUser = process.env.ADMIN_USR.split(":");
userControler.createSuperUser(superUser[0], superUser[1])
  .catch((err) => {
    console.log(err);
  });

Sandbox.getInstance({ poolSize: 1 });

Parsers.getInstance().catch((err) => {
  console.warn("Failed to load some plugins." + err);
});

const app = express();

app.set("port", process.env.PORT || 3000);
app.use(compression());
app.use(logger("dev"));
app.use(bodyParser.json({ limit: "2mb" }));
app.use(bodyParser.urlencoded({ extended: true }));

app.use(lusca.xframe("SAMEORIGIN"));
app.use(lusca.xssProtection(true));

// CORS-ENABLE
app.use((req: Request, res: Response, next: NextFunction) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

// Routes Setup
routes.setup(app);

module.exports = app;
