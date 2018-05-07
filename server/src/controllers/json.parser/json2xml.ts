import * as json2xml from "js2xmlparser";

import { FileInputParser } from "./file.input.parser";

export class Parser implements FileInputParser {
  public parse(data: any) {
    if (Object.keys(data).length !== 1) {
      throw Error("XML Parser Error: Provided object must contain only a single root property.");
    }
    const root = Object.keys(data)[0];
    return json2xml.parse(root, data[root]);
  }
}
