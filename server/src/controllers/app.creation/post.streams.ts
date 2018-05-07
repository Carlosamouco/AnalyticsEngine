import { Request, Response, NextFunction } from "express";
import { isArray, isString } from "util";

import { default as Application, ApplicationModel, ParameterModel, ParameterType, OutputModel } from "../../models/Application";


export default async function postCreateStreams(req: Request, res: Response, next: NextFunction) {
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

  const algorithm = existingApp.algorithms.find((elem) => {
    return elem._id == req.body.version_id;
  });

  algorithm.output.stderr = req.body.stderr;
  algorithm.output.stdout = req.body.stdout;

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

function handleValidationError(err: any, res: any) {
  for (const property in err.errors) {
    if (err.errors.hasOwnProperty(property)) {
      const i = property.indexOf("output");
      const key = (i !== -1) ? property.substr(i) : "";
      res[key] = {
        messages: [err.errors[property].message],
        value: err.errors[property].value
      };
    }
  }
}
