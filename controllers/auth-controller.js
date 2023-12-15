import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { nanoid } from 'nanoid';
import 'dotenv/config.js';

import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);

const __dirname = path.dirname(__filename);
import fs from 'fs/promises';
import Jimp from 'jimp';

import gravatar from 'gravatar';

import User from '../models/User.js';

import { ctrlWrapper } from '../decorators/index.js';

import { HttpError, sendEmail } from '../helpers/index.js';

const { JWT_SECRET, BASE_URL } = process.env;

const avatarDir = path.join(__dirname, '../', 'public', 'avatars');

const signup = async (req, res) => {
  const { email, password, subscription } = req.body;
  const user = await User.findOne({ email, subscription });
  if (user) {
    throw HttpError(409, ' Email already exist');
  }

  const hashPassword = await bcrypt.hash(password, 10);
  const verificationToken = nanoid();

  const avatarURL = gravatar.url(email);

  const newUser = await User.create({
    ...req.body,
    password: hashPassword,
    verificationCode: verificationToken,
    avatarURL,
  });
  const verifyEmail = {
    to: email,
    subject: 'Verify email',
    html: `<a target="_blank" href="${BASE_URL}/users/verify/${verificationToken}">Click verify email</a>`,
  };
  await sendEmail(verifyEmail);

  res.status(201).json({
    user: {
      email: newUser.email,
      subscription: newUser.subscription,
    },
  });
};

const verify = async (req, res) => {
  const { verificationToken } = req.params;
  const user = await User.findOne({ verificationToken });
  if (!user) {
    throw HttpError(401, 'Email not found');
  }

  await User.findByIdAndUpdate(user._id, {
    verify: true,
    verificationToken: '',
  });

  res.json({
    message: 'Verification successful',
  });
};

const resendVerify = async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  if (!user) {
    throw HttpError(401, 'User not found');
  }
  if (user.verify) {
    throw HttpError(400, 'Verification has already been passed');
  }
  const verifyEmail = {
    to: email,
    subject: 'Verify email',
    html: `<a target="_blank" href="${BASE_URL}/users/verify/${user.verificationToken}">Click verify email</a>`,
  };

  await sendEmail(verifyEmail);

  res.status(200).json({
    message: 'Verification email sent',
  });
};

const signin = async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user) {
    throw HttpError(401, 'Email or password is wrong');
  }

  if (!user.verify) {
    throw HttpError(401, 'Email not verify');
  }

  const passwordCompare = await bcrypt.compare(password, user.password);
  if (!passwordCompare) {
    throw HttpError(401, 'Email or password is wrong');
  }

  const payload = {
    id: user._id,
  };

  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '23h' });
  await User.findByIdAndUpdate(user._id, { token });

  res.status(200).json({
    token: token,
    user: {
      email: user.email,
      subscription: user.subscription,
    },
  });
};

const getCurrent = async (req, res) => {
  const { email, subscription } = req.user;

  res.status(200).json({
    email,
    subscription,
  });
};

const signout = async (req, res) => {
  const { _id } = req.user;
  await User.findByIdAndUpdate(_id, { token: '' });

  if (!result) {
    throw HttpError(404, 'Not found');
  }
  res.status(204).json({});
};

const updateAvatar = async (req, res) => {
  const { _id } = req.user;
  const { path: tempUpload, originalname } = req.file;
  const img = await Jimp.read(tempUpload);
  await img
    .autocrop()
    .cover(250, 250, Jimp.HORIZONTAL_ALIGN_CENTER | Jimp.VERTICAL_ALIGN_MIDDLE)
    .writeAsync(tempUpload);

  const UploadError = message => {
    const error = new Error(message);
    return error;
  };

  if (!tempUpload) {
    throw UploadError('tempUpload is not defined');
  }

  const filename = `${Date.now()}-${originalname}`;
  const avatarURL = path.join('avatars', filename);

  const newPath = path.join(avatarDir, filename);
  await fs.rename(tempUpload, newPath);

  await User.findByIdAndUpdate(_id, { avatarURL });
  res.status(200).json({ avatarURL });
};

export default {
  signup: ctrlWrapper(signup),
  verify: ctrlWrapper(verify),
  resendVerify: ctrlWrapper(resendVerify),
  signin: ctrlWrapper(signin),
  getCurrent: ctrlWrapper(getCurrent),
  signout: ctrlWrapper(signout),
  updateAvatar: ctrlWrapper(updateAvatar),
};
