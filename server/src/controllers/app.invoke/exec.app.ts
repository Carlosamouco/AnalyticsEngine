import * as fs from "fs";
import * as crypto from "crypto";
import * as path from "path";
import { isPrimitive, isString } from "util";
import { Response } from "express";
import * as BPromise from "bluebird";
import * as uuid from "uuid/v4";
const decompress = require("decompress");

import { JsonParser } from "../json.parser/json.parsers";
import { default as Spawn } from "./spawn";
import { AlgorithmModel, ParameterType, File } from "../../models/Application";
import { mkdirsSync } from "../../utils";
import * as rimraf from "rimraf";
import { Sandbox } from "../../docker_sandbox/sandbox";
import { AnalysisSchemeLanguage } from "aws-sdk/clients/cloudsearch";

type Arguments = {
  [key: string]: any,
};

export type ProcessOutput = {
  exit_code: number,
  stdout: string,
  stderr: string,
  files: string;
};

export class ExecApp {
  private _appId: string;
  private _algorithm: AlgorithmModel;
  private _uploads: Express.Multer.File[];

  private _tempDir: string;
  private _command: string;
  private _args: string[];
  private _mapping: any;
  private _cwd: string;


  private _tempFiles: string[] = [];

  constructor(appId: string, algorithm: AlgorithmModel, uploadedFiles: Express.Multer.File[]) {
    this._appId = appId;
    this._algorithm = algorithm;
    this._uploads = uploadedFiles;
    this._mapping = {};
  }

  public async compileArgs(args: Arguments) {
    this._tempDir = await this._prepareFs(this._algorithm._id.toString());
    this._compileCommand(this._appId, this._algorithm);
    await this._compileArgs(args);
  }

  private deleteTempFiles() {
    rimraf(`${this._tempDir}`, (err) => {
      if (err) throw err;
    });
  }

  public getOutputDir() {
    return this._tempDir;
  }

  public getTempFiles() {
    return this._tempFiles;
  }

  public spawnProcess(timeout: number) {
    const process = new Spawn(this._command, this._args, timeout, {
      cwd: this._cwd,
      detached: true
    });

    const fOutStream = fs.createWriteStream(path.join(this._tempDir, "stdout"));
    const fErrStream = fs.createWriteStream(path.join(this._tempDir, "stderr"));

    process.child.stderr.on("data", (data: Buffer) => {
      fErrStream.write(data);
    });

    process.child.stdout.on("data", (data: Buffer) => {
      fOutStream.write(data);
    });

    return new BPromise<ProcessOutput | Error>((resolve, reject) => {
      process.runChild
        .then((code) => {
          fOutStream.close();
          fErrStream.close();
          resolve({
            exit_code: code,
            stdout: path.join(this._tempDir, "stdout"),
            stderr: path.join(this._tempDir, "stderr"),
            files: path.join(this._tempDir, "files")
          });
        })
        .catch((err: Error) => {
          fOutStream.close();
          fErrStream.close();
          reject(err);
        });
    })
      .finally(() => {
        this.deleteTempFiles();
      });
  }

  public spawnRemoteProcess(timeout: number) {
    const zipFile = path.join(process.cwd(), "temp", `${uuid()}.zip`);
    const zipStream = fs.createWriteStream(zipFile);

    const fStreams: fs.ReadStream[] = [];

    this._tempFiles.forEach(fpath => {
      fStreams.push(fs.createReadStream(fpath));
    });

    const request = {
      command: this._command,
      args: JSON.stringify(this._args),
      cwd: this._cwd ? this._cwd : "",
      mapping: JSON.stringify(this._mapping),
      files: fStreams
    };

    return new BPromise<ProcessOutput | Error>((resolve, reject) => {
      Sandbox.getInstance().run(zipStream, timeout, request)
        .then((code: number) => {
          decompress(zipFile, this._tempDir)
            .then((dFiles: any) => {
              fs.unlink(zipFile, (err) => {
                if (err) return reject(err);
              });
              const errorPath = path.join(this._tempDir, "error");
              fs.readFile(path.join(this._tempDir, "error"), "utf8", (err, data) => {
                if (err) {
                  return reject(err);
                }

                if (data.length > 0) {
                  return reject(data);
                }

                resolve({
                  exit_code: code,
                  stdout: path.join(this._tempDir, "stdout"),
                  stderr: path.join(this._tempDir, "stderr"),
                  files: path.join(this._tempDir, "files")
                });
              });
            })
            .catch((err: any) => {
              reject(err);
            });
        })
        .catch((err) => {
          reject(err);
        });
    })
      .finally(() => {
        this.deleteTempFiles();
      });
  }

