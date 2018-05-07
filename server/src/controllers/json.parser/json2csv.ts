import * as Papa from "papaparse";

import { FileInputParser } from "./file.input.parser";

export class Parser implements FileInputParser {
  public parse(data: any) {
    return Papa.unparse(data, { delimiter: ";" });
  }
}
