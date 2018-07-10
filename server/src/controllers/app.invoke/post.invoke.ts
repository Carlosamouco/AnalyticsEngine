import { Request, Response, NextFunction } from "express";
import { PipeRawOutput, PipeParsedOutput } from "./pipe.raw";
import { ExecApp, ProcessOutput } from "./exec.app";
import { preInvokeAlgorithm } from "./pre.invoke";

import * as mongoose from "mongoose";
import { AlgorithmModel, default as Application } from "../../models/Application";

type Arguments = {
  [key: string]: any
};

export type InvokeModel = {
  app_id: string,
  version_id: string,
  args: Arguments,
  options: InvokeOptions
};

type InvokeOptions = {
  timeout: number,
  secure: boolean,
  output: {
    mode: string,
    stderr: boolean,
    stdout: boolean,
    files: boolean
  }
};

export enum OutputMode {
  Raw,
  Parsed,
  RawS = "0",
  ParsedS = "1"
}

export async function invokeAlgorithmFormData(req: Request, res: Response, next: NextFunction) {
  req.body.args = JSON.parse(req.body.args);
  req.body.options = JSON.parse(req.body.options);

  invokeAlgorithm(req, res, next);
}

export async function testAlgorithm(req: Request, res: Response, next: NextFunction) {
  let existingApp: any;
  const appId = req.body.app_id ? req.body.app_id : "5b2e95acd6e1df02393fe08a";
  const algorithmId = req.body.version_id ? req.body.version_id : "5b2e95b3d6e1df02393fe08b";
  const repNumb = req.body.num ? req.body.num : 1;
  const mode = req.body.mode ? req.body.mode : "0";

  try {
    existingApp = await Application.aggregate([
      {
        $match: {
          _id: mongoose.Types.ObjectId(appId)
        }
      },
      {
        $unwind: "$algorithms"
      },
      {
        $match: {
          "algorithms._id": mongoose.Types.ObjectId(algorithmId)
        }
      },
    ]);
  }
  catch (err) {
    next(err);
  }
  res.json({ status: "started" });
  const promises = [];
  const times: number[] = [];
  for (let i = 0; i < repNumb; i++) {
    promises.push(new Promise((resolve, reject) => {
      const start = new Date().getTime();
      const app = new ExecApp(appId, existingApp[0].algorithms, []);
      app.compileArgs({})
        .then(() => {
          if (mode === "0") {
            app.spawnProcess(60000)
            .then(() => {
              times.push(new Date().getTime() - start);
              app.deleteTempFiles();
              resolve();
            });
          }
          else {
            app.spawnRemoteProcess(60000)
            .then(() => {
              times.push(new Date().getTime() - start);
              app.deleteTempFiles();
              resolve();
            });
          }
        });
    }));
  }

  const average = (arr: number[]) => arr.reduce((p, c) => p + c, 0) / arr.length;

  Promise.all(promises).then(() => {
    console.log(average(times));
  });
}



export async function invokeAlgorithm(req: Request, res: Response, next: NextFunction) {
  const data = await preInvokeAlgorithm(req, res, next);

  if (!data) {
    return;
  }

  const app = new ExecApp(data.call.app_id, data.algorithm, <Express.Multer.File[]>req.files);

  let processOutput: ProcessOutput;

  try {
    await app.compileArgs(data.call.args);
    if (!data.call.options.secure) {
      processOutput = <ProcessOutput>await app.spawnProcess(data.call.options.timeout);
    }
    else {
      processOutput = <ProcessOutput>await app.spawnRemoteProcess(data.call.options.timeout);
    }
  }
  catch (err) {
    return res.json({ "Fatal Error": err.toString() });
  }

  switch (data.call.options.output.mode) {
    case OutputMode.Parsed: case OutputMode.ParsedS:
      await new PipeParsedOutput(res).initOutput(data.call.options.output, processOutput, data.algorithm.output);
      break;
    case OutputMode.Raw: case OutputMode.RawS: default:
      await new PipeRawOutput(res).initOutput(data.call.options.output, processOutput, data.algorithm.output);
      break;
  }

  app.deleteTempFiles();
}

