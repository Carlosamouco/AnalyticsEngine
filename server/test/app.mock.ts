import * as express from "express";
import * as bodyParser from "body-parser";

import * as routes from "../src/routes";

// Create Express server
const app = express();

// Express configuration
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Routes Setup
routes.setup(app);

module.exports = app;
