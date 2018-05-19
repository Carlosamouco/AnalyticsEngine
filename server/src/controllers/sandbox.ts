import { Request, Response, NextFunction } from "express";

import { Sandbox } from "../docker_sandbox/sandbox";

export function registerContainer(req: Request, res: Response) {
  Sandbox.getInstance().addContainer(req.body.ip.slice(0, -1));
  res.status(200).end();
}
