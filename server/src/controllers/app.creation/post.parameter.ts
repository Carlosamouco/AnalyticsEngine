import { Request, Response, NextFunction } from "express";

import { isBool, isInteger, isString } from "../../utils";
import { default as Application, ApplicationModel, ParameterModel, ParameterType, File } from "../../models/Application";

export default async function postUpdateParameters(req: Request, res: Response, next: NextFunction) {
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

    algorithm.parameters = [];
    req.body.parameters = req.body.parameters ? req.body.parameters : [];

    if (req.body.parameters instanceof Array) {
      const errors: any[] = [];
      let pos: number = 0;

      req.body.parameters.forEach((parameter: ParameterModel) => {
        paramSetDefaults(parameter, pos++);
        algorithm.parameters.push(parameter);
      });

      const resObj: any = {};

      try {
        await existingApp.validate();
      }
      catch (err) {
        handleValidationError(err, resObj);
      }

      checkParamConstraints(algorithm.parameters, resObj, algorithm.files);

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
}

function paramSetDefaults(parameter: ParameterModel, pos: number) {
  parameter.type = parameter.type == undefined ? ParameterType.Primitive : parameter.type;
  parameter.position = pos;
  parameter.options = <any>parameter.options || {};
  parameter.options.static = parameter.options.static || false;
  parameter.options.required = parameter.options.required || false;
}

function handleValidationError(err: any, res: any) {
  for (const property in err.errors) {
    if (err.errors.hasOwnProperty(property)) {
      const i = property.indexOf("parameters");
      const key = (i !== -1) ? property.substr(i) : "";
      res[key] = {
        messages: [err.errors[property].message],
        value: err.errors[property].value
      };
    }
  }
}


function checkParamConstraints(params: ParameterModel[], res: any, files?: string[]) {
  for (let i = 0; i < params.length; i++) {
    const err = validateParamConstraints(params[i], files);

    for (const property in err) {
      if (err.hasOwnProperty(property)) {
        const index = `parameters.${i}${property !== "" ? "." + property : property}`;
        res[index] = res[index] || { messages: [], value: err[property].value };
        res[index].messages = res[index].messages.concat(err[property].messages);
      }
    }
  }
}

function validateParamConstraints(param: ParameterModel, files?: string[]) {
  const errors: any = { "": { messages: [], value: param } };


  if (!param.flag && param.options.static && (!param.options.default || param.options.default === "")) {
    errors[""].messages.push(`Static parameters can not be void. \`options.default\` is required.`);
  }

  if (errors[""].messages.length === 0) {
    delete errors[""];
  }

  if (files && param.type == ParameterType.File && param.options.default && files.indexOf(param.options.default) === -1) {
    errors[`param.options.default`] = { messages: [`Path \`param.options.default\` (${param.options.default}) not found in the uploaded files.`], value: param.options.default };
  }

  return errors;
}
