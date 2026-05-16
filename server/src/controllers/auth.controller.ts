import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import User from '../models/User';
import { ENV } from '../config/env';

const loginSchema = z.object({
  email:    z.string().email(),
  password: z.string().min(1),
});

const registerSchema = z.object({
  name:        z.string().min(2),
  email:       z.string().email(),
  password:    z.string().min(6),
  role:        z.enum(['employee','manager','admin']).optional(),
  department:  z.string().min(1),
  designation: z.string().min(1),
  managerId:   z.string().optional(),
});

function signToken(id: string) {
  return jwt.sign({ id }, ENV.JWT_SECRET as string, { expiresIn: ENV.JWT_EXPIRES as any });
}

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = loginSchema.parse(req.body);
    const user = await User.findOne({ email, isActive: true });
    if (!user || !(await user.comparePassword(password))) {
      res.status(401).json({ success: false, message: 'Invalid credentials' });
      return;
    }
    const token = signToken(user.id);
    res.json({ success: true, token, user: { id: user.id, name: user.name, email: user.email, role: user.role, department: user.department, designation: user.designation } });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
};

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const data = registerSchema.parse(req.body);
    const exists = await User.findOne({ email: data.email });
    if (exists) { res.status(409).json({ success: false, message: 'Email already registered' }); return; }
    const user = await User.create({ ...data, passwordHash: data.password });
    const token = signToken(user.id);
    res.status(201).json({ success: true, token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
};

export const me = async (req: any, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.user.id).select('-passwordHash').populate('managerId', 'name email');
    res.json({ success: true, user });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};
