import * as path from "path";

import { Request, Response, NextFunction } from "express";
import * as rimraf from "rimraf";

import { isString } from "../../utils/utils";
import { default as Application, ApplicationModel, AlgorithmModel } from "../../models/Application";

/**
 * Creates a new application based on name, author and description. The data is validated, saved in mongoDB and returned to the client.
 * @param req Express client request.
 * @param res Express client response.
 * @param next Express NextFunction for error handling.
 */
export async function postCreateApp(req: Request, res: Response, next: NextFunction) {
  const errors: string[] = [];

  if (!isString(req.body.author, 3)) {
    errors.push("`author` must be at least 3 characters long.");
  }

  if (!isString(req.body.name, 3)) {
    errors.push("`name` must be at least 3 characters long.");
  }

  if (!isString(req.body.description) && req.body.description) {
    errors.push("`description` must be a string.");
  }
  else {
    req.body.description = req.body.description || "";
  }

  if (errors.length !== 0) {
    return res.status(400).json({ errors });
  }

  const app = new Application({
    author: req.body.author,
    name: req.body.name,
    description: req.body.description,
    algorithms: []
  });

  try {
    await app.save();
  }
  catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ errors: ["There is already an application with the specified name and author."] });
    }
    return next(err);
  }

  const resApp = app.toObject();
  delete resApp.__v;

  return res.json(resApp);
}

/**
 * Updates an application name, author and description. The data is validated, saved in mongoDB and returned to the client.
 * @param req Express client request.
 * @param res Express client response.
 * @param next Express NextFunction for error handling.
 */
export async function postUpdateApp(req: Request, res: Response, next: NextFunction) {
  const errors: string[] = [];

  if (!isString(req.body.app_id)) {
    errors.push("Failed to cast `app_id` to string.");
  }

  if (!isString(req.body.author, 3)) {
    errors.push("`author` must be at least 3 characters long.");
  }

  if (!isString(req.body.name, 3)) {
    errors.push("`name` must be at least 3 characters long.");
  }

  if (!isString(req.body.description) && req.body.description) {
    errors.push("`description` must be a string.");
  }
  else {
    req.body.description = req.body.description || "";
  }


  if (errors.length !== 0) {
    return res.status(400).json({ errors });
  }

  let existingApp: ApplicationModel;

  try {
    existingApp = <ApplicationModel>(await Application.findOne({ _id: req.body.app_id }));
  }
  catch (err) {
    return next(err);
  }

  if (!existingApp) {
    return res.status(400).json({ errors: ["There is no application with the specified id."] });
  }
  else {
    existingApp.author = req.body.author;
    existingApp.name = req.body.name;
    existingApp.description = req.body.description;

    try {
      await existingApp.save();
    }
    catch (err) {
      if (err.code === 11000) {
        return res.status(400).json({ errors: ["There is already an application with the specified name and author."] });
      }
      return next(err);
    }

    const resApp = existingApp.toObject();
    delete resApp.__v;

    return res.json(resApp);
  }
}

/**
 * Deletes an application based on its ID. The operation is saved in mongoDB and the deleted application is returned to the client.
 * @param req Express client request.
 * @param res Express client response.
 * @param next Express NextFunction for error handling.
 */
export async function postDeleteApp(req: Request, res: Response, next: NextFunction) {
  const errors: string[] = [];

  if (!isString(req.body.app_id)) {
    errors.push("Failed to cast `app_id` to string.");
  }

  if (errors.length !== 0) {
    return res.status(400).json({ errors });
  }

  let existingApp: ApplicationModel;

  try {
    existingApp = <ApplicationModel>(await Application.findOne({ _id: req.body.app_id }));
  }
  catch (err) {
    return next(err);
  }

  if (!existingApp) {
    return res.status(400).json({ errors: ["There is no application with the specified id."] });
  }
  else {
    try {
      const appFolder = path.join(process.cwd(), "uploads", existingApp._id.toString());
      rimraf(appFolder, (err) => {
        if (err) throw err;
      });
      await existingApp.remove();
    }
    catch (err) {
      return next(err);
    }

    const resApp = existingApp.toObject();
    delete resApp.__v;

    return res.json(resApp);
  }
}

/**
 * Creates a new application version (algorithm) in a given application based on its ID. The data is validated, saved in mongoDB and returned to the client.
 * @param req Express client request.
 * @param res Express client response.
 * @param next Express NextFunction for error handling.
 */
