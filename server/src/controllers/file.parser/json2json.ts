import { FileOutputParser } from "./file.output.parser";

export class Parser implements FileOutputParser {
  /**
   * Converts a string with some file content to JSON string.
   * @param data JSON file data to be converted.
   */
  public parse(data: string) {
    const obj = JSON.parse(data);
    return JSON.stringify(obj);
  }
}


