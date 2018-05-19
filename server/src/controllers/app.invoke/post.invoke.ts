import { Request, Response, NextFunction } from "express";
import * as fs from "fs";
import * as path from "path";

import * as uuid from "uuid/v4";

import { default as Spawn } from "./spawn";
import { PipeRawOutput, PipeParsedOutput } from "./pipe.raw";
import { ExecApp, ProcessOutput } from "./exec.app";
import { preInvokeAlgorithm } from "./pre.invoke";
import { AlgorithmModel } from "../../models/Application";

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


/*
  TODO:
    1.  File parsing is missing (input and output)
    2.  Cach calls (save output to file)
*/

export async function invokeAlgorithm(req: Request, res: Response, next: NextFunction) {
  let data;

  data = await preInvokeAlgorithm(req, res, next);

  if (!data) {
    return;
  }

  const app = new ExecApp(data.call.app_id, data.algorithm);

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
    return res.json({ "Fatal Error": err });
  }

  switch (data.call.options.output.mode) {
    case OutputMode.Parsed: case OutputMode.ParsedS:
      new PipeParsedOutput(res).initOutput(data.call.options.output, processOutput, data.algorithm.output);
      break;
    case OutputMode.Raw: case OutputMode.RawS: default:
      new PipeRawOutput(res).initOutput(data.call.options.output, processOutput, data.algorithm.output);
      break;
  }
}

