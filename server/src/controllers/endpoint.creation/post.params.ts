import { Request, Response, NextFunction } from "express";

import { default as Endpoint, EndpointModel, EndpointParamModel } from "../../models/Endpoint";

export default async function postUpdateEndpointParams(req: Request, res: Response, next: NextFunction) {
  let existingEndpoint: EndpointModel;

  try {
    existingEndpoint = <EndpointModel>(await Endpoint.findOne({ _id: req.body.id }));
  }
  catch (err) {
    return next(err);
  }

  if (!existingEndpoint) {
    return res.status(400).json({ messages: ["Provided `id` is not registered."] });
  }
  else {
    existingEndpoint.parameters = [];
    req.body.parameters = req.body.parameters ? req.body.parameters : [];

    if (!(req.body.parameters instanceof Array)) {
      return res.status(400).json({ messages: ["`parameters` must be an array."] });
    }
    const errors: any[] = [];

    req.body.parameters.forEach((parameter: EndpointParamModel) => {
      existingEndpoint.parameters.push(parameter);
    });

    const resObj: any = {};

    try {
      await existingEndpoint.validate();
    }
    catch (err) {
      handleValidationError(err, resObj);
    }

    if (Object.keys(resObj).length !== 0) {
      return res.status(400).json(resObj);
    }

    try {
      await existingEndpoint.save();
    }
    catch (err) {
      return next(err);
    }

    const endpoint = existingEndpoint.toObject();
    delete endpoint.__v;

    return res.json(endpoint);
  }
}

function handleValidationError(err: any, res: any) {
  for (const property in err.errors) {
    if (err.errors.hasOwnProperty(property)) {
      const i = property.indexOf("parameters");
      const key = (i !== -1) ? property.substr(i) : "";
      res[key] = {
        messages: [err.errors[property].message],
        value: err.errors[property].value
      };
    }
  }
}
