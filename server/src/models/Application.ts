import * as mongoose from "mongoose";
import { isString } from "util";

import { default as Endpoint } from "./Endpoint";

export type ApplicationModel = mongoose.Document & {
  author: string,
  name: string,
  description?: string,
  algorithms: AlgorithmModel[]
};

export type AlgorithmModel = {
  version: string,
  description?: string,
  entryApp: {
    appName: string,
    localFile: boolean
  },
  files: string[],
  parameters: ParameterModel[],
  output: OutputModel,
  _id?: string
};

export type OutputModel = {
  stdout?: {
    alias: string,
    extention: string
  },
  stderr?: {
    alias: string
  },
  files?: FileOutputModel[],
};

export type FileOutputModel = {
  fileRgx: string,
  extention: string,
  encoding: string,
  alias: string
};

export type File = {
  data: any,
  rawData: string
  fileRef: {
    name: string,
    size: number
  },
  extention: string,
  encoding: string,
};

export type ParameterModel = {
  name: string,
  type: ParameterType,
  description?: string,
  position: number,
  flag?: string,
  options: {
    static: boolean,
    required: boolean,
    endpointId?: string,
    default: string
  }
};

export enum ParameterType {
  Primitive,
  File
}

/**
 *  name: Identifier of the param.
 *  type: Constraint of the values type.
 *  default: Default values to apply if parameter.values not present in request, if null parameter will not be included in the call.
 *  required: If parameter not present in request, the flag and default values are used if provided else an error is generated.
 *  static: Ignores values of the request and uses default values.
 *  localFile: If true, the values must refere to a name of a file present in the uploaded files.
 */

const parameterSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  type: {
    type: String,
    required: true,
    enum: [ParameterType.Primitive, ParameterType.File]
  },
  description: String,
  flag: {
    type: String
  },
  position: {
    type: Number,
    required: true
  },
  options: {
    static: {
      type: Boolean,
      required: true
    },
    required: {
      type: Boolean,
      required: true
    },
    endpointId: {
      type: mongoose.Schema.Types.ObjectId,
      validate: {
        isAsync: true,
        validator: (value: string, cb: any) => {
          if (!value) {
            cb(true);
          }

          Endpoint.findOne({ _id: value }, (err, doc) => {
            if (err) {
              return cb(false, err);
            }
            else if (doc) {
              return cb(true);
            }

            cb(false);
          });
        },
        message: "Invalid endpoint _id."
      }
    },
    default: String
  }
}, { _id: false });

const fileOutputSchema = new mongoose.Schema({
  fileRgx: {
    type: String,
    required: true
  },
  extention: String,
  encoding: {
    default: "utf-8",
    type: String,
  },
  alias: {
    type: String,
    required: true
  }
}, { _id: false });

const outputSchema = new mongoose.Schema({
  files: [fileOutputSchema],
  stdout: {
    alias: {
      default: "stdout",
      type: String
    },
    extention: String
  },
  stderr: {
    alias: {
      default: "stderr",
      type: String
    }
  }
}, { _id: false });

const algorithmSchema = new mongoose.Schema({
  version: {
    type: String,
    required: true
  },
  description: String,
  entryApp: {
    appName: String,
    localFile: Boolean,
  },
  files: [String],
  parameters: {
    type: [parameterSchema],
    validate: {
      validator: (params: ParameterModel[]) => {
        for (let i = 0; i < params.length; i++) {
          for (let n = i + 1; n < params.length; n++) {
            if (params[i].name === params[n].name) {
              return false;
            }
          }
        }
        return true;
      },
      message: "Duplicate parameter name field"
    }
  },
  output: {
    type: outputSchema,
    validate: {
      validator: (output: OutputModel) => {
        const fout = output.files;
        for (let i = 0; i < fout.length; i++) {
          for (let n = i + 1; n < fout.length; n++) {
            if (fout[i].alias === fout[n].alias) {
              return false;
            }
          }
        }
        for (let i = 0; i < fout.length; i++) {
          if (fout[i].alias === output.stdout.alias || fout[i].alias === output.stderr.alias) {
            return false;
          }
        }
        return true;
      },
      message: "Duplicate `alias` field name."
    }
  }
});

const appSchema = new mongoose.Schema({
  author: {
    type: String,
    required: true,
    minlength: 3
  },
  name: {
    type: String,
    required: true,
    minlength: 3
  },
  description: String,
  algorithms: [algorithmSchema]
});

appSchema.index({ author: 1, name: 1 }, { unique: true });

algorithmSchema.pre("validate", function validate(next) {
  const algorithm = this;

  const outParam: ParameterModel = {
    name: "outputDir",
    type: ParameterType.Primitive,
    description: "Output directory path. Files created by the aplication on this folder are read, parsed and returned.",
    position: algorithm.parameters.length,
    options: {
      static: true,
      required: true,
      default: "path/to/some/dir",
    },
  };

  if (algorithm.isModified("parameters")) {
    const param = algorithm.parameters.find((p: any) => {
      return p.name === outParam.name;
    });

    const i = algorithm.parameters.indexOf(param);

    if (i !== -1) {
      outParam.flag = param.flag;
      outParam.position = i;
      algorithm.parameters[i] = outParam;
    }
    else if (algorithm.output.files.length !== 0) {
      algorithm.parameters.push(outParam);
    }
  }

  if (algorithm.isModified("output")) {
    const param = algorithm.parameters.find((p: any) => {
      return p.name === outParam.name;
    });

    if (algorithm.output.files.length === 0) {
      const i = algorithm.parameters.indexOf(param);
      if (i !== -1) {
        algorithm.parameters.splice(i, 1);
      }
    }
    else if (!param) {
      algorithm.parameters.push(outParam);
    }
  }

  next();
});

const Application = mongoose.model("Application", appSchema);
export default Application;
