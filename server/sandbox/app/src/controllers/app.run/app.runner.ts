import * as path from "path";
import * as fs from "fs";

import * as archiver from "archiver";
import * as tar from "tar-fs";
import { Request, Response, NextFunction } from "express";

import { default as Spawn } from "./spawn";

export async function invokeAlgorithm(req: Request, res: Response, next: NextFunction) {

  const outDir = path.join(process.cwd(), "temp", "output");
  const outFDir = path.join(outDir, "files");

  const stdout = fs.createWriteStream(path.join(outDir, "stdout"));
  const stderr = fs.createWriteStream(path.join(outDir, "stderr"));
  const error = fs.createWriteStream(path.join(outDir, "error"));

  const call = req.body;

  const mapping = JSON.parse(call.mapping);
  const args: string[] = JSON.parse(call.args);

  for (const property in mapping) {
    if (mapping[property] === -1 && call.cwd) {
      call.command = path.join(call.cwd, property);
    }
    else if (property === "outputDir") {
      args[mapping[property]] = outFDir;
    }
    else {
      for (const file of (<{ [fieldname: string]: Express.Multer.File[] }>req.files)["files"]) {
        if (property === file.originalname) {
          args[mapping[property]] = path.join(process.cwd(), "temp", file.filename);
        }
      }
    }
  }

  const appTar = (<{ [fieldname: string]: Express.Multer.File[] }>req.files)["app"][0];

  const stream = fs.createReadStream(path.join(process.cwd(), "temp", appTar.filename)).pipe(tar.extract(process.cwd()));

  stream.on("finish", () => {
    const child = new Spawn(call.command, args, {
      cwd: call.cwd,
      detached: true
    });

    child.child.stderr.on("data", (data) => {
      stderr.write(data);
    });

    child.child.stdout.on("data", (data) => {
      stdout.write(data);
    });

    child.runChild
      .then((code) => {
        closeStreams([stdout, stderr, error])
          .then(() => {
            archiveData(outDir, code, res, next);
          });
      })
      .catch((err) => {
        error.write(JSON.stringify(err));
        closeStreams([stdout, stderr, error])
          .then(() => {
            archiveData(outDir, null, res, next);
          });
      });
  });
}

function closeStreams(streams: fs.WriteStream[]) {
  const promises: Promise<void>[] = [];

  streams.forEach((stream) => {
    promises.push(new Promise((resolve, reject) => stream.end(() => { resolve(); })));
  });

  return Promise.all(promises);
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
