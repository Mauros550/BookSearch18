// server/src/services/resolvers.ts

import User from '../models/User.js';
import { signToken } from './auth.js';
import { GraphQLError } from 'graphql';

// Shape we expect after authMiddleware runs
interface Context {
  user: {
    data: {
      _id: string;
      username: string;
      email: string;
    };
  } | null;
}

export const resolvers = {
  Query: {
    me: async (_parent: any, _args: any, context: Context) => {
      if (!context.user) {
        throw new GraphQLError('Not logged in', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }
      return User.findById(context.user.data._id);
    },
  },

  Mutation: {
    addUser: async (
      _parent: any,
      { username, email, password }: { username: string; email: string; password: string }
    ) => {
      const user = await User.create({ username, email, password });
      // Coerce _id to string
      const idStr = String(user._id);
      const token = signToken({
        _id: idStr,
        username: user.username,
        email: user.email,
      });
      return { token, user };
    },

    login: async (
      _parent: any,
      { email, password }: { email: string; password: string }
    ) => {
      const user = await User.findOne({ email });
      if (!user) {
        throw new GraphQLError('No user found with this email', {
          extensions: { code: 'BAD_USER_INPUT' },
        });
      }

      const correctPw = await user.isCorrectPassword(password);
      if (!correctPw) {
        throw new GraphQLError('Incorrect password', {
          extensions: { code: 'BAD_USER_INPUT' },
        });
      }

      // Coerce _id to string
      const idStr = String(user._id);
      const token = signToken({
        _id: idStr,
        username: user.username,
        email: user.email,
      });
      return { token, user };
    },

    saveBook: async (
      _parent: any,
      { input }: { input: any },
      context: Context
    ) => {
      if (!context.user) {
        throw new GraphQLError('You must be logged in', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }
      return User.findByIdAndUpdate(
        context.user.data._id,
        { $addToSet: { savedBooks: input } },
        { new: true, runValidators: true }
      );
    },

    removeBook: async (
      _parent: any,
      { bookId }: { bookId: string },
      context: Context
    ) => {
      if (!context.user) {
        throw new GraphQLError('You must be logged in', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }
      return User.findByIdAndUpdate(
        context.user.data._id,
        { $pull: { savedBooks: { bookId } } },
        { new: true }
      );
    },
  },
};
