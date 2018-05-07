import { JsonParser } from "../parser";

export default class ExampleParserPlugin extends JsonParser {

  private _type: string = "file.extention";

  public register(): string {
    return this._type;
  }

  public parse(data: any): string {
    const file: string = "";

    /**
     * Parse data object...
     * And return a string with the file content to be created...
     */

    return file;
  }
}
