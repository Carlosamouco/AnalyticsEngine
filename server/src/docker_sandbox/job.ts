import { WriteStream } from "fs";

import { default as Container } from "./container";

export class Job {
  public callback: (err: any, res?: any) => void;
  public request: any;
  public timeout: number;
  public output: WriteStream;

    constructor(output: any, request: any, timeout: number, callback: (err: any, res?: any) => void) {
      this.output = output;
      this.request = request;
      this.callback = callback;
      this.timeout = timeout;
    }
}
