import { create } from 'zustand';
import type { Goal, GoalSheet, Checkin, CheckinPeriod, GoalProgressStatus } from '@/types';
import { computeProgressScore } from '@/utils';
import { MOCK_USERS } from '@/store/authStore';

// ─── Mock Goals Data ──────────────────────────────────────────────────────────
const initialGoals: Goal[] = [
  {
    id: 'g1', employeeId: 'emp1', cycleId: 'cy1',
    thrustArea: 'Sales & Revenue', title: 'Achieve Monthly Sales Target',
    description: 'Hit or exceed monthly sales revenue of ₹25L per quarter.',
    uomType: 'Min', target: 100, weightage: 30,
    status: 'approved', isShared: false, lockedAt: '2025-05-10T10:00:00Z',
    createdAt: '2025-05-01T09:00:00Z', updatedAt: '2025-05-10T10:00:00Z',
  },
  {
    id: 'g2', employeeId: 'emp1', cycleId: 'cy1',
    thrustArea: 'Customer Success', title: 'Improve Customer Satisfaction Score',
    description: 'Maintain CSAT score above 4.5/5 for all handled accounts.',
    uomType: 'Min', target: 90, weightage: 25,
    status: 'approved', isShared: false, lockedAt: '2025-05-10T10:00:00Z',
    createdAt: '2025-05-01T09:00:00Z', updatedAt: '2025-05-10T10:00:00Z',
  },
  {
    id: 'g3', employeeId: 'emp1', cycleId: 'cy1',
    thrustArea: 'Operations & Efficiency', title: 'Reduce TAT for Order Processing',
    description: 'Reduce average order turnaround time from 5 days to 3 days.',
    uomType: 'Max', target: 3, weightage: 20,
    status: 'submitted', isShared: false,
    createdAt: '2025-05-01T09:00:00Z', updatedAt: '2025-05-08T09:00:00Z',
  },
  {
    id: 'g4', employeeId: 'emp1', cycleId: 'cy1',
    thrustArea: 'People & Culture', title: 'Complete Training Modules',
    description: 'Finish all 4 mandatory training modules by Q2 deadline.',
    uomType: 'Timeline', target: '2025-09-30', weightage: 15,
    status: 'draft', isShared: false,
    createdAt: '2025-05-02T09:00:00Z', updatedAt: '2025-05-02T09:00:00Z',
  },
  {
    id: 'g5', employeeId: 'emp1', cycleId: 'cy1',
    thrustArea: 'Quality & Compliance', title: 'Zero Safety Incidents',
    description: 'Maintain zero reportable safety incidents throughout the year.',
    uomType: 'Zero', target: 0, weightage: 10,
    status: 'draft', isShared: true, sharedBy: 'mgr1',
    createdAt: '2025-05-03T09:00:00Z', updatedAt: '2025-05-03T09:00:00Z',
  },
  // Employee 2 goals
  {
    id: 'g6', employeeId: 'emp2', cycleId: 'cy1',
    thrustArea: 'Operations & Efficiency', title: 'Optimize Process Cycle Time',
    description: 'Reduce process cycle time by 20%.',
    uomType: 'Max', target: 3, weightage: 40,
    status: 'submitted', isShared: false,
    createdAt: '2025-05-01T09:00:00Z', updatedAt: '2025-05-08T09:00:00Z',
  },
  {
    id: 'g7', employeeId: 'emp2', cycleId: 'cy1',
    thrustArea: 'Finance & Cost', title: 'Cost Reduction Initiative',
    description: 'Identify and implement cost reduction measures saving ₹5L.',
    uomType: 'Min', target: 5, weightage: 35,
    status: 'submitted', isShared: false,
    createdAt: '2025-05-01T09:00:00Z', updatedAt: '2025-05-08T09:00:00Z',
  },
  {
    id: 'g8', employeeId: 'emp2', cycleId: 'cy1',
    thrustArea: 'Quality & Compliance', title: 'Zero Safety Incidents',
    description: 'Maintain zero reportable safety incidents.',
    uomType: 'Zero', target: 0, weightage: 25,
    status: 'submitted', isShared: true, sharedBy: 'mgr1',
    createdAt: '2025-05-01T09:00:00Z', updatedAt: '2025-05-08T09:00:00Z',
  },
  // Employee 3
  {
    id: 'g9', employeeId: 'emp3', cycleId: 'cy1',
    thrustArea: 'Sales & Revenue', title: 'New Client Acquisition',
    description: 'Acquire 5 new enterprise clients in FY 2025-26.',
    uomType: 'Min', target: 5, weightage: 50,
    status: 'approved', isShared: false, lockedAt: '2025-05-10T10:00:00Z',
    createdAt: '2025-05-01T09:00:00Z', updatedAt: '2025-05-10T10:00:00Z',
  },
  {
    id: 'g10', employeeId: 'emp3', cycleId: 'cy1',
    thrustArea: 'Customer Success', title: 'Client Retention Rate',
    description: 'Maintain client retention rate above 90%.',
    uomType: 'Min', target: 90, weightage: 50,
    status: 'approved', isShared: false, lockedAt: '2025-05-10T10:00:00Z',
    createdAt: '2025-05-01T09:00:00Z', updatedAt: '2025-05-10T10:00:00Z',
  },
];

