import * as fs from "fs";
import * as path from "path";

import { FileParser as PluginFileParser } from "../../plugins/parser";
import * as csv2json from "./csv2json";
import * as json2json from "./json2json";

type Options = {
  format: string
};

export class FileParser {

  private static _instance: FileParser;

  private _parsers: { [key: string]: any } = {
    csv: new csv2json.Parser(),
    json: new json2json.Parser()
  };

  private constructor() { }

  public static getInstance() {
    if (!this._instance) {
      this._instance = new FileParser();
    }

    return this._instance;
  }

  public addParser(parser: PluginFileParser) {
    const type = parser.register();
    this._parsers[type] = parser;
  }

  public isParsable(destFormat: string) {
    return !!this._parsers[destFormat];
  }


  parse(format: string, data: string): string {
    const parser = this._parsers[format];

    if (!parser) {
      throw Error(`No parser available for type ${format}.`);
    }

    return parser.parse(data);
  }
}
