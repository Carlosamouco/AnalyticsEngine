import * as fs from "fs";
import { PipeOutput } from "./pipe.output";
import { Response } from "express";

import { FileParsers } from "../file.parser/file.parsers";

/**
 * Pipes the data of the output files to the client.
 */
export class PipeRawOutput extends PipeOutput {

  private pipeRawFileData(fPath: string, encoding: string) {
    this.stream.push(JSON.stringify(fs.readFileSync(fPath, encoding)));
  }

  protected pipeStdout(fPath: string) {
    this.pipeRawFileData(fPath, "utf8");
  }

  protected pipeStderr(fPath: string) {
    this.pipeRawFileData(fPath, "utf8");
  }

  protected pipeFileData(fPath: string, encoding: string) {
    this.pipeRawFileData(fPath, encoding);
  }
}

/**
 * Pipes the data of the output files to the client in a JSON format. The file data is parsed before being piped.
 */
export class PipeParsedOutput extends PipeOutput {
  private parser: FileParsers;

  constructor(res: Response) {
    super(res);
    this.parser = FileParsers.getInstance();
  }

  private readFileData(fPath: string, encoding: string) {
    return fs.readFileSync(fPath, encoding);
  }

  private pipeParsedData(fPath: string, encoding: string, extention: string) {
    const data = this.readFileData(fPath, encoding);
    if (extention && this.parser.isParsable(extention)) {
      try {
        this.stream.push(this.parser.parse(extention, data));
      }
      catch (err) {
        this.stream.push(JSON.stringify(data));
      }
    }
    else {
      this.stream.push(JSON.stringify(data));
    }
  }

  protected pipeStdout(fPath: string, extention: string) {
    this.pipeParsedData(fPath, "utf8", extention);
  }

  protected pipeStderr(fPath: string) {
    const data = this.readFileData(fPath, "utf8");
    this.stream.push(JSON.stringify(data));
  }

  protected pipeFileData(fPath: string, encoding: string, extention: string) {
    this.pipeParsedData(fPath, encoding, extention);
  }
}
