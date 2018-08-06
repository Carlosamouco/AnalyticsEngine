import { Readable } from "stream";
import * as fs from "fs";
import * as path from "path";
import { Response } from "express";

import { ProcessOutput } from "./exec.app";
import { OutputModel, FileOutputModel } from "../../models/Application";

type PipeOptions = {
  stderr?: boolean,
  stdout?: boolean,
  files?: boolean
};

type FilesCreated = FileOutputModel & {
  files: {
    fPath: string,
    fName: string
  }[]
};


type stdOptions = {
  stdout: {
    path: string,
    alias: string
  },
  stderr: {
    path: string,
    alias: string
  }
};

/**
 * Class with methods that pipe the output data of an application to the client.
 */
export abstract class PipeOutput {
  /**
   * Express Response.
   */
  private res: Response;
  /**
   * Readable stream.
   */
  protected stream: Readable;

  constructor(res: Response) {
    this.res = res;
    this.stream = new Readable();
  }

  /**
   * Detects the output files generated by an application that should be returned in the response to the client.
   * @param model Optput options that were configured for an application.
   * @param dir Directory where the output files of an application were saved.
   */
  private _readFiles(model: OutputModel, dir: string) {
    return new Promise((resolve, reject) => {
      fs.readdir(dir, (err, files) => {
        if (err) return reject(err);

        files.forEach((fName) => {
          if (fs.lstatSync(path.join(dir, fName)).isFile()) {
            this._addFile(model, dir, fName);
          }
        });

        resolve();
      });
    });
  }

  /**
   * Registers a file wose data sould be returned to the client according to the output configurations.
   * @param model Ouput configurations for a given application.
   * @param fPath Path to the file.
   * @param fName Name of the file.
   */
  private _addFile(model: OutputModel, fPath: string, fName: string) {
    const files: FileOutputModel[] = model.files;
    const fOptions = <FilesCreated>files.find((f) => {
      return new RegExp(f.fileRgx).test(fName);
    });

    if (fOptions) {
      if (!fOptions.files) {
        fOptions.files = [];
      }
      fOptions.files.push({ fPath, fName });
    }
  }

  /**
   * Pipes the data of a group of selected output files to the client.
   * @param pipeOpts Ouput options in the request.
   * @param output Process output data.
   * @param model Application output configurations.
   */
  public async initOutput(pipeOpts: PipeOptions, output: ProcessOutput, model: OutputModel) {
    await this._readFiles(model, output.files);

    this.res.setHeader("Content-Type", "application/json");
    this.stream.pipe(this.res);
    this.stream.push("{");
    if (pipeOpts.stdout) {
      this.stream.push('"' + model.stdout.alias + '":');
      this.pipeStdout(output.stdout, model.stdout.extention);
    }
    if (pipeOpts.stderr) {
      if (pipeOpts.stdout) {
        this.stream.push(',"');
      }
      else {
        this.stream.push('"');
      }
      this.stream.push(model.stderr.alias + '":');
      this.pipeStderr(output.stderr);
    }
    if (pipeOpts.files) {
      if (pipeOpts.stderr) {
        this.stream.push(",");
      }
      this._pipeFiles(<FilesCreated[]>model.files);
    }
    if (output.exit_code == null) {
      this.stream.push(',"waring":"Process allowed execution time has expired. The process was \'killed.\'"}');
    }
    else {
      this.stream.push(`,"exit_code":${output.exit_code}}`);
    }
    this.stream.push(null);
  }

  private _pipeFiles(files: FilesCreated[]) {
    for (let n = 0; n < files.length; n++) {
      const fileOutOpts = files[n];
      if (n > 0) {
        this.stream.push(",");
      }
      this.stream.push(`"${fileOutOpts.alias}":[{`);
      for (let i = 0; fileOutOpts.files && i < fileOutOpts.files.length; i++) {
        const file = fileOutOpts.files[i];
        this.stream.push(`"${file.fName}":`);
        this.pipeFileData(path.join(file.fPath, file.fName), fileOutOpts.encoding, fileOutOpts.extention);

        if (i + 1 !== fileOutOpts.files.length) {
          this.stream.push("},{");
        }
      }
      this.stream.push("}]");
    }
  }

  /**
   * Pipes the stdout data to the client.
   * @param fPath Path to the file that holds the output data of an application.
   * @param extention Parser that will convert the data from the file to JSON.
   */
  protected abstract pipeStdout(fPath: string, extention?: string): void;

  /**
   * Pipes the stderr data to the client.
   * @param fPath Path to the file that holds the output data of an application.
   */
  protected abstract pipeStderr(fPath: string): void;

  /**
   * Pipes the stdout data to the client.
   * @param fPath Path to the file that holds the output data of an application.
   * @param encoding Encoding appliend when retriving the data from the file.
   * @param extention Parser that will convert the data from the file to JSON.
   */
  protected abstract pipeFileData(fPath: string, encoding: string, extention?: string): void;
}
