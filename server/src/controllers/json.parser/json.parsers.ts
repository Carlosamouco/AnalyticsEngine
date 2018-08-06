import * as fs from "fs";
import * as path from "path";

import * as json2xml from "./json2xml";
import * as json2rr from "./json2rr";
import * as json2csv from "./json2csv";

import { JsonParser as PluginJsonParser } from "../../plugins/parser";

/**
 * Manages the parsers responsible to convert data from JSON to a file format.
 */
export class JsonParsers {
/**
 * Private instance of the class.
 */
  private static _instance: JsonParsers;

  private _parsers: { [key: string]: any } = {
    csv: new json2csv.Parser(),
    xml: new json2xml.Parser(),
    rr: new json2rr.Parser()
  };

  private constructor() { }

  /**
   * Retunes a new instance of the class or an existing one. Singleton.
   */
  public static getInstance() {
    if (!this._instance) {
      this._instance = new JsonParsers();
    }
    return this._instance;
  }

  /**
   * Adds a new parser to the list of available parsers.
   * @param parser Parser instance to be added.
   */
  public addParser(parser: PluginJsonParser) {
    const type = parser.register();
    this._parsers[type] = parser;
  }

  /**
   * Determines whether a parser is available.
   * @param destFormat Parser name / file format to be queried.iop
   */
  public isParsable(destFormat: string) {
    return !!this._parsers[destFormat];
  }

  /**
   * Converts the data encoded in JSON to the respective file format using the correct available parser.
   * @param format Parser name / destination format.
   * @param data Object with the data to be converted.
   */
  parse(format: string, data: any) {
    const parser = this._parsers[format];

    if (!parser) {
      throw Error(`Not parser available for type ${format}.`);
    }

    return parser.parse(data);
  }
}
