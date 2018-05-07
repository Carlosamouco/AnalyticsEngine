import * as fs from "fs";
import { PipeOutput } from "./pipe.output";

import { FileParser } from "../file.parser/file.parsers";

export class PipeRawOutput extends PipeOutput {

  private pipeRawFileData(fPath: string, encoding: string) {
    this.stream.push(JSON.stringify(fs.readFileSync(fPath, encoding)));
    return;
  }

  protected pipeStdout(fPath: string) {
    return this.pipeRawFileData(fPath, "utf8");
  }

  protected pipeStderr(fPath: string) {
    return this.pipeRawFileData(fPath, "utf8");
  }

  protected pipeFileData(fPath: string, encoding: string) {
    return this.pipeRawFileData(fPath, encoding);
  }
}
