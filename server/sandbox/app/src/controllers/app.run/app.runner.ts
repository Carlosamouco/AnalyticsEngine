import * as path from "path";
import * as fs from "fs";

import * as archiver from "archiver";
import { Request, Response, NextFunction } from "express";

import { default as Spawn } from "./spawn";

export async function invokeAlgorithm(req: Request, res: Response, next: NextFunction) {
  const call = req.body;

  const outDir = path.join(process.cwd(), "temp", "output");
  const outFDir = path.join(outDir, "files");

  const mapping = JSON.parse(call.mapping);
  const args: string[] = JSON.parse(call.args);

  for (const property in mapping) {
    if (property === "outputDir") {
      args[mapping[property]] = outFDir;
    }
    else {
      for (const file of (<Express.Multer.File[]>req.files)) {
        if (property === file.originalname) {
          args[mapping[property]] = path.join(process.cwd(), "temp", file.filename);
        }
      }
    }
  }

  const child = new Spawn(call.command, args, {
    cwd: path.join(process.cwd(), call.cwd),
    detached: true
  });

  const stdout = fs.createWriteStream(path.join(outDir, "stdout"));
  const stderr = fs.createWriteStream(path.join(outDir, "stderr"));
  const error = fs.createWriteStream(path.join(outDir, "error"));

  child.child.stderr.on("data", (data) => {
    stderr.write(data);
  });

  child.child.stdout.on("data", (data) => {
    stdout.write(data);
  });

  child.runChild
    .then((code) => {
      closeStreams([stdout, stderr, error]);
      archiveData(outDir, code, res, next);
    })
    .catch((err) => {
      error.write(err.toString());
      closeStreams([stdout, stderr, error]);
      archiveData(outDir, null, res, next);
    });
}

function closeStreams(streams: fs.WriteStream[]) {
  streams.forEach((stream) => {
    stream.close();
  });
}

function archiveData(outDir: string, code: string, res: Response, next: NextFunction) {
  const archiveDir = path.join(process.cwd(), "temp", "output.zip");
  const output = fs.createWriteStream(archiveDir);
  const archive = archiver("zip");

  archive.pipe(output);
  archive.directory(outDir, false);
  archive.finalize();

  output.on("close", () => {
    res.setHeader("exit-code", code);
    res.sendFile(archiveDir);
  });

  archive.on("error", (err) => {
    return next(err);
  });
}
