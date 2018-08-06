import * as Papa from "papaparse";

import { FileInputParser } from "./file.input.parser";

export class Parser implements FileInputParser {
  /**
   * Parses JSON to a string of csv format.
   */
    public parse(data: any) {
    return Papa.unparse(data, { delimiter: ";" });
  }
}
