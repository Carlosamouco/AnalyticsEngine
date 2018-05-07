import * as fs from "fs";
import * as util from "util";

const dev = false;

if (dev) {
  const log_file = fs.createWriteStream(`./logs/debug_${new Date().getTime()}.log`, { flags: "w" });
  const log_stdout = process.stdout;

  console.log = function (message?: any, ...optionalParams: any[]) {
    if (dev) {
      log_file.write(util.format.apply(null, arguments) + "\n");
    }
  };
}

export = console;
