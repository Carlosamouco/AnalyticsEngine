import { Readable } from "stream";
import * as fs from "fs";
import * as path from "path";
import { Response } from "express";

import { ProcessOutput } from "./exec.app";
import { OutputModel, FileOutputModel } from "../../models/Application";
import { default as Spawn } from "./spawn";

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

type OutputOpts = {
  filesDir: string,
  ignoreFiles: string[],
  outDir: string
};

export abstract class PipeOutput {
  private res: Response;
  protected stream: Readable;

  constructor(res: Response) {
    this.res = res;
    this.stream = new Readable();
  }

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

  public async initOutput(pipeOpts: PipeOptions, output: ProcessOutput, model: OutputModel) {
    await this._readFiles(model, output.files);

    this.res.setHeader("Content-Type", "application/json");
    this.stream.pipe(this.res);
    this.stream.push("{");
    this.stream.push('"' + model.stdout.alias + '":');
    this.pipeStdout(output.stdout, model.stdout.extention);
    this.stream.push(',"' + model.stderr.alias + '":');
    this.pipeStderr(output.stderr);
    this._pipeFiles(<FilesCreated[]>model.files);
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
      this.stream.push(`,"${fileOutOpts.alias}":[{`);
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

  protected abstract pipeStdout(fPath: string, extention?: string): void;

  protected abstract pipeStderr(fPath: string): void;

  protected abstract pipeFileData(fPath: string, encoding: string, extention?: string): void;
}
