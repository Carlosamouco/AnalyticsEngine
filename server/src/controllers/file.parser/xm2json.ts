import * as xml2js from "xml2js";
import { FileOutputParser } from "./file.output.parser";

export class Parser implements FileOutputParser {
  /**
   * Converts a string with some file content to JSON string.
   * @param data XML file data to be converted.
   */
  public parse(data: string) {
    const parser = new xml2js.Parser();
    let error, obj;
    parser.parseString(data, (err: any, res: any) => {
      error = err;
      obj = res;
    });
    if (error) {
      throw error;
    }
    if (!error && !obj) {
      throw new Error("An unknown error occured while parsing the requested file.");
    }
    return JSON.stringify(obj);
  }
}
