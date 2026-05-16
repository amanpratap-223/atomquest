import { Response } from 'express';
import { z } from 'zod';
import { AuthRequest } from '../middleware/auth.middleware';
import Checkin from '../models/Checkin';
import Goal from '../models/Goal';
import Cycle from '../models/Cycle';
import { computeProgressScore } from '../services/scoreService';

const checkinSchema = z.object({
  goalId:            z.string(),
  cycleId:           z.string(),
  period:            z.enum(['Q1','Q2','Q3','Q4']),
  actualAchievement: z.union([z.number(), z.string()]),
  status:            z.enum(['not_started','on_track','completed']).optional(),
});

export const submitCheckin = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const data = checkinSchema.parse(req.body);

    // Verify cycle window is open
    const cycle = await Cycle.findById(data.cycleId);
    if (cycle && !cycle.isCurrentWindowOpen(data.period)) {
      res.status(400).json({ success: false, message: `${data.period} check-in window is not currently open` });
      return;
    }

    // Goal must be locked/approved
    const goal = await Goal.findOne({ _id: data.goalId, employeeId: req.user!.id });
    if (!goal) { res.status(404).json({ success: false, message: 'Goal not found' }); return; }
    if (!['locked','approved'].includes(goal.status)) {
      res.status(403).json({ success: false, message: 'Can only check in against approved/locked goals' });
      return;
    }

    const progressScore = computeProgressScore(goal.uomType, goal.target as any, data.actualAchievement);

    const checkin = await Checkin.findOneAndUpdate(
      { goalId: data.goalId, employeeId: req.user!.id, period: data.period },
      { ...data, employeeId: req.user!.id, progressScore, checkinDate: new Date() },
      { upsert: true, new: true }
    );

    res.status(201).json({ success: true, checkin });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
};

export const getCheckins = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { employeeId, period, cycleId } = req.query;
    const filter: any = {};
    if (employeeId) filter.employeeId = employeeId;
    else filter.employeeId = req.user!.id;
    if (period) filter.period = period;
    if (cycleId) filter.cycleId = cycleId;
    const checkins = await Checkin.find(filter).populate('goalId', 'title thrustArea uomType target weightage');
    res.json({ success: true, checkins });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const addManagerComment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { comment } = req.body;
    if (!comment) { res.status(400).json({ success: false, message: 'Comment required' }); return; }
    const checkin = await Checkin.findByIdAndUpdate(req.params.id, { managerComment: comment }, { new: true });
    res.json({ success: true, checkin });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};
