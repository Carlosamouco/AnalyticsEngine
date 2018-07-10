import { Request, Response, NextFunction } from "express";
import * as promises from "bluebird";
import * as fs from "fs";
import * as path from "path";
import * as rimraf from "rimraf";
const decompress = require("decompress");
import * as archiver from "archiver";
import * as uuid from "uuid/v4";

import { default as Application, ApplicationModel, AlgorithmModel } from "../../models/Application";
import { isBool, mkdirsSync } from "../../utils";


export default async function postUpload(req: Request, res: Response, next: NextFunction) {
  const errors: string[] = [];

  if (!req.files || (<Express.Multer.File[]>req.files).length === 0) {
    return res.json({ success: false, errors: ["No files were uploaded."] });
  }

  if (!isBool(req.body.override)) {
    req.body.override = true;
  }
  else {
    req.body.override = (req.body.override === "true");
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
    try {
      await deleteFiles(<Express.Multer.File[]>req.files);
    }
    catch (err) {
      return next(err);
    }
    return res.status(400).json({ messages: ["`app_id` and/or `algorithms.id` are non registered."] });
  }
  else {
    const algorithm = existingApp.algorithms.find((elem) => {
      return elem._id == req.body.version_id;
    });

    const appPath = path.join(process.cwd(), "uploads", req.body.app_id, req.body.version_id);
    try {
      mkdirsSync(appPath);
    }
    catch (err) {
      return next(err);
    }

    if (!req.body.override) {
      await emptyDir(appPath);
    }

    try {
      const fRes = await moveFiles(<Express.Multer.File[]>req.files, appPath);
      updateAlgorithmFiles(algorithm, <string[][]>fRes, { override: req.body.override });
      await existingApp.save();
    }
    catch (err) {
      return next(err);
    }

    if (algorithm.entryApp && algorithm.entryApp.localFile) {
      fs.chmodSync(path.join(process.cwd(), "uploads", existingApp._id.toString(), algorithm._id.toString(), algorithm.entryApp.appName), 0o777);
    }

    archiveAppFiles(appPath, appPath);

    const app = existingApp.toObject();
    app.algorithms = [algorithm];
    delete app.__v;

    return res.json({ app });
  }
}

function moveFiles(files: Express.Multer.File[], fPath: string) {
  const extentions = [".zip", ".gz", ".bz2", ".tgz", ".tar"];

  return promises.map(files, (file) => {
    return new Promise((resolve, reject) => {
      fs.rename(file.path, path.join(fPath, file.originalname), (error) => {
        if (error) {
          fs.unlink(file.path, (rr) => {
            return reject(error);
          });
        }

        if (extentions.indexOf(path.extname(file.originalname)) !== -1) {
          const zipFile = path.join(fPath, file.originalname);

          decompress(zipFile, fPath)
            .then((dFiles: any) => {
              const fArray: string[] = [];
              dFiles.forEach((f: any) => {
                fArray.push(f.path);
              });
              fs.unlink(zipFile, (err) => {
                if (err) return reject(err);
                return resolve(fArray);
              });
            })
            .catch((err: any) => {
              reject(err);
            });
        }
        else {
          return resolve([file.originalname]);
        }
      });
    });
  });
}

function emptyDir(dir: string) {
  return new Promise((resolve, reject) => {
    rimraf(`${dir}/*`, function (err) {
      if (err) reject(err);
      resolve();
    });
  });
}

function deleteFiles(files: Express.Multer.File[]) {
  return promises.map(files, (file) => {
    new Promise((resolve, reject) => {
      fs.unlink(file.path, err => {
        if (err) return reject(err);
        return resolve();
      });
    });
  });
}

function updateAlgorithmFiles(algorithm: AlgorithmModel, files: string[][], options: { override: boolean }) {
  if (!options.override) {
    algorithm.files = [];
  }

  for (const fset of files) {
    for (const fPath of fset) {
      if (isDir(fPath))
        continue;
      if (algorithm.files.indexOf(fPath) === -1) {
        algorithm.files.push(fPath);
      }
    }
  }
}

function isDir(fPath: string): boolean {
  if (fPath.slice(-1) === path.sep) {
    return true;
  }
  return false;
}

function archiveAppFiles(source: string, dest: string) {
  return new Promise((resolve, reject) => {
    fs.unlink(path.join(dest, "app_files.tar"), (err) => {
      if (err && err.code != "ENOENT") return reject(err);

      const archiveDir = path.join(process.cwd(), "temp", `${uuid()}.tar`);
      const output = fs.createWriteStream(archiveDir);
      const archive = archiver("tar");

      archive.pipe(output);
      archive.directory(source, "run");
      archive.finalize();

      output.on("close", () => {
        fs.rename(archiveDir, path.join(dest, "app_files.tar"), (err) => {
          if (err) return reject(err);
          resolve();
        });
        resolve();
      });

      archive.on("error", (err) => {
        reject(err);
      });
    });
  });
}
