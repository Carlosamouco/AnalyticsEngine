import * as child from "child_process";
import * as fs from "fs";
import * as path from "path";

export default class SpawnWarper {
  private _entry: string;
  private _args: string[];
  private _options: child.SpawnOptions;

  public child: child.ChildProcess;
  public runChild: Promise<any>;


  constructor(entry: string, args: string[], options: child.SpawnOptions) {
    this._entry = entry;
    this._args = args;
    this._options = options;

    this.child = child.spawn(this._entry, this._args, this._options);

    this.runChild = new Promise((resolve, reject) => {
      this.child.on("error", (err) => {
        reject(err);
      });

      this.child.on("close", (code) => {
        resolve(code);
      });
    });
  }
}
