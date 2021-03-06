import { Request, Response, NextFunction } from "express";

import { isBool } from "../../utils";
import { default as Application, ApplicationModel } from "../../models/Application";

/**
 * Configures the command that shloud be executed when invoking an application.
 * @param req Express Request.
 * @param res Express Response.
 * @param next Express NextFunction.
 */
export default async function postUpdateEntryApp(req: Request, res: Response, next: NextFunction) {
  const errors: string[] = [];

  if (!req.body.entryApp || !req.body.entryApp.appName) {
    errors.push("`entryApp.appName` not specified.");
  }

  if (!req.body.entryApp || !isBool(req.body.entryApp.localFile) && req.body.entryApp.localFile) {
    errors.push("`entryApp.localFile` must be of type boolean.");
  }
  else {
    req.body.entryApp.localFile = req.body.entryApp.localFile ? (req.body.entryApp.localFile === "true" || req.body.entryApp.localFile === true) : false;
  }

  if (errors.length !== 0) {
    return res.status(400).json({ messages: errors });
  }

  let existingApp: ApplicationModel;

  try {
    existingApp = <ApplicationModel>(await Application.findOne({ _id: req.body.app_id, "algorithms._id": req.body.version_id }));
  }
  catch (err) {
    return next(err);
  }

  if (!existingApp) {
    return res.status(400).json({ messages: ["`app_id` and/or `algorithms.id` are non registered."] });
  }
  else {
    const algorithm = existingApp.algorithms.find((elem) => {
      return elem._id == req.body.version_id;
    });

    const fileIndex = algorithm.files.indexOf(req.body.entryApp.appName);

    if ((fileIndex === -1) && req.body.entryApp.localFile) {
      return res.status(400).json({ messages: [`\`algorithm.entryApp\` (${req.body.entryApp.localFile}) file not found!`] });
    }

    algorithm.entryApp = {
      appName: req.body.entryApp.appName,
      localFile: req.body.entryApp.localFile
    };

    const resObj: any = {};

    try {
      await existingApp.validate();
    }
    catch (err) {
      handleValidationError(err, resObj);
    }

    if (Object.keys(resObj).length !== 0) {
      return res.status(400).json(resObj);
    }

    try {
      await existingApp.save();
    }
    catch (err) {
      return next(err);
    }

    const app = existingApp.toObject();
    app.algorithms = [algorithm];
    delete app.__v;

    return res.json({ app });

  }
}

/**
 * Handles errors detecting during the validation of the application command posted by the client.
 */
function handleValidationError(err: any, res: any) {
  for (const property in err.errors) {
    if (err.errors.hasOwnProperty(property)) {
      const i = property.indexOf("entryApp");
      const key = (i !== -1) ? property.substr(i) : "";
      res[key] = {
        messages: [err.errors[property].message],
        value: err.errors[property].value
      };
    }
  }
}

