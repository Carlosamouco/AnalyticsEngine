import * as path from "path";
import * as fs from "fs";
import { isBoolean, isString as isStr } from "util";
import { Request, Response, NextFunction } from "express";
import * as jwt from "jsonwebtoken";
import { UserRoles } from "../models/User";

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

/**
 * Checks if a request is authorized to preform restricted access operations based on the JWT.
 * @param req Express Request
 * @param res Express Response
 * @param next Express NextFunction
 */
export function isAuthorized(adminOnly?: boolean) {
  return (req: Request, res: Response, next: NextFunction) => {
    const auth = <string>req.headers["authorization"];
    if (isString(auth)) {
      const authArgs = auth.split(" ");
      if (authArgs.length === 2 && authArgs[0] === "Bearer") {
        const token = authArgs[1];
        try {
          const decode = <any> jwt.verify(token, process.env.SESSION_SECRET);
          if (decode.role == UserRoles.Admin || decode.role == UserRoles.Super) {
            return next();
          }
        }
        catch (err) {
          return next(err);
        }
      }
    }
    res.status(403).send("Unauthorized access");
  };
}
