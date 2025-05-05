// server/src/routes/api/user-routes.ts

import { Router, Request, Response, NextFunction } from 'express';
import {
  createUser,
  getSingleUser,
  saveBook,
  deleteBook,
  login,
} from '../../controllers/user-controller.js';
import { authMiddleware } from '../../services/auth.js';

const router = Router();

// Public routes
router.post('/', createUser);
router.post('/login', login);

/**
 * Guard middleware that attaches req.user or sends 401.
 * Always returns void so TS is happy.
 */
const ensureAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const { user } = await authMiddleware({ req });
  if (!user) {
    // send 401 and exit this function
    res.status(401).json({ message: 'Not authenticated' });
    return;
  }
  // attach the decoded user payload and continue
  (req as any).user = user.data;
  next();
};

// Protected routes
router.get('/me', ensureAuth, getSingleUser);
router.put('/books', ensureAuth, saveBook);
router.delete('/books/:bookId', ensureAuth, deleteBook);

export default router;
