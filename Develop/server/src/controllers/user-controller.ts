// server/src/controllers/user-controller.ts

import type { Request, Response } from 'express';
import User from '../models/User.js';
import { signToken } from '../services/auth.js';

// get a single user by either their id or their username
export const getSingleUser = async (req: Request, res: Response) => {
  const userId = req.user ? (req.user as any).data._id : req.params.id;
  const foundUser = await User.findOne({
    $or: [{ _id: userId }, { username: req.params.username }],
  });

  if (!foundUser) {
    return res.status(400).json({ message: 'Cannot find a user with this id!' });
  }

  return res.json(foundUser);
};

// create a user, sign a token, and send it back
export const createUser = async (req: Request, res: Response) => {
  const user = await User.create(req.body);

  if (!user) {
    return res.status(400).json({ message: 'Something is wrong!' });
  }

  // Coerce unknown _id into a string
  const token = signToken({
    _id: String((user._id as unknown)),
    username: user.username,
    email: user.email,
  });

  return res.json({ token, user });
};

// login a user, sign a token, and send it back
export const login = async (req: Request, res: Response) => {
  const user = await User.findOne({
    $or: [{ username: req.body.username }, { email: req.body.email }],
  });
  if (!user) {
    return res.status(400).json({ message: "Can't find this user" });
  }

  const correctPw = await user.isCorrectPassword(req.body.password);
  if (!correctPw) {
    return res.status(400).json({ message: 'Wrong password!' });
  }

  // Coerce unknown _id into a string
  const token = signToken({
    _id: String((user._id as unknown)),
    username: user.username,
    email: user.email,
  });

  return res.json({ token, user });
};

// save a book to a user's `savedBooks` field
export const saveBook = async (req: Request, res: Response) => {
  try {
    const updatedUser = await User.findOneAndUpdate(
      { _id: (req.user as any).data._id },
      { $addToSet: { savedBooks: req.body } },
      { new: true, runValidators: true }
    );
    return res.json(updatedUser);
  } catch (err) {
    console.error(err);
    return res.status(400).json(err);
  }
};

// remove a book from `savedBooks`
export const deleteBook = async (req: Request, res: Response) => {
  const updatedUser = await User.findOneAndUpdate(
    { _id: (req.user as any).data._id },
    { $pull: { savedBooks: { bookId: req.params.bookId } } },
    { new: true }
  );
  if (!updatedUser) {
    return res.status(404).json({ message: "Couldn't find user with this id!" });
  }
  return res.json(updatedUser);
};
