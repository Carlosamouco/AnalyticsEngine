import { FileParser as PluginFileParser } from "../../plugins/parser";
import * as csv2json from "./csv2json";
import * as json2json from "./json2json";
import * as xml2json from "./xm2json";

/**
 * Manages the parsers responsible to convert data from a file to JSON.
 */
export class FileParsers {

  /**
   * Retunes a new instance of the class or an existing one. Singleton.
   */
  private static _instance: FileParsers;

  private _parsers: { [key: string]: any } = {
    csv: new csv2json.Parser(),
    json: new json2json.Parser(),
    xml: new xml2json.Parser()
  };

  private constructor() { }

  /**
   * Retunes a new instance of the class or an existing one. Singleton.
   */
  public static getInstance() {
    if (!this._instance) {
      this._instance = new FileParsers();
    }

    return this._instance;
  }

  /**
   * Adds a new parser to the list of available parsers.
   * @param parser Parser instance to be added.
   */
  public addParser(parser: PluginFileParser) {
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
   * Converts the data from a file to the respective JSON format using the correct available parser.
   * @param format Parser name / destination format.
   * @param data String with the data to be converted.
   */
  parse(format: string, data: string): string {
    const parser = this._parsers[format];

    if (!parser) {
      throw Error(`No parser available for type ${format}.`);
    }

    return parser.parse(data);
  }
}
