import { Request, Response, NextFunction } from "express";

import { Sandbox } from "../docker_sandbox/sandbox";

/**
 * Internal endpoint only callable by containers when registering that hey are operational.
 * @param req Express request
 * @param res Express Response
 */
export function registerContainer(req: Request, res: Response) {
  Sandbox.getInstance().addContainer(req.body.ip.slice(0, -1));
  res.status(200).end();
}
