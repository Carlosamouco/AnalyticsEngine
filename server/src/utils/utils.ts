import * as path from "path";
import * as fs from "fs";
import { isBoolean, isNumber, isString as isStr, isPrimitive } from "util";

export function isString(val: any, size?: number) {
  if (size) {
    return isStr(val) && val.length >= size;
  }
  return isStr(val);
}

export function isBool(val: any) {
  return val != undefined && (val === "true" || val === "false" || isBoolean(val));
}

export function isInteger(val: any) {
  if (!(val instanceof Array)) {
    return Number.isInteger(Number(val));
  }
  return false;
}

export function mkdirsSync(pathToCreate: string) {
  pathToCreate
    .split(path.sep)
    .reduce((currentPath, folder) => {
      currentPath += folder + path.sep;

      try {
        fs.mkdirSync(currentPath);
      }
      catch (err) {
        if (err.code !== "EEXIST") {
          throw err;
        }
      }

      return currentPath;
    }, "");
}
