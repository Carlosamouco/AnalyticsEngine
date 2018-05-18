import { Endpoint } from '../list-endpoints/list-endpoints.types';

export interface ApplicationDetails {
  author: string;
  name: string;
  description: string;
  _id: string;
  algorithm: Algorithm;
}

interface Algorithm {
  _id: string;
  files: string[];
  entryApp: {
    appName: string,
    localFile: boolean,
  };
  version: string;
  description: string;
  output: FOutput;
  parameters: Parameter[];
}

export interface FOutput {
  stderr: {
    extention: string,
    alias: string
  };
  stdout: {
    extention: string,
    alias: string
  };
  files: [{
    fileRgx: string,
    extention: String,
    encoding: String,
    alias: string
  }];
}

export interface Parameter {
  name: string;
  type: string;
  description: String;
  flag: string;
  position: number;

  options: {
    static: boolean,
    required: boolean,
    default: string,
    endpointId?: string,
    endpoint?: Endpoint
  };
}
