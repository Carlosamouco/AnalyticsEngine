import * as fs from "fs";
import * as path from "path";

import * as json2xml from "./json2xml";
import * as json2rr from "./json2rr";
import * as json2csv from "./json2csv";

import { JsonParser as PluginJsonParser } from "../../plugins/parser";

type Options = {
  format: string
};

export class JsonParser {

  private static _instance: JsonParser;

  private _parsers: { [key: string]: any } = {
    csv: new json2csv.Parser(),
    xml: new json2xml.Parser(),
    rr: new json2rr.Parser()
  };

  private constructor() { }

  public static getInstance() {
    if (!this._instance) {
      this._instance = new JsonParser();
    }
    return this._instance;
  }

  public addParser(parser: PluginJsonParser) {
    const type = parser.register();
    this._parsers[type] = parser;
  }

  public isParsable(destFormat: string) {
    return !!this._parsers[destFormat];
  }


  parse(format: string, data: any, opts?: any) {
    const parser = this._parsers[format];

    if (!parser) {
      throw Error(`Not parser available for type ${format}.`);
    }

    return parser.parse(data, opts);
  }
}
