import * as path from "path";
import * as fs from "fs";
import { FileParser } from "./file.parser/file.parsers";
import { JsonParser } from "./json.parser/json.parsers";
import { FileParser as PluginFileParser, JsonParser as PluginJsonParser } from "../plugins/parser";

export class Parsers {
  private static _instance: Parsers;

  private constructor() { }

  public static async getInstance() {
    if (!this._instance) {
      this._instance = new Parsers();
      await this._instance.loadParsers();
    }

    return this._instance;
  }

  private loadParsers() {
    const promises: Promise<any>[] = [];
    const fileParsers: FileParser = FileParser.getInstance();
    const jsonParsers: JsonParser = JsonParser.getInstance();

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
