import * as path from "path";
import * as fs from "fs";
import { isBoolean, isString as isStr } from "util";

/**
 * Avaliates if a variable is of type string and under a given length if the size is specified.
 * @param val Variable to be tested.
 * @param size Maximum allowed length of the string.
 */
export function isString(val: any, size?: number) {
  if (size) {
    return isStr(val) && val.length >= size;
  }
  return isStr(val);
}

/**
 * Avaliates whether a variable is a boolean type or a string representing a boolean.
 * @param val variable to be tested.
 */
export function isBool(val: any) {
  return val != undefined && (val === "true" || val === "false" || isBoolean(val));
}

/**
 * Avaliates whether a variable is Integer or not.
 * @param val variable to be tested.
 */
export function isInteger(val: any) {
  if (!(val instanceof Array)) {
    return Number.isInteger(Number(val));
  }
  return false;
}

/**
 * Creates a set of folders and subfolders syncronously.
 * @param pathToCreate absolute path with the folders to be created.
 */
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
