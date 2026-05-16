import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { ENV } from '../config/env';
import User from '../models/User';

export interface AuthRequest extends Request {
  user?: { id: string; role: string; name: string; email: string };
}

export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) { res.status(401).json({ success: false, message: 'No token provided' }); return; }
  try {
    const decoded = jwt.verify(token, ENV.JWT_SECRET as string) as any;
    const user = await User.findById(decoded.id).select('-passwordHash');
    if (!user || !user.isActive) { res.status(401).json({ success: false, message: 'Invalid token' }); return; }
    req.user = { id: user.id, role: user.role, name: user.name, email: user.email };
    next();
  } catch {
    res.status(401).json({ success: false, message: 'Token expired or invalid' });
  }
};

export const requireRole = (...roles: string[]) => (req: AuthRequest, res: Response, next: NextFunction): void => {
  if (!req.user || !roles.includes(req.user.role)) {
    res.status(403).json({ success: false, message: `Access denied. Required role: ${roles.join(' or ')}` });
    return;
  }
  next();
};
