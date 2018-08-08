import * as passport from "passport";
import * as passportLocal from "passport-local";
import * as _ from "lodash";

import { default as User } from "../models/User";
import { Request, Response, NextFunction } from "express";

const LocalStrategy = passportLocal.Strategy;

passport.serializeUser<any, any>((user, done) => {
  done(undefined, user.id);
});

passport.deserializeUser((id, done) => {
  User.findById(id, (err, user) => {
    done(err, user);
  });
});


/**
 * Sign in using Email and Password.
 */
passport.use(new LocalStrategy({ usernameField: "username" }, (username, password, done) => {
  User.findOne({ username: username.toLowerCase() }, (err, user: any) => {
    if (err) {
      return done(err);
    }
    if (!user) {
      return done(undefined, false, { message: `Username ${username} not found.` });
    }
    user.comparePassword(password, (err: Error, isMatch: boolean) => {
      if (err) {
        return done(err);
      }
      if (isMatch) {
        return done(undefined, user);
      }
      return done(undefined, false, { message: "Invalid email or password." });
    });
  });
}));

/**
 * Login Required middleware.
 */
export function isAuthenticated(req: Request, res: Response, next: NextFunction) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect("/endpoints");
}

/**
 * Authorization Required middleware.
 */
export function isAuthorized(req: Request, res: Response, next: NextFunction) {
  if (_.find(req.user.tokens)) {
    next();
  } else {
    res.status(403).send("Unauthorized access!");
  }
}
