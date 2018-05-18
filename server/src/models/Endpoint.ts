import * as mongoose from "mongoose";

export type EndpointModel = mongoose.Document & {
  url: string,
  description: string,
  method: string,
  parameters?: any[];
};

export type EndpointParamModel = {
  key: string,
  description: string
};

const parameterSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  description: String
}, { _id: false });

export enum HTTPMethod {
  GET,
  POST
}

const endpointSchema = new mongoose.Schema({
  url: {
    type: String,
    required: true,
    unique: true
  },
  method: {
    type: String,
    required: true,
    enum: [HTTPMethod.GET, HTTPMethod.POST]
  },
  description: String,
  parameters: [parameterSchema]
});


endpointSchema.pre("remove", function (next) {
  mongoose.model("Application").update({
    "algorithms.parameters.options.endpointId": this._id
  },
    { $unset: { "algorithms.$[].parameters.$[].options.endpointId": 1 } },
    { multi: true },
    (res: any, res2: any) => {
      console.log(res, res2);
      next();
    });
});

const Endpoint = mongoose.model("Endpoint", endpointSchema);
export default Endpoint;
