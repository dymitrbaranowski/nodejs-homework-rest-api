import bcrypt from "bcryptjs";

import User from "../models/User.js";

import { ctrlWrapper } from "../decorators/index.js";

import { HttpError } from "../helpers/index.js";

const signup = async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  if (user) {
    throw HttpError(409, " Email already exist");
  }

  const hashPassword = await bcrypt.hash(password, 10);
  const newUser = await User.create(req.body);

  res.status(201).json({
    username: newUser.username,
    email: newUser.email,
  });
};

export default {
  signup: ctrlWrapper(signup),
};
