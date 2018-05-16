import { Request, Response, NextFunction } from "express";
import * as mongoose from "mongoose";

import { default as Application } from "../models/Application";
import { Sandbox } from "../docker_sandbox/sandbox";

export * from "./app.creation/";
export * from "./app.invoke/";

export function getApplications(req: Request, res: Response, next: NextFunction) {
  Application.find({}, { algorithms: { $slice: -1 } })
    .select("author name description id algorithms._id algorithms.version algorithms.description")
    .exec((err, apps) => {
      if (err) return next(err);
      if (req.query.q) {
        for (let i = 0; i < apps.length; ++i) {
          const tokens = req.query.q.split(" ");
          if (!containsSubstr([(<any>apps[i]).name, (<any>apps[i]).author], tokens)) {
            apps.splice(i--, 1);
          }
        }
      }
      return res.status(200).json(apps);
    });
}

function containsSubstr(names: string[], tokens: string[]) {
  for (const name of names) {
    for (let i = 0; i < tokens.length; ++i) {
      if (name.toLowerCase().indexOf(tokens[i].toLowerCase()) >= 0) {
        tokens.splice(i--, 1);
      }
    }
  }
  return tokens.length === 0;
}

export function getApplication(req: Request, res: Response, next: NextFunction) {
  Application.find({ _id: req.params.app_id })
    .select("-__v")
    .exec((err, apps) => {
      if (err) return next(err);
      if (apps.length === 0) {
        return res.status(404).send("Application Not Found!");
      }
      return res.status(200).json(apps[0]);
    });
}

export function getApplicationVersion(req: Request, res: Response, next: NextFunction) {
  Application.aggregate([
    { $match: { _id: mongoose.Types.ObjectId(req.params.app_id), "algorithms._id": mongoose.Types.ObjectId(req.params.version_id) } },
    { $project: { __v: 0 } },
    {
      $project: {
        _id: 1, description: 1, name: 1, author: 1, algorithm: {
          $filter: {
            input: "$algorithms",
            as: "a",
            cond: {
              $eq: ["$$a._id", mongoose.Types.ObjectId(req.params.version_id)]
            }
          }
        }
      }
    },
    { $unwind: "$algorithm" },
    { $unwind: { path: "$algorithm.parameters", "preserveNullAndEmptyArrays": true } },
    {
      $lookup: {
        from: "endpoints",
        let: { endpoint_id: "$algorithm.parameters.options.endpointId" },
        pipeline: [
          { $match: { $expr: { $eq: ["$_id", "$$endpoint_id"] } } },
          { $project: { __v: 0 } }
        ],
        as: "algorithm.parameters.options.endpoint"
      }
    },
    { $unwind: { path: "$algorithm.parameters.options.endpoint", "preserveNullAndEmptyArrays": true } },
    { $project: { "algorithm.parameters.options.endpointId": 0 } },
    {
      $group: {
        _id: {
          _id: "$_id", description: "$description", name: "$name", author: "$author",
          algorithm: {
            _id: "$algorithm._id",
            description: "$algorithm.description",
            entryApp: "$algorithm.entryApp",
            files: "$algorithm.files",
            output: "$algorithm.output",
            version: "$algorithm.version"
          }
        },
        parameters: { $push: "$algorithm.parameters" }
      }
    },
    {
      $project: {
        _id: "$_id._id", description: "$_id.description", name: "$_id.name", author: "$_id.author",
        algorithm: {
          _id: "$_id.algorithm._id",
          description: "$_id.algorithm.description",
          entryApp: "$_id.algorithm.entryApp",
          files: "$_id.algorithm.files",
          output: "$_id.algorithm.output",
          version: "$_id.algorithm.version",
          parameters: "$parameters"
        }
      }
    }])
    .exec((err, app) => {
      if (err) return next(err);
      if (app.length === 0) {
        return res.status(404).send("Application Not Found!");
      }
      return res.status(200).json(app[0]);
    });
}
