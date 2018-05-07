import * as Papa from "papaparse";
import * as fs from "fs";
import { FileOutputParser, FileOptions } from "./file.output.parser";

export class Parser implements FileOutputParser {
  public parse(data: string) {
    const obj = Papa.parse(data, { header: true });
    if (obj.errors.length > 0) {
      throw obj.errors;
    }
    return obj.data;
  }
}


