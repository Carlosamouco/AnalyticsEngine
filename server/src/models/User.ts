import * as bcrypt from "bcrypt-nodejs";
import * as mongoose from "mongoose";

export type UserModel = mongoose.Document & {
  username: string,
  password: string,
  role: UserRoles,

  tokens: string[],

  comparePassword: comparePasswordFunction
};

export enum UserRoles {
  Super,
  Admin,
  Normal
}

type comparePasswordFunction = (candidatePassword: string, cb: (err: any, isMatch: boolean) => void) => void;

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    unique: true,
    required: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    required: true,
    enum: [UserRoles.Super, UserRoles.Admin, UserRoles.Normal],
  },
  tokens: Array
}, { timestamps: true });

/**
 * Password hash middleware.
 */
userSchema.pre("save", function save(next) {
  const user = this;
  if (!user.isModified("password")) { return next(); }
  bcrypt.genSalt(10, (err, salt) => {
    if (err) { return next(err); }
    bcrypt.hash(user.password, salt, undefined, (err: mongoose.Error, hash) => {
      if (err) { return next(err); }
      user.password = hash;
      next();
    });
  });
});

const comparePassword: comparePasswordFunction = function (candidatePassword, cb) {
  bcrypt.compare(candidatePassword, this.password, (err: mongoose.Error, isMatch: boolean) => {
    cb(err, isMatch);
  });
};

userSchema.methods.comparePassword = comparePassword;

// export const User: UserType = mongoose.model<UserType>('User', userSchema);
const User = mongoose.model("User", userSchema);
export default User;
