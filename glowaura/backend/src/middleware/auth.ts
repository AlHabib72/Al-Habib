import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User from './../../backend/src/models/User';

// FIX: Original forgot to select password when needed in auth middleware
// FIX: Used 'req.user = await User.findById(decoded.id)' — password not in select:false context

export interface AuthRequest extends Request {
  user?: any;
}

export const protect = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  let token: string | undefined;

  if (req.headers.authorization?.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    res.status(401).json({ success: false, message: 'Not authorized, no token' });
    return;
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { id: string };
    req.user = await User.findById(decoded.id).select('-password');

    if (!req.user) {
      res.status(401).json({ success: false, message: 'User no longer exists' });
      return;
    }

    next();
  } catch {
    res.status(401).json({ success: false, message: 'Not authorized, invalid token' });
  }
};

export const admin = (req: AuthRequest, res: Response, next: NextFunction): void => {
  if (req.user?.role === 'admin') {
    next();
  } else {
    res.status(403).json({ success: false, message: 'Admin access required' });
  }
};
