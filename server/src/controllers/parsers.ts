import * as path from "path";
import * as fs from "fs";
import { FileParsers } from "./file.parser/file.parsers";
import { JsonParsers } from "./json.parser/json.parsers";
import { FileParser as PluginFileParser, JsonParser as PluginJsonParser } from "../plugins/parser";

/**
 * Manages all the Parsers installed and pre-installed on the system.
 */
export class Parsers {
  /**
   * Internal instance of the parser class. Singleton.
   */
  private static _instance: Parsers;

  private constructor() { }

  /**
   * Creates a new instance of the class or returnes an existing one.
   */
  public static async getInstance() {
    if (!this._instance) {
      this._instance = new Parsers();
      await this._instance.loadParsers();
    }

    return this._instance;
  }

  /**
   * Loads all the parsers installed on the system.
   * Depending on the class that the loaded parser extends, will determinat which type of parser it refers.
   */
  private loadParsers() {
    const promises: Promise<any>[] = [];
    const fileParsers: FileParsers = FileParsers.getInstance();
    const jsonParsers: JsonParsers = JsonParsers.getInstance();

    const pluginsDir = path.join(process.cwd(), "./src/plugins/parsers");
    const files = fs.readdirSync(pluginsDir);

    files.forEach((plugin) => {
      if (path.extname(plugin) !== ".js") {
        return;
      }
      promises.push(new Promise((resolve, reject) => {
        import(path.join(pluginsDir, plugin))
          .then(module => {
            let parser: any;
            try {
              parser = new module.default();
            }
            catch (err) {
              reject(err);
            }

            if (parser instanceof PluginFileParser) {
              fileParsers.addParser(parser);
            }
            else if (parser instanceof PluginJsonParser) {
              jsonParsers.addParser(parser);
            }
          })
          .catch((err) => {
            reject(err);
          });
      }));
    });
    return Promise.all(promises);
  }
}
