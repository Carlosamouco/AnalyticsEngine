import { Readable } from "stream";

export type FileOptions = {
  encoding: string;
};

export interface FileOutputParser {
  parse(data: string, options: FileOptions): any;
}
