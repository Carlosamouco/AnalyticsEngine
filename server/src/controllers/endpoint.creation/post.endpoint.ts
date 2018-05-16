import { Request, Response, NextFunction } from "express";

import { default as Endpoint, EndpointModel } from "../../models/Endpoint";
import { isString } from "util";

export async function postCreateEndpoint(req: Request, res: Response, next: NextFunction) {
  const errors: string[] = [];

  if (!isString(req.body.url)) {
    errors.push("`url` must be a string.");
  }

  if (!isString(req.body.description) && req.body.description) {
    errors.push("`description` must be a string.");
  }
  else {
    req.body.description = req.body.description || "";
  }

  if (errors.length !== 0) {
    return res.status(400).json({ errors });
  }

  const endpoint = new Endpoint({
    url: req.body.url,
    description: req.body.description
  });

  try {
    await endpoint.save();
  }
  catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ errors: ["There is already an application with the specified url."] });
    }
    return next(err);
  }

  const resEndpoint = endpoint.toObject();
  delete resEndpoint.__v;

  return res.json(resEndpoint);
}

export async function postDeleteEndpoint(req: Request, res: Response, next: NextFunction) {
  const errors: string[] = [];

  if (!isString(req.body.id)) {
    errors.push("Failed to cast `id` to string.");
  }

  if (errors.length !== 0) {
    return res.status(400).json({ errors });
  }

  let existingEndpoint: EndpointModel;

  try {
    existingEndpoint = <EndpointModel>(await Endpoint.findOne({ _id: req.body.id }));
  }
  catch (err) {
    return next(err);
  }

  if (!existingEndpoint) {
    return res.status(400).json({ errors: ["There is no endpoint with the specified id."] });
  }
  else {
    try {
      await existingEndpoint.remove();
    }
    catch (err) {
      return next(err);
    }

    const resEndpoint = existingEndpoint.toObject();
    delete resEndpoint.__v;

    return res.json(resEndpoint);
  }
}

export async function postUpdateEndpoint(req: Request, res: Response, next: NextFunction) {
  const errors: string[] = [];

  if (!isString(req.body.id)) {
    errors.push("Failed to cast `id` to string.");
  }

  if (!isString(req.body.url)) {
    errors.push("`url` must be a string.");
  }

  if (!isString(req.body.description) && req.body.description) {
    errors.push("`description` must be a string.");
  }
  else {
    req.body.description = req.body.description || "";
  }


  if (errors.length !== 0) {
    return res.status(400).json({ errors });
  }

  let existingEndpoint: EndpointModel;

  try {
    existingEndpoint = <EndpointModel>(await Endpoint.findOne({ _id: req.body.id }));
  }
  catch (err) {
    return next(err);
  }

  if (!existingEndpoint) {
    return res.status(400).json({ errors: ["There is no application with the specified id."] });
  }
  else {
    existingEndpoint.url = req.body.url;
    existingEndpoint.description = req.body.description;

    try {
      await existingEndpoint.save();
    }
    catch (err) {
      if (err.code === 11000) {
        return res.status(400).json({ errors: ["There is already an endpoint with the specified url."] });
      }
      return next(err);
    }

    const resEndopoint = existingEndpoint.toObject();
    delete resEndopoint.__v;

    return res.json(resEndopoint);
  }
}