  private _prepareFs(algorithm_id: string) {
    const ms = new Date().getMilliseconds();
    const hash = crypto.createHash("md5").update(ms + algorithm_id).digest("hex");
    const tempDir = path.join(process.cwd(), "temp", hash);

    return new Promise<string>((resolve, reject) => {
      fs.mkdir(tempDir, (err) => {
        if (err && err.code !== "EEXIST") return reject(err);
        fs.mkdir(path.join(tempDir, "files"), (err) => {
          if (err && err.code !== "EEXIST") return reject(err);
          resolve(tempDir);
        });
      });
    });
  }

  private _compileCommand(appId: string, algorithm: AlgorithmModel) {
    const appDir = path.join(process.cwd(), "uploads", appId, algorithm._id.toString());
    const app = algorithm.entryApp.appName;

    this._cwd = algorithm.files.length !== 0 ? appDir : null;
    this._command = algorithm.entryApp.localFile ? path.join(appDir, app) : app;
  }

  private async _compileArgs(args: Arguments) {
    this._args = [];

    const promisses: Promise<any>[] = [];

    this._algorithm.parameters.sort((p1, p2) => {
      return p1.position - p2.position;
    });

    for (const param of this._algorithm.parameters) {
      let values: any[];

      if (param.name === "outputDir") {
        this._mapping["outputDir"] = this._args.length;
        values = [path.join(this._tempDir, "files")];
      }
      else if (param.options.static) {
        values = [param.options.default];
      }
      else {
        if (!args.hasOwnProperty(param.name) && param.options.required) {
          values = [param.options.default];
        }
        else if (args.hasOwnProperty(param.name) && !args[param.name] && param.options.default) {
          values = [param.options.default];
        }
        else if (args[param.name]) {
          values = args[param.name];
        }
        else {
          continue;
        }
      }

      if (param.type == ParameterType.Primitive) {
        this._args = this._args.concat(this.buildArg(param.flag, values));
      }
      else /*if (param.type == ParameterType.File)*/ {
        const files: string[] = [];
        const parser = await JsonParser.getInstance();

        for (const file of <(File | string)[]>values) {
          if (isString(file)) {
            files.push(`.${path.sep}${file}`);
            continue;
          }
          let fpath: string;
          let fName: string;

          if (file.fileRef) {
            const fUploaded = this._uploads.find(f => {
              if (f.originalname === file.fileRef.name && f.size === file.fileRef.size) {
                return true;
              }
              return false;
            });
            const fExtention = fUploaded.originalname.split(".").pop();
            fName = fUploaded.filename + (fExtention !== "" ? "." + fExtention : "");
            fpath = path.join(this._tempDir, fName);
            promisses.push(this.moveFile(fUploaded, fpath));
          }
          else {
            fName = crypto.createHash("md5").update(JSON.stringify(file.data || file.rawData)).digest("hex");
            fName += (file.extention !== "" ? "." + file.extention : "");
            fpath = path.join(this._tempDir, fName);

            if (file.rawData) {
              promisses.push(this.creatTempFile(fpath, file.rawData, file.encoding));
            }
            else if (parser.isParsable(file.extention)) {
              promisses.push(this.creatTempFile(fpath, parser.parse(file.extention, file.data), file.encoding));
            }
            else {
              const data: string = isPrimitive(file.data) ? file.data : JSON.stringify(file.data);
              promisses.push(this.creatTempFile(fpath, data, file.encoding));
            }
          }

          this._mapping[fName] = this._args.length + files.length + (param.flag ? 1 : 0);
          files.push(fpath);
        }

        this._args = this._args.concat(this.buildArg(param.flag, files));
      }
    }

    return Promise.all(promisses);
  }

  private moveFile(file: Express.Multer.File, destination: string) {
    return new Promise((resolve, reject) => {
      fs.rename(file.path, destination, (error) => {
        if (error) {
          fs.unlink(file.path, (rr) => {
            return reject(error);
          });
        }
        else {
          this._tempFiles.push(destination);
          resolve();
        }
      });
    });
  }

  private buildArg(flag: string, values: string[]) {
    let args: string[] = [];
    const errors: any = {};

    if (flag) args.push(flag);
    args = args.concat(values);

    return args;
  }

  private creatTempFile(fPath: string, data: string, encoding: string) {
    return new Promise((resolve, reject) => {
      fs.writeFile(fPath, data, encoding, (err) => {
        if (err) reject(err);
        this._tempFiles.push(fPath);
        resolve();
      });
    });
  }
}
