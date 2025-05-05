// server/src/services/auth.ts

import type { Request } from 'express';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();

const secretKey = process.env.JWT_SECRET_KEY || 'fallback_secret';
const expiration = '1h';

// The shape Apollo will see in every resolver: context.user.data._id, etc.
export interface GraphQLContext {
  user: {
    data: {
      _id: string;
      username: string;
      email: string;
    };
  } | null;
}

/**
 * Reads the Authorization header, verifies the JWT, and
 * returns { user } whose .data matches what signToken signed.
 */
export const authMiddleware = async ({
  req,
}: {
  req: Request;
}): Promise<GraphQLContext> => {
  // Grab token from header
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ')
    ? authHeader.slice(7).trim()
    : authHeader;

  if (!token) {
    return { user: null };
  }

  try {
    // Decode the full payload (we signed { data: user })
    const { data } = jwt.verify(token, secretKey) as {
      data: { _id: string; username: string; email: string };
    };
    // Return exactly the shape resolvers expect
    return { user: { data } };
  } catch (err) {
    console.warn('Invalid token', err);
    return { user: null };
  }
};

/**
 * Signs a JWT with the user object under `data`.
 * Resolvers will find decoded.data matching this.
 */
export const signToken = (user: {
  _id: string;
  username: string;
  email: string;
}): string => {
  return jwt.sign({ data: user }, secretKey, {
    expiresIn: expiration,
  });
};
