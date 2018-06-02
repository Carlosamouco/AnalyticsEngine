import * as xml2js from "xml2js";
import * as fs from "fs";
import { FileOutputParser, FileOptions } from "./file.output.parser";

export class Parser implements FileOutputParser {
  public parse(data: string) {
    const parser = new xml2js.Parser();
    let error, json;
    xml2js.parseString(data, (err, res) => {
        error = err;
        json = res;
    });
    if (error) {
        throw error;
    }
    if (!error && !json) {

        throw new Error("An unknown error occured while parsing the requested file.");
    }
    return json;
  }
}
