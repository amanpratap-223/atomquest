import { Response } from 'express';
import { z } from 'zod';
import { AuthRequest } from '../middleware/auth.middleware';
import Goal from '../models/Goal';
import AuditLog from '../models/AuditLog';

const goalSchema = z.object({
  thrustArea:  z.string().min(1),
  title:       z.string().min(3),
  description: z.string().min(5),
  uomType:     z.enum(['Min','Max','Timeline','Zero']),
  target:      z.union([z.number(), z.string()]),
  weightage:   z.number().min(10).max(100),
  cycleId:     z.string(),
  isShared:    z.boolean().optional(),
});

export const createGoal = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const data = goalSchema.parse(req.body);
    // Max 8 goals per cycle
    const count = await Goal.countDocuments({ employeeId: req.user!.id, cycleId: data.cycleId });
    if (count >= 8) { res.status(400).json({ success: false, message: 'Maximum 8 goals allowed per cycle' }); return; }
    const goal = await Goal.create({ ...data, employeeId: req.user!.id, status: 'draft' });
    res.status(201).json({ success: true, goal });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
};

export const getMyGoals = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { cycleId } = req.query;
    const filter: any = { employeeId: req.user!.id };
    if (cycleId) filter.cycleId = cycleId;
    const goals = await Goal.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, goals });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const updateGoal = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const goal = await Goal.findOne({ _id: req.params.id, employeeId: req.user!.id });
    if (!goal) { res.status(404).json({ success: false, message: 'Goal not found' }); return; }
    if (!['draft','rejected'].includes(goal.status)) {
      res.status(403).json({ success: false, message: 'Only draft or rejected goals can be edited' });
      return;
    }
    const data = goalSchema.partial().parse(req.body);
    Object.assign(goal, data);
    await goal.save();
    res.json({ success: true, goal });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
};

export const deleteGoal = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const goal = await Goal.findOne({ _id: req.params.id, employeeId: req.user!.id });
    if (!goal) { res.status(404).json({ success: false, message: 'Goal not found' }); return; }
    if (goal.status !== 'draft') { res.status(403).json({ success: false, message: 'Only draft goals can be deleted' }); return; }
    await goal.deleteOne();
    res.json({ success: true, message: 'Goal deleted' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const submitGoals = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { cycleId } = req.body;
    const goals = await Goal.find({ employeeId: req.user!.id, cycleId, status: 'draft' });
    if (goals.length === 0) { res.status(400).json({ success: false, message: 'No draft goals to submit' }); return; }
    // Weightage = 100 validation
    const allGoals = await Goal.find({ employeeId: req.user!.id, cycleId });
    const total = allGoals.reduce((s, g) => s + g.weightage, 0);
    if (total !== 100) {
      res.status(400).json({ success: false, message: `Total weightage must be 100%. Current: ${total}%` });
      return;
    }
    await Goal.updateMany({ employeeId: req.user!.id, cycleId, status: 'draft' }, { status: 'submitted' });
    res.json({ success: true, message: 'Goals submitted for manager approval' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};
