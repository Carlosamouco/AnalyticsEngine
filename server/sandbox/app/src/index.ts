import * as express from "express";
import * as bodyParser from "body-parser";
import * as multer from "multer";


import * as console from "./logger";
import { invokeAlgorithm } from "./controllers/app.run/app.runner";
import { registerWorker } from "./init";

// Create Express server
const app = express();

// Express configuration
app.set("port", process.env.PORT || 3000);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Routes Setup
const upload = multer({ dest: "./temp/" });

app.post("/", upload.array("files"), invokeAlgorithm);

registerWorker();

const server = app.listen(app.get("port"), () => {
  console.log(("  App is running at http://localhost:%d in %s mode"), app.get("port"), app.get("env"));
  console.log("  Press CTRL-C to stop\n");
});

export = server;
