import { FileInputParser } from "./file.input.parser";

export class Parser implements FileInputParser {
  private _lastLineData: string;

  public parse(intervals: any) {
    let res = "";

    if (!(intervals instanceof Array)) {
      throw "RR Parser Error: expected an array of intervals.";
    }

    for (let i = 0; i < intervals.length; i++) {
      if (isNaN(intervals[i])) {
        throw `RR Parser Error: invalide element at position ${i}`;
      }

      res += intervals[i];
      if (i !== intervals.length - 1) {
        res += "\n";
      }
    }
    return res;
  }
}
