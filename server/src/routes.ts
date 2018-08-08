import { Express } from "express";
import * as multer from "multer";

import { isAuthorized } from "./utils";
import * as userControler from "./controllers/user";
import * as applicationControler from "./controllers/application";
import * as endpointControler from "./controllers/endpoint";
import * as sandboxControler from "./controllers/sandbox";

/**
 * Sets up all the server routes. Public routes must strat with '/api' because of the NGINX server.
 * @param app  Express app variable.
 */
export function setup(app: Express) {
  const upload = multer({ dest: "./temp/" });

  app.post("/register", sandboxControler.registerContainer);

  app.post("/api/login", userControler.postLogin);
  app.post("/api/register", isAuthorized(true), userControler.postCreateUser);

  app.post("/api/create/app", isAuthorized(), applicationControler.postCreateApp);
  app.post("/api/update/app", isAuthorized(), applicationControler.postUpdateApp);
  app.post("/api/delete/app", isAuthorized(), applicationControler.postDeleteApp);

  app.post("/api/create/algorithm", isAuthorized(), applicationControler.postCreatAlgorithm);
  app.post("/api/update/algorithm", isAuthorized(), applicationControler.postUpdateAlgorithm);
  app.post("/api/delete/algorithm", isAuthorized(), applicationControler.postDeleteAlgorithm);

  app.post("/api/upload", isAuthorized(), upload.array("files"), applicationControler.postUploadFiles);
  app.post("/api/create/parameters", isAuthorized(), applicationControler.postUpdateParameters);
  app.post("/api/create/streams", isAuthorized(), applicationControler.postupdateStreams);
  app.post("/api/create/entry", isAuthorized(), applicationControler.postUpdateEntryApp);
  app.post("/api/create/output", isAuthorized(), applicationControler.postUpdateOutput);

  app.post("/api/invoke", isAuthorized(), applicationControler.invokeAlgorithm);
  app.post("/api/invoke/form", isAuthorized(), upload.array("files"), applicationControler.invokeAlgorithmFormData);

  app.get("/api/applications", applicationControler.getApplications);
  app.get("/api/application/:app_id/:version_id", applicationControler.getApplicationVersion);
  app.get("/api/application/:app_id", applicationControler.getApplication);

  app.post("/api/create/endpoint", isAuthorized(), endpointControler.postCreateEndpoint);
  app.post("/api/create/endpointparams", isAuthorized(), endpointControler.postUpdateEndpointParams);

  app.get("/api/endpoints", endpointControler.getEndpoints);
  app.get("/api/endpoint/:endpoint_id", endpointControler.getEndpoint);

  app.post("/api/delete/endpoint", isAuthorized(), endpointControler.postDeleteEndpoint);
  app.post("/api/update/endpoint", isAuthorized(), endpointControler.postUpdateEndpoint);

  //  app.post("/api/test", applicationControler.testAlgorithm);
}
