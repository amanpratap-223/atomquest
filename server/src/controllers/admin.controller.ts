import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import User from '../models/User';
import Goal from '../models/Goal';
import Checkin from '../models/Checkin';
import Cycle from '../models/Cycle';
import AuditLog from '../models/AuditLog';

// ── Users ─────────────────────────────────────────────────────────────────────
export const getUsers = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const users = await User.find().select('-passwordHash').populate('managerId', 'name');
    res.json({ success: true, users });
  } catch (err: any) { res.status(500).json({ success: false, message: err.message }); }
};

export const createUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, email, password, role, department, designation, managerId } = req.body;
    const user = await User.create({ name, email, passwordHash: password, role, department, designation, managerId });
    res.status(201).json({ success: true, user });
  } catch (err: any) { res.status(400).json({ success: false, message: err.message }); }
};

export const updateUserRole = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { role } = req.body;
    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true }).select('-passwordHash');
    if (!user) { res.status(404).json({ success: false, message: 'User not found' }); return; }
    await AuditLog.create({ entityType: 'user', entityId: user._id, changedBy: req.user!.id, changedByName: req.user!.name, field: 'role', oldValue: '', newValue: role, action: 'Role Changed' });
    res.json({ success: true, user });
  } catch (err: any) { res.status(400).json({ success: false, message: err.message }); }
};

// ── Cycles ────────────────────────────────────────────────────────────────────
export const getCycles = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const cycles = await Cycle.find().sort({ createdAt: -1 });
    res.json({ success: true, cycles });
  } catch (err: any) { res.status(500).json({ success: false, message: err.message }); }
};

export const createCycle = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const cycle = await Cycle.create(req.body);
    res.status(201).json({ success: true, cycle });
  } catch (err: any) { res.status(400).json({ success: false, message: err.message }); }
};

export const updateCycle = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const cycle = await Cycle.findByIdAndUpdate(req.params.id, req.body, { new: true });
    await AuditLog.create({ entityType: 'cycle', entityId: cycle!._id, changedBy: req.user!.id, changedByName: req.user!.name, field: 'windows', oldValue: '', newValue: JSON.stringify(req.body), action: 'Cycle Window Updated' });
    res.json({ success: true, cycle });
  } catch (err: any) { res.status(400).json({ success: false, message: err.message }); }
};

// ── Goal unlock (Admin only) ───────────────────────────────────────────────────
export const unlockGoal = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const goal = await Goal.findByIdAndUpdate(req.params.id, { status: 'draft', lockedAt: undefined }, { new: true });
    if (!goal) { res.status(404).json({ success: false, message: 'Goal not found' }); return; }
    await AuditLog.create({ entityType: 'goal', entityId: goal._id, changedBy: req.user!.id, changedByName: req.user!.name, field: 'status', oldValue: 'locked', newValue: 'draft', action: 'Admin Goal Unlock' });
    res.json({ success: true, goal });
  } catch (err: any) { res.status(500).json({ success: false, message: err.message }); }
};

// ── Audit Trail ───────────────────────────────────────────────────────────────
export const getAuditLogs = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { entityType, from, to, userId } = req.query;
    const filter: any = {};
    if (entityType) filter.entityType = entityType;
    if (userId) filter.changedBy = userId;
    if (from || to) filter.timestamp = { ...(from && { $gte: new Date(from as string) }), ...(to && { $lte: new Date(to as string) }) };
    const logs = await AuditLog.find(filter).sort({ timestamp: -1 }).limit(200);
    res.json({ success: true, logs });
  } catch (err: any) { res.status(500).json({ success: false, message: err.message }); }
};

// ── Org Reports ───────────────────────────────────────────────────────────────
export const getAchievementReport = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const goals = await Goal.find().populate('employeeId', 'name email department designation');
    const checkins = await Checkin.find();
    const report = goals.map(goal => {
      const emp = goal.employeeId as any;
      const q1 = checkins.find(c => c.goalId.toString() === goal._id.toString() && c.period === 'Q1');
      const q2 = checkins.find(c => c.goalId.toString() === goal._id.toString() && c.period === 'Q2');
      const q3 = checkins.find(c => c.goalId.toString() === goal._id.toString() && c.period === 'Q3');
      const q4 = checkins.find(c => c.goalId.toString() === goal._id.toString() && c.period === 'Q4');
      return { employee: { name: emp?.name, department: emp?.department }, goal: { title: goal.title, thrustArea: goal.thrustArea, uomType: goal.uomType, target: goal.target, weightage: goal.weightage, status: goal.status }, q1: q1 ? { achievement: q1.actualAchievement, score: q1.progressScore } : null, q2: q2 ? { achievement: q2.actualAchievement, score: q2.progressScore } : null, q3: q3 ? { achievement: q3.actualAchievement, score: q3.progressScore } : null, q4: q4 ? { achievement: q4.actualAchievement, score: q4.progressScore } : null };
    });
    res.json({ success: true, report });
  } catch (err: any) { res.status(500).json({ success: false, message: err.message }); }
};
