import * as Papa from "papaparse";
import { FileOutputParser } from "./file.output.parser";

export class Parser implements FileOutputParser {
  /**
   * Converts a string with some file content to JSON string.
   * @param data CSV file data to be converted.
   */
  public parse(data: string) {
    if (data[data.length - 1] === "\n") {
      data = data.slice(0, -1);
      if (data[data.length - 1] === "\r") {
        data = data.slice(0, -1);
      }
    }
    const obj = Papa.parse(data, { header: true });
    if (obj.errors.length > 0) {
      throw obj.errors;
    }
    return obj.data;
  }
}