export async function postCreatAlgorithm(req: Request, res: Response, next: NextFunction) {
  const errors: string[] = [];

  if (!isString(req.body.app_id)) {
    errors.push("Failed to cast `app_id` to string.");
  }

  if (!isString(req.body.version) || Number.isNaN(req.body.version)) {
    errors.push("Failed to cast `version` to string.");
  }

  if (!isString(req.body.description) && req.body.description) {
    errors.push("Failed to cast `description` to string.");
  }

  if (errors.length !== 0) {
    return res.status(400).json({ errors });
  }

  let existingApp: ApplicationModel;

  try {
    existingApp = <ApplicationModel>(await Application.findOne({ _id: req.body.app_id }));
  }
  catch (err) {
    return next(err);
  }

  const algorithm: AlgorithmModel = {
    version: req.body.version,
    description: req.body.description,
    entryApp: undefined,
    files: [],
    parameters: [],
    output: {}
  };

  if (!existingApp) {
    return res.status(400).json({ errors: ["There is no application with the specified id."] });
  }
  else {
    const existingAlgo = existingApp.algorithms.find((elem) => {
      return elem.version == algorithm.version;
    });

    if (existingAlgo) {
      return res.status(400).json({ errors: ["There is already an algorithm with the specified version."] });
    }
    else {
      existingApp.algorithms.push(algorithm);

      try {
        await existingApp.save();
      }
      catch (err) {
        return next(err);
      }
      const app = existingApp.toObject();
      app.algorithms = [existingApp.algorithms.find((elem) => {
        return elem.version == algorithm.version;
      })];
      delete app.__v;

      return res.json(app);
    }
  }
}

/**
 * Updates an application version (algorithm) basic information in a given application based on its ID. The data is validated, saved in mongoDB and returned to the client.
 * @param req Express client request.
 * @param res Express client response.
 * @param next Express NextFunction for error handling.
 */
export async function postUpdateAlgorithm(req: Request, res: Response, next: NextFunction) {
  const errors: string[] = [];

  if (!isString(req.body.app_id)) {
    errors.push("Failed to cast `app_id` to string.");
  }

  if (!isString(req.body.version_id)) {
    errors.push("Failed to cast `version_id` to string.");
  }

  if (!isString(req.body.version) || Number.isNaN(req.body.version)) {
    errors.push("Failed to cast `version` to string.");
  }

  if (!isString(req.body.description) && req.body.description) {
    errors.push("Failed to cast `description` to string.");
  }

  if (errors.length !== 0) {
    return res.status(400).json({ errors });
  }

  let existingApp: ApplicationModel;

  try {
    existingApp = <ApplicationModel>(await Application.findOne({ _id: req.body.app_id, "algorithms._id": req.body.version_id }));
  }
  catch (err) {
    return next(err);
  }

  if (!existingApp) {
    return res.status(400).json({ errors: ["`app_id` and/or `algorithms.id` are non registered."] });
  }
  else {
    const existingAlgo = existingApp.algorithms.find((elem) => {
      return elem.version == req.body.version && elem._id != req.body.version_id;
    });

    if (existingAlgo) {
      return res.status(400).json({ errors: ["There is already an algorithm with the specified version."] });
    }
    else {
      const algorithm = existingApp.algorithms.find((elem) => {
        return elem._id == req.body.version_id;
      });

      algorithm.description = req.body.description;
      algorithm.version = req.body.version;

      try {
        await existingApp.save();
      }
      catch (err) {
        return next(err);
      }
      const app = existingApp.toObject();
      app.algorithms = [existingApp.algorithms.find((elem) => {
        return elem.version == req.body.version;
      })];
      delete app.__v;

      return res.json(app);
    }
  }
}

/**
 * Delets an application version (algorithm). The operation is saved in mongoDB and the deleted application is returned to the client.
 * @param req Express client request.
 * @param res Express client response.
 * @param next Express NextFunction for error handling.
 */
export async function postDeleteAlgorithm(req: Request, res: Response, next: NextFunction) {
  const errors: string[] = [];

  if (!isString(req.body.app_id)) {
    errors.push("Failed to cast `app_id` to string.");
  }

  if (!isString(req.body.version_id)) {
    errors.push("Failed to cast `version_id` to string.");
  }

  if (errors.length !== 0) {
    return res.status(400).json({ errors });
  }

  let existingApp: ApplicationModel;

  try {
    existingApp = <ApplicationModel>(await Application.findOne({ _id: req.body.app_id }));
  }
  catch (err) {
    return next(err);
  }

  if (!existingApp) {
    return res.status(400).json({ errors: ["There is no application with the specified id."] });
  }
  else {
    const existingAlgo = existingApp.algorithms.find((elem) => {
      return elem._id == req.body.version_id;
    });

    if (!existingAlgo) {
      return res.status(400).json({ errors: ["There is no algorithm with the specified id."] });
    }
    else {
      const i = existingApp.algorithms.indexOf(existingAlgo);
      existingApp.algorithms.splice(i, 1);

      const appFolder = path.join(process.cwd(), "uploads", existingApp._id.toString(), existingAlgo._id.toString());
      rimraf(appFolder, (err) => {
        if (err) throw err;
      });

      try {
        await existingApp.save();
      }
      catch (err) {
        return next(err);
      }
      const app = existingApp.toObject();
      app.algorithms = existingAlgo;
      delete app.__v;

      return res.json(app);
    }
  }
}
