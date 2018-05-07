import * as child from "child_process";
import * as kill from "tree-kill";
import * as Promise from "bluebird";
import * as fs from "fs";
import * as path from "path";
import * as crypto from "crypto";
import * as EventEmitter from "events";


export default class SpawnWarper {
  private _entry: string;
  private _args: string[];
  private _timeout: number;
  private _options: child.SpawnOptions;

  public child: child.ChildProcess;
  public runChild: Promise<any>;

  constructor(entry: string, args: string[], timeout: number, options: child.SpawnOptions) {
    this._entry = entry;
    this._args = args;
    this._timeout = timeout;
    this._options = options;

    this.child = child.spawn(this._entry, this._args, this._options);

    const timeoutFunc = setTimeout(() => { kill(this.child.pid); }, this._timeout);

    this.runChild = new Promise((resolve, reject) => {
      this.child.on("error", (err) => {
        clearTimeout(timeoutFunc);
        reject(err);
      });

      this.child.on("close", (code) => {
        clearTimeout(timeoutFunc);
        resolve(code);
      });
    });
  }
}
