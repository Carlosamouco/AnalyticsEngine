import * as path from "path";

import { Request, Response, NextFunction } from "express";
import * as rimraf from "rimraf";

import { isString, mkdirsSync } from "../../utils/utils";
import { default as Application, ApplicationModel, AlgorithmModel } from "../../models/Application";


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

      const appPath = path.join(process.cwd(), "uploads", app._id.toString(), app.algorithms[0]._id.toString());
      try {
        mkdirsSync(appPath);
      }
      catch (err) {
        return next(err);
      }

      return res.json(app);
    }
  }
}

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
