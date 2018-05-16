import * as Papa from "papaparse";
import * as fs from "fs";
import { FileOutputParser, FileOptions } from "./file.output.parser";

export class Parser implements FileOutputParser {
  public parse(data: string) {
    const obj = JSON.parse(data);
    return JSON.stringify(obj);
  }
}


