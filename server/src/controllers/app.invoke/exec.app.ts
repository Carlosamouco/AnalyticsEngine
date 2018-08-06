import * as fs from "fs";
import * as crypto from "crypto";
import * as path from "path";
import { isPrimitive, isString } from "util";
import * as BPromise from "bluebird";
import * as uuid from "uuid/v4";
import * as unzip from "unzip";

import { JsonParsers } from "../json.parser/json.parsers";
import { default as Spawn } from "./spawn";
import { AlgorithmModel, ParameterType, File } from "../../models/Application";
import * as rimraf from "rimraf";
import { Sandbox } from "../../docker_sandbox/sandbox";

type Arguments = {
  [key: string]: any,
};

export type ProcessOutput = {
  exit_code: number,
  stdout: string,
  stderr: string,
  files: string;
};

/**
 * Class responsible for managing the execution environment of an application.
 */
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

  /**
   * Creates a temporary folder for the input files and compiles the argument vector of an applicaion based on the values provided by the client in the request.
   * @param args Request aguments.
   */
  public async compileArgs(args: Arguments) {
    this._tempDir = await this._prepareFs();
    this._compileCommand(this._appId, this._algorithm);
    await this._compileArgs(args);
  }

  /**
   * Deletes all folders inside a directory.
   */
  public deleteTempFiles() {
    rimraf(`${this._tempDir}`, { "maxBusyTries": 5 }, (err) => {
      if (err) throw err;
    });
  }

  /**
   * Returns the path to the output directory of an application.
   */
  public getOutputDir() {
    return this._tempDir;
  }

  /**
   * Returns the path to the directory that holds the input files of an application.
   */
  public getTempFiles() {
    return this._tempFiles;
  }

  /**
   * Ends a set of write strems.
   * @param streams List of Write Streams
   */
  private _closeStreams(streams: fs.WriteStream[]) {
    return BPromise.map(streams, (stream) => {
      return new Promise((resolve, reject) => {
        stream.end(() => { resolve(); });
      });
    });
  }

  /**
   * Spawns a local process, redirecting the data of the stdout and stderr streams of an application to temporary files.
   * @param timeout Max. allowed execution time.
   */
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

    return new Promise<ProcessOutput | Error>((resolve, reject) => {
      process.runChild
        .then((code) => {
          this._closeStreams([fOutStream, fErrStream])
            .then(() => {
              resolve({
                exit_code: code,
                stdout: path.join(this._tempDir, "stdout"),
                stderr: path.join(this._tempDir, "stderr"),
                files: path.join(this._tempDir, "files")
              });
            });
        })
        .catch((err: Error) => {
          this._closeStreams([fOutStream, fErrStream]).then(() => {
            reject(err);
          });
        });
    });
  }

  /**
   * Spawns a process inside a container. Prepares the request with all the input data and application files
   * requerid to run the application remotly.
   * A Write stream is created to hold the response of the container as a .zip file. The content is then extracted,
   * it's verified if any error was reported by the container and the returned promise is then resolved.
   * @param timeout Max. allowed time that the request to the containers has to be processed.
   */
  public spawnRemoteProcess(timeout: number) {
    const zipFile = path.join(process.cwd(), "temp", `${uuid()}.zip`);
    const zipStream = fs.createWriteStream(zipFile);

    const fStreams: fs.ReadStream[] = [];

    this._tempFiles.forEach(fpath => {
      fStreams.push(fs.createReadStream(fpath));
    });

    const archive = this._cwd ? path.join(this._cwd, "app_files.tar") : null;

    const request = {
      command: this._command,
      args: JSON.stringify(this._args),
      mapping: JSON.stringify(this._mapping),
      cwd: this._cwd ? "/usr/src/app/run" : null,
      files: fStreams,
      app: fs.createReadStream(archive)
    };

    return new Promise<ProcessOutput | Error>((resolve, reject) => {
      Sandbox.getInstance().run(zipStream, timeout, request)
        .then((code: number) => {
          const unzipStream = unzip.Extract({ path: this._tempDir });
          fs.createReadStream(zipFile).pipe(unzipStream);
          unzipStream.on("close", () => {
            fs.unlink(zipFile, (err) => {
              if (err) return reject(err);

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
            });
          });

          unzipStream.on("error", (err: any) => {
            reject(err);
          });

        })
        .catch((sErr: any) => {
          zipStream.end(() => {
            fs.unlink(zipFile, (err) => {
              if (err) {
                return reject(err);
              }
              return reject(sErr);
            });
          });
        });
    });
  }

  /**
   * Creates the temporary folder where the input and output files of an apllication will be saved.
   */
  private _prepareFs() {
    const tempDir = path.join(process.cwd(), "temp", uuid());

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

  /**
   * Prepares the command that will be executed. The command can be an application pre-installed on the system or a executable file.
   * The process cwd is set to the directory where the input files are saved.
   * @param appId ID of the application that will be executed.
   * @param algorithm Application version configurations.
   */
  private _compileCommand(appId: string, algorithm: AlgorithmModel) {
    const appDir = path.join(process.cwd(), "uploads", appId, algorithm._id.toString());
    const app = algorithm.entryApp.appName;

    this._cwd = algorithm.files.length !== 0 ? appDir : null;
    this._command = algorithm.entryApp.localFile ? path.join(appDir, app) : app;
    if (algorithm.entryApp.localFile) {
      this._mapping[app] = -1;
    }
  }

  /**
   * Compiles the argument vectore that will be passed to the process when spawning it.
   * Data of parameters of type File encoded in JSON are converted to file format and uploaded input files are moved to the input temporary folder.
   * @param args Request argument values.
   */
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
        const parser = await JsonParsers.getInstance();

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

  /**
   * Realocates a file to a diferent directory.
   * @param file File to be moved.
   * @param destination Destination Folder.
   */
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

  /**
   * Compiles the value of an argument that will be included in the argument vector.
   * @param flag Flag of the parameter, e.g. --flag
   * @param values value sended in the request for a given parameter by the client.
   */
  private buildArg(flag: string, values: string[]) {
    let args: string[] = [];

    if (flag) args.push(flag);
    args = args.concat(values);

    return args;
  }

  /**
   * Writes some data present in the client request relative to a File parameter to a temporary file.
   * @param fPath Path where the file will be created
   * @param data Data to be written.
   * @param encoding Encoding applied when writing the data.
   */
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