const initialCheckins: Checkin[] = [
  {
    id: 'ci1', goalId: 'g1', employeeId: 'emp1', cycleId: 'cy1',
    period: 'Q1', actualAchievement: 78, status: 'on_track',
    progressScore: computeProgressScore('Min', 100, 78),
    checkinDate: '2025-07-15T10:00:00Z',
  },
  {
    id: 'ci2', goalId: 'g2', employeeId: 'emp1', cycleId: 'cy1',
    period: 'Q1', actualAchievement: 92, status: 'completed',
    progressScore: computeProgressScore('Min', 90, 92),
    checkinDate: '2025-07-15T10:00:00Z',
  },
];

// ─── Goal Store ───────────────────────────────────────────────────────────────
interface GoalState {
  goals: Goal[];
  checkins: Checkin[];

  // Employee actions
  getMyGoals: (employeeId: string, cycleId?: string) => Goal[];
  addGoal: (goal: Omit<Goal, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateGoal: (id: string, updates: Partial<Goal>) => void;
  deleteGoal: (id: string) => void;
  submitGoals: (employeeId: string, cycleId: string) => void;

  // Manager actions
  getTeamGoalSheets: (managerId: string) => GoalSheet[];
  approveGoalSheet: (employeeId: string, cycleId: string) => void;
  rejectGoalSheet: (employeeId: string, cycleId: string, comment: string) => void;
  inlineUpdateGoal: (id: string, target: number | string, weightage: number) => void;

  // Checkin actions
  getMyCheckins: (employeeId: string, period: CheckinPeriod) => Checkin[];
  getTeamCheckins: (managerId: string, period: CheckinPeriod) => { employee: any; checkins: Checkin[] }[];
  submitCheckin: (checkin: Omit<Checkin, 'id' | 'progressScore' | 'checkinDate'>) => void;
  updateCheckinStatus: (id: string, status: GoalProgressStatus) => void;
  addManagerComment: (checkinId: string, comment: string) => void;
}

export const useGoalStore = create<GoalState>((set, get) => ({
  goals: initialGoals,
  checkins: initialCheckins,

  getMyGoals: (employeeId, cycleId = 'cy1') =>
    get().goals.filter(g => g.employeeId === employeeId && g.cycleId === cycleId),

  addGoal: (goalData) => {
    const newGoal: Goal = {
      ...goalData,
      id: 'g' + Date.now(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    set(s => ({ goals: [...s.goals, newGoal] }));
  },

  updateGoal: (id, updates) => {
    set(s => ({
      goals: s.goals.map(g => g.id === id
        ? { ...g, ...updates, updatedAt: new Date().toISOString() }
        : g
      ),
    }));
  },

  deleteGoal: (id) => set(s => ({ goals: s.goals.filter(g => g.id !== id) })),

  submitGoals: (employeeId, cycleId) => {
    set(s => ({
      goals: s.goals.map(g =>
        g.employeeId === employeeId && g.cycleId === cycleId && g.status === 'draft'
          ? { ...g, status: 'submitted', updatedAt: new Date().toISOString() }
          : g
      ),
    }));
  },

  getTeamGoalSheets: (managerId) => {
    const { goals } = get();
    const teamMembers = MOCK_USERS.filter((u: any) => u.managerId === managerId);

    return teamMembers.map((member: any) => {
      const memberGoals = goals.filter(g => g.employeeId === member.id && g.cycleId === 'cy1');
      const totalWeightage = memberGoals.reduce((sum, g) => sum + g.weightage, 0);
      const hasSubmitted = memberGoals.some(g => g.status === 'submitted');
      const allApproved = memberGoals.length > 0 && memberGoals.every(g => g.status === 'approved' || g.status === 'locked');
      const hasRejected = memberGoals.some(g => g.status === 'rejected');

      return {
        id: `gs_${member.id}`,
        employeeId: member.id,
        employee: member,
        cycleId: 'cy1',
        goals: memberGoals,
        totalWeightage,
        status: allApproved ? 'approved' : hasRejected ? 'returned' : hasSubmitted ? 'submitted' : 'draft',
      } as GoalSheet;
    });
  },

  approveGoalSheet: (employeeId, cycleId) => {
    set(s => ({
      goals: s.goals.map(g =>
        g.employeeId === employeeId && g.cycleId === cycleId
          ? { ...g, status: 'locked', lockedAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
          : g
      ),
    }));
  },

  rejectGoalSheet: (employeeId, cycleId, comment) => {
    set(s => ({
      goals: s.goals.map(g =>
        g.employeeId === employeeId && g.cycleId === cycleId
          ? { ...g, status: 'rejected', managerComment: comment, updatedAt: new Date().toISOString() }
          : g
      ),
    }));
  },

  inlineUpdateGoal: (id, target, weightage) => {
    set(s => ({
      goals: s.goals.map(g =>
        g.id === id ? { ...g, target, weightage, updatedAt: new Date().toISOString() } : g
      ),
    }));
  },

  getMyCheckins: (employeeId, period) =>
    get().checkins.filter(c => c.employeeId === employeeId && c.period === period),

  getTeamCheckins: (managerId, period) => {
    const teamMembers = MOCK_USERS.filter((u: any) => u.managerId === managerId);
    return teamMembers.map((member: any) => ({
      employee: member,
      checkins: get().checkins.filter(c => c.employeeId === member.id && c.period === period),
    }));
  },

  submitCheckin: (checkinData) => {
    const goal = get().goals.find(g => g.id === checkinData.goalId);
    const progressScore = goal
      ? computeProgressScore(goal.uomType, goal.target, checkinData.actualAchievement)
      : 0;

    const existing = get().checkins.find(
      c => c.goalId === checkinData.goalId && c.period === checkinData.period
    );

    if (existing) {
      set(s => ({
        checkins: s.checkins.map(c =>
          c.id === existing.id
            ? { ...c, ...checkinData, progressScore, checkinDate: new Date().toISOString() }
            : c
        ),
      }));
    } else {
      const newCheckin: Checkin = {
        ...checkinData,
        id: 'ci' + Date.now(),
        progressScore,
        checkinDate: new Date().toISOString(),
      };
      set(s => ({ checkins: [...s.checkins, newCheckin] }));
    }
  },

  updateCheckinStatus: (id, status) => {
    set(s => ({
      checkins: s.checkins.map(c => c.id === id ? { ...c, status } : c),
    }));
  },

  addManagerComment: (checkinId, comment) => {
    set(s => ({
      checkins: s.checkins.map(c => c.id === checkinId ? { ...c, managerComment: comment } : c),
    }));
  },
}));
