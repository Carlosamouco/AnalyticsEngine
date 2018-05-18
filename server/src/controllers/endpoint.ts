import { Request, Response, NextFunction } from "express";
import * as mongoose from "mongoose";

import { default as Endpoint } from "../models/Endpoint";

export * from "./endpoint.creation/";

export function getEndpoints(req: Request, res: Response, next: NextFunction) {
  Endpoint.find({})
    .select("url description method")
    .exec((err, endpoints) => {
      if (err) return next(err);
      return res.status(200).json(endpoints);
    });
}

export function getEndpoint(req: Request, res: Response, next: NextFunction) {
  try {
    Endpoint.find({ _id: req.params.endpoint_id })
      .select("-__v")
      .exec((err, endpoint) => {
        if (err) return next(err);
        return res.status(200).json(endpoint[0]);
      });
  }
  catch (err) {
    next(err);
  }
}
