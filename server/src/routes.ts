import { Express } from "express";
import * as multer from "multer";

// Controllers (route handlers)
import * as applicationControler from "./controllers/application";
import * as endpointControler from "./controllers/endpoint";
import * as sandboxControler from "./controllers/sandbox";

export function setup(app: Express) {
  const upload = multer({ dest: "./temp/" });

  app.post("/register", sandboxControler.registerContainer);

  app.post("/api/create/app", applicationControler.postCreateApp);
  app.post("/api/update/app", applicationControler.postUpdateApp);
  app.post("/api/delete/app", applicationControler.postDeleteApp);

  app.post("/api/create/algorithm", applicationControler.postCreatAlgorithm);
  app.post("/api/update/algorithm", applicationControler.postUpdateAlgorithm);
  app.post("/api/delete/algorithm", applicationControler.postDeleteAlgorithm);

  app.post("/api/upload", upload.array("files"), applicationControler.postUploadFiles);
  app.post("/api/create/parameters", applicationControler.postUpdateParameters);
  app.post("/api/create/streams", applicationControler.postupdateStreams);
  app.post("/api/create/entry", applicationControler.postUpdateEntryApp);
  app.post("/api/create/output", applicationControler.postUpdateOutput);

  app.post("/api/invoke/", applicationControler.invokeAlgorithm);
  app.post("/api/invoke/form",  upload.array("files"), applicationControler.invokeAlgorithmFormData);

  app.get("/api/applications", applicationControler.getApplications);
  app.get("/api/application/:app_id/:version_id", applicationControler.getApplicationVersion);
  app.get("/api/application/:app_id", applicationControler.getApplication);

  app.post("/api/create/endpoint", endpointControler.postCreateEndpoint);
  app.post("/api/create/endpointparams", endpointControler.postUpdateEndpointParams);

  app.get("/api/endpoints", endpointControler.getEndpoints);
  app.get("/api/endpoint/:endpoint_id", endpointControler.getEndpoint);

  app.post("/api/delete/endpoint", endpointControler.postDeleteEndpoint);
  app.post("/api/update/endpoint", endpointControler.postUpdateEndpoint);
}
