import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import EscalationRule from '../models/EscalationRule';

export const getRules = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const rules = await EscalationRule.find().sort({ createdAt: -1 });
    res.json({ success: true, rules });
  } catch (err: any) { res.status(500).json({ success: false, message: err.message }); }
};

export const createRule = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const rule = await EscalationRule.create(req.body);
    res.status(201).json({ success: true, rule });
  } catch (err: any) { res.status(400).json({ success: false, message: err.message }); }
};

export const updateRule = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const rule = await EscalationRule.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!rule) { res.status(404).json({ success: false, message: 'Rule not found' }); return; }
    res.json({ success: true, rule });
  } catch (err: any) { res.status(400).json({ success: false, message: err.message }); }
};

export const deleteRule = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await EscalationRule.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Rule deleted' });
  } catch (err: any) { res.status(500).json({ success: false, message: err.message }); }
};
