const json2xml = require("js2xmlparser");

import { FileInputParser } from "./file.input.parser";

export class Parser implements FileInputParser {
  /**
   * Parses JSON to a string of xml format.
   */
  public parse(data: any) {
    if (Object.keys(data).length !== 1) {
      throw Error("XML Parser Error: Provided object must contain only a single root property.");
    }
    const root = Object.keys(data)[0];
    return json2xml.parse(root, data[root]);
  }
}
