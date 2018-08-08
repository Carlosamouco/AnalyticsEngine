import { default as User, UserModel, UserRoles } from "../models/User";
import { Request, Response, NextFunction } from "express";
import * as jsonwebtocken from "jsonwebtoken";

/**
 * Sign in using username and password. A JWT is returned for future authenticated requests.
 * No session is saved on the server.
 */
export async function postLogin(req: Request, res: Response, next: NextFunction) {

  let user: UserModel;

  try {
    user = <UserModel>await User.findOne({ username: req.body.username });
  }
  catch (err) {
    return next(err);
  }

  if (!user) {
    return res.status(403).json({ error: "`username` or `password` are incorrect!" });
  }

  user.comparePassword(req.body.password, (err, isValid) => {
    if (err) {
      return next(err);
    }

    if (isValid) {
      try {
        const token = jsonwebtocken.sign({ id: user._id, role: user.role }, process.env.SESSION_SECRET);
        return res.json({ token, role: user.role });
      }
      catch (err) {
        return next(err);
      }
    }

    return res.status(403).json({ error: "`username` or `password` are incorrect!" });
  });
}

/**
 * Sign in using username and password. A JWT is returned for future authenticated requests.
 * No session is saved on the server.
 */
export async function postCreateUser(req: Request, res: Response, next: NextFunction) {

  let existingUser: UserModel;

  try {
    existingUser = <UserModel>await User.findOne({ username: new RegExp("^" + req.body.username.toLowerCase(), "i") });
  }
  catch (err) {
    return next(err);
  }

  if (existingUser) {
    return res.status(400).json({ error: "username already in use!" });
  }

  const user = new User({
    username: req.body.username,
    password: req.body.password,
    role: req.body.role
  });

  try {
    await user.save();
  }
  catch (err) {
    next(err);
  }

  return res.status(201).send();
}

/**
 * Creates a new Super User (Base Admin) of the system.
 * @param userData Super User credentials.
 */
export async function createSuperUser(username: string, password: string) {
  const existingUser = <UserModel>await User.findOne({ role: UserRoles.Super });

  if (existingUser) {
    existingUser.username = username;
    existingUser.password = password;

    await existingUser.save();
  }
  else {
    const user = new User({
      username,
      password,
      role: UserRoles.Super
    });

    await user.save();
  }
}
