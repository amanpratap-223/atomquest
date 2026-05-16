import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import Goal from '../models/Goal';
import User from '../models/User';
import AuditLog from '../models/AuditLog';
import Checkin from '../models/Checkin';

export const getTeamGoals = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const team = await User.find({ managerId: req.user!.id, isActive: true });
    const teamIds = team.map(u => u._id);
    const { cycleId } = req.query;
    const filter: any = { employeeId: { $in: teamIds }, status: { $in: ['submitted','approved','locked','rejected'] } };
    if (cycleId) filter.cycleId = cycleId;
    const goals = await Goal.find(filter).populate('employeeId', 'name email department designation');
    // Group by employee
    const sheets: Record<string, any> = {};
    for (const goal of goals) {
      const emp = goal.employeeId as any;
      if (!sheets[emp._id]) sheets[emp._id] = { employee: emp, goals: [], totalWeightage: 0, status: 'submitted' };
      sheets[emp._id].goals.push(goal);
      sheets[emp._id].totalWeightage += goal.weightage;
    }
    res.json({ success: true, sheets: Object.values(sheets) });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const approveGoals = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { employeeId, cycleId } = req.body;
    const goals = await Goal.find({ employeeId, cycleId, status: 'submitted' });
    if (!goals.length) { res.status(404).json({ success: false, message: 'No submitted goals found' }); return; }
    // Validate weightage = 100
    const total = goals.reduce((s, g) => s + g.weightage, 0);
    if (total !== 100) { res.status(400).json({ success: false, message: `Total weightage must be 100%. Got ${total}%` }); return; }
    const now = new Date();
    await Goal.updateMany({ employeeId, cycleId, status: 'submitted' }, { status: 'locked', lockedAt: now });
    // Log audit
    await AuditLog.create({
      entityType: 'goal', entityId: goals[0]._id,
      changedBy: req.user!.id, changedByName: req.user!.name,
      field: 'status', oldValue: 'submitted', newValue: 'locked',
      action: 'Goal Approved & Locked',
    });
    res.json({ success: true, message: 'Goals approved and locked' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const rejectGoals = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { employeeId, cycleId, comment } = req.body;
    if (!comment) { res.status(400).json({ success: false, message: 'Comment required for return' }); return; }
    await Goal.updateMany({ employeeId, cycleId, status: 'submitted' }, { status: 'rejected', managerComment: comment });
    await AuditLog.create({
      entityType: 'goal', entityId: employeeId,
      changedBy: req.user!.id, changedByName: req.user!.name,
      field: 'status', oldValue: 'submitted', newValue: 'rejected',
      action: 'Goals Returned for Rework',
    });
    res.json({ success: true, message: 'Goals returned for rework' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const inlineEditGoal = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const goal = await Goal.findOne({ _id: req.params.goalId, status: 'submitted' });
    if (!goal) { res.status(404).json({ success: false, message: 'Goal not found or already approved' }); return; }
    const { target, weightage } = req.body;
    const oldTarget = goal.target; const oldWeightage = goal.weightage;
    if (target !== undefined) goal.target = target;
    if (weightage !== undefined) goal.weightage = weightage;
    await goal.save();
    if (target !== undefined) {
      await AuditLog.create({ entityType: 'goal', entityId: goal._id, changedBy: req.user!.id, changedByName: req.user!.name, field: 'target', oldValue: String(oldTarget), newValue: String(target), action: 'Inline Target Edit' });
    }
    if (weightage !== undefined) {
      await AuditLog.create({ entityType: 'goal', entityId: goal._id, changedBy: req.user!.id, changedByName: req.user!.name, field: 'weightage', oldValue: String(oldWeightage), newValue: String(weightage), action: 'Inline Weightage Edit' });
    }
    res.json({ success: true, goal });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
};

export const pushSharedGoal = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { employeeIds, thrustArea, title, description, uomType, target, weightage, cycleId } = req.body;
    if (!employeeIds?.length) { res.status(400).json({ success: false, message: 'Select at least one employee' }); return; }
    const created = await Goal.insertMany(
      employeeIds.map((id: string) => ({
        employeeId: id, cycleId, thrustArea, title, description, uomType,
        target, weightage: weightage || 10, status: 'draft', isShared: true, sharedBy: req.user!.id,
      }))
    );
    res.status(201).json({ success: true, count: created.length, message: `Shared KPI pushed to ${created.length} employees` });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message });
  }
};

export const getTeamCheckins = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { period, cycleId } = req.query;
    const team = await User.find({ managerId: req.user!.id, isActive: true });
    const checkins = await Checkin.find({ employeeId: { $in: team.map(u => u._id) }, ...(period && { period }), ...(cycleId && { cycleId }) })
      .populate('goalId', 'title thrustArea uomType target weightage')
      .populate('employeeId', 'name email department');
    res.json({ success: true, checkins });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};
