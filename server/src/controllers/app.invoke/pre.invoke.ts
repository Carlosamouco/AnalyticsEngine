import { isString, isNumber } from "util";
import { Request, Response, NextFunction } from "express";
import * as mongoose from "mongoose";

import { AlgorithmModel, ParameterModel, ParameterType, default as Application, File } from "../../models/Application";
import { isBool, isInteger } from "../../utils";
import { InvokeModel, OutputMode } from "./post.invoke";


type Arguments = {
  [key: string]: any
};


function setDefaults(req: InvokeModel) {
  req.options = <any>req.options || {};
  req.options.output = <any>req.options.output || {};

  req.options.output.mode = req.options.output.mode || OutputMode.RawS;
  req.options.output.stderr = req.options.output.stderr || true;
  req.options.output.stdout = req.options.output.stdout || true;
  req.options.secure = req.options.secure || false;
  req.options.timeout = req.options.timeout || 10000;

  req.args = <any>req.args || [];
}

function validateDataTypes(req: InvokeModel) {
  const errors: any = {};

  const output = req.options.output;

  if (!(output.mode in OutputMode)) {
    addError(errors, `\`options.output.mode\` (${output.mode}) out of range.`, "options.output.mode", output.mode);
  }

  if (!isBool(output.stdout)) {
    addError(errors, `Failed to cast \`options.output.stdout\` (${output.stdout}) to boolean.`, "options.output.stdout", output.stdout);
  }
  else {
    output.stdout = (<any>output.stdout.toString() === "true");
  }

  if (!isBool(req.options.secure)) {
    addError(errors, `Failed to cast \`options.secure\` (${req.options.secure}) to boolean.`, "options.secure", req.options.secure);
  }
  else {
    output.stdout = (<any>output.stdout.toString() === "true");
  }

  if (!isBool(output.stderr)) {
    addError(errors, `Failed to cast \`options.output.stderr\` (${output.stderr}) to boolean.`, "options.output.stderr", output.stderr);
  }
  else {
    output.stderr = (<any>output.stderr.toString() === "true");
  }

  if (!isInteger(req.options.timeout)) {
    addError(errors, `Failed to cast \`options.timeout\` (${req.options.timeout}) to integer.`, "options.timeout", req.options.timeout);
  }
  else {
    req.options.timeout = Number(req.options.timeout);
  }

  return errors;
}

function addError(errObj: any, msg: string, key: string, value?: any) {
  if (!errObj[key]) {
    errObj[key] = { messages: [msg], value: value };
  }
  else {
    errObj[key].messages.push(msg);
  }
}

function validateParamConstraints(parameters: ParameterModel[], args: Arguments, files: string[], uploads: Express.Multer.File[]) {
  const errors: any = {};

  for (const arg in args) {
    if (!(args[arg] instanceof Array) && args[arg]) {
      args[arg] = [args[arg]];
    }

    const data = args[arg];

    const param = parameters.find((elem) => {
      return elem.name === arg;
    });

    if (!param) {
      addError(errors, `Invalide arg (${arg}).`, `args`, arg);
    }
    else {
      if (param.options.static) {
        continue;
      }

      if (param.type == ParameterType.File && data) {
        let n = 0;
        data.forEach((file: File | string) => {
          if (!file) {
            return;
          }

          if (isString(file)) {
            if (files.indexOf(file) === -1) {
              addError(errors, `'${file}' file not found`,
                `args.${arg}.${n}`, file);
            }
            n++;
            return;
          }

          file.extention = file.extention || "";
          file.encoding = file.encoding || "utf8";

          if (!file.data && !file.rawData && !file.fileRef) {
            addError(errors, "Missing properties `data`, `rawData` or `fileRef`.", "");
          }

          if (!isString(file.encoding)) {
            addError(errors, `\`encoding\` property must be a string.`, `args.${arg}.${n}.encoding`, file.encoding);
          }

          if (!isString(file.extention)) {
            addError(errors, `\`extention\` property must be a string.`, `args.${arg}.${n}.extention`, file.extention);
          }

          if (!isString(file.rawData) && file.rawData) {
            addError(errors, "`rawData` property must be of type string.", `args.${arg}.${n}.rawData`, file.rawData);
          }

          if (file.fileRef) {
            if (!isString(file.fileRef.name) || !isNumber(file.fileRef.size)) {
              addError(errors, "`name` and/or `size` properties are missing.", `args.${arg}.${n}.fileRef`, file.fileRef);
            }

            if (!uploads) {
              addError(errors, `'${file.fileRef.name}' file not found`, `args.${arg}.${n}`, file);
              return;
            }

            const fUploaded = uploads.find(f => {
              if (f.originalname === file.fileRef.name && f.size === file.fileRef.size) {
                return true;
              }
              return false;
            });

            if (!fUploaded) {
              addError(errors, `'${file.fileRef}' file not found`, `args.${arg}.${n}`, file);
            }
          }

          n++;
        });
      }
    }
  }

  parameters.forEach((param) => {
    if (param.options.required && !args[param.name] && !param.options.default) {
      const msg = `The parameter \`${param.name}\` is required but no default values are available.`;
      errors.messages ? errors.messages.push(msg) : errors.messages = [msg];
    }
  });

  return errors;
}

export async function preInvokeAlgorithm(req: Request, res: Response, next: NextFunction) {
  const call = <InvokeModel>req.body;
  const uploads = <Express.Multer.File[]>req.files;

  setDefaults(call);
  let errors = validateDataTypes(call);

  if (Object.keys(errors).length !== 0) {
    res.status(400).json({ errors });
    return;
  }

  let existingApp: any;

  try {
    existingApp = await Application.aggregate([
      {
        $match: {
          _id: mongoose.Types.ObjectId(call.app_id)
        }
      },
      {
        $unwind: "$algorithms"
      },
      {
        $match: {
          "algorithms._id": mongoose.Types.ObjectId(call.version_id)
        }
      },
    ]);
  }
  catch (err) {
    return next(err);
  }

  if (!existingApp || existingApp.length === 0) {
    res.status(400).json({
      errors: {
        messages: ["Requested application was not found."]
      }
    });
    return;
  }

  const algorithm = <AlgorithmModel>existingApp[0].algorithms;

  errors = validateParamConstraints(algorithm.parameters, call.args, algorithm.files, uploads);

  if (Object.keys(errors).length !== 0) {
    res.status(400).json({ errors });
    return;
  }

  if (!algorithm.entryApp) {
    res.status(400).json({
      errors: {
        messages: ["Requested application is missing an entry app. The application was not properly configured."]
      }
    });
    return;
  }

  return { call, algorithm };
}
