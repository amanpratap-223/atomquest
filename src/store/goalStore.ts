import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Goal, GoalSheet, Checkin, CheckinPeriod, GoalProgressStatus } from '@/types';
import { computeProgressScore } from '@/utils';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';

// ── Seed data used as offline fallback ────────────────────────────────────────
const SEED_GOALS: Goal[] = [
  { id: 'g1', employeeId: 'emp1', cycleId: 'cy1', thrustArea: 'Sales & Revenue',        title: 'Achieve Monthly Sales Target',         description: 'Hit ₹25L monthly sales.', uomType: 'Min',      target: 100,         weightage: 30, status: 'approved', isShared: false, lockedAt: '2025-05-10T10:00:00Z', createdAt: '2025-05-01T09:00:00Z', updatedAt: '2025-05-10T10:00:00Z' },
  { id: 'g2', employeeId: 'emp1', cycleId: 'cy1', thrustArea: 'Customer Success',        title: 'Improve Customer Satisfaction Score',  description: 'Maintain CSAT ≥ 4.5/5.',  uomType: 'Min',      target: 90,          weightage: 25, status: 'approved', isShared: false, lockedAt: '2025-05-10T10:00:00Z', createdAt: '2025-05-01T09:00:00Z', updatedAt: '2025-05-10T10:00:00Z' },
  { id: 'g3', employeeId: 'emp1', cycleId: 'cy1', thrustArea: 'Operations & Efficiency', title: 'Reduce TAT for Order Processing',      description: 'Max 3 day TAT.',          uomType: 'Max',      target: 3,           weightage: 20, status: 'submitted', isShared: false, createdAt: '2025-05-01T09:00:00Z', updatedAt: '2025-05-08T09:00:00Z' },
  { id: 'g4', employeeId: 'emp1', cycleId: 'cy1', thrustArea: 'People & Culture',        title: 'Complete Training Modules',            description: 'Finish by Sep 30.',       uomType: 'Timeline', target: '2025-09-30', weightage: 15, status: 'draft',     isShared: false, createdAt: '2025-05-02T09:00:00Z', updatedAt: '2025-05-02T09:00:00Z' },
  { id: 'g5', employeeId: 'emp1', cycleId: 'cy1', thrustArea: 'Quality & Compliance',    title: 'Zero Safety Incidents',               description: 'Zero incidents FY25.',    uomType: 'Zero',     target: 0,           weightage: 10, status: 'draft',     isShared: true,  sharedBy: 'mgr1', createdAt: '2025-05-03T09:00:00Z', updatedAt: '2025-05-03T09:00:00Z' },
  { id: 'g6', employeeId: 'emp2', cycleId: 'cy1', thrustArea: 'Operations & Efficiency', title: 'Optimize Process Cycle Time',          description: 'Reduce cycle time 20%.',  uomType: 'Max',      target: 3,           weightage: 40, status: 'submitted', isShared: false, createdAt: '2025-05-01T09:00:00Z', updatedAt: '2025-05-08T09:00:00Z' },
  { id: 'g7', employeeId: 'emp2', cycleId: 'cy1', thrustArea: 'Finance & Cost',          title: 'Cost Reduction Initiative',            description: 'Save ₹5L via cost cuts.', uomType: 'Min',      target: 5,           weightage: 35, status: 'submitted', isShared: false, createdAt: '2025-05-01T09:00:00Z', updatedAt: '2025-05-08T09:00:00Z' },
  { id: 'g8', employeeId: 'emp2', cycleId: 'cy1', thrustArea: 'Quality & Compliance',    title: 'Zero Safety Incidents',               description: 'Shared KPI.',             uomType: 'Zero',     target: 0,           weightage: 25, status: 'submitted', isShared: true,  sharedBy: 'mgr1', createdAt: '2025-05-01T09:00:00Z', updatedAt: '2025-05-08T09:00:00Z' },
  { id: 'g9', employeeId: 'emp3', cycleId: 'cy1', thrustArea: 'Sales & Revenue',         title: 'New Client Acquisition',               description: '5 new clients FY25.',     uomType: 'Min',      target: 5,           weightage: 50, status: 'approved', isShared: false, lockedAt: '2025-05-10T10:00:00Z', createdAt: '2025-05-01T09:00:00Z', updatedAt: '2025-05-10T10:00:00Z' },
  { id: 'g10', employeeId: 'emp3', cycleId: 'cy1', thrustArea: 'Customer Success',       title: 'Client Retention Rate',                description: '90%+ retention.',         uomType: 'Min',      target: 90,          weightage: 50, status: 'approved', isShared: false, lockedAt: '2025-05-10T10:00:00Z', createdAt: '2025-05-01T09:00:00Z', updatedAt: '2025-05-10T10:00:00Z' },
];

const SEED_CHECKINS: Checkin[] = [
  { id: 'ci1', goalId: 'g1', employeeId: 'emp1', cycleId: 'cy1', period: 'Q1', actualAchievement: 78, status: 'on_track',  progressScore: computeProgressScore('Min', 100, 78), checkinDate: '2025-07-15T10:00:00Z', managerComment: 'Good start. Focus on enterprise accounts in Q2 to bridge the gap.' },
  { id: 'ci2', goalId: 'g2', employeeId: 'emp1', cycleId: 'cy1', period: 'Q1', actualAchievement: 92, status: 'completed', progressScore: computeProgressScore('Min', 90,  92), checkinDate: '2025-07-15T10:00:00Z' },
];

interface GoalState {
  goals: Goal[];
  checkins: Checkin[];
  isLoading: boolean;

  // Fetch from API
  fetchMyGoals: () => Promise<void>;
  fetchMyCheckins: (period: CheckinPeriod) => Promise<void>;

  // Employee actions
  getMyGoals: (employeeId: string, cycleId?: string) => Goal[];
  addGoal: (goal: Omit<Goal, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateGoal: (id: string, updates: Partial<Goal>) => Promise<void>;
  deleteGoal: (id: string) => Promise<void>;
  submitGoals: (employeeId: string, cycleId: string) => Promise<void>;

  // Manager actions
  getTeamGoalSheets: (managerId: string) => GoalSheet[];
  approveGoalSheet: (employeeId: string, cycleId: string) => Promise<void>;
  rejectGoalSheet: (employeeId: string, cycleId: string, comment: string) => Promise<void>;
  updateGoalSheetComment: (employeeId: string, cycleId: string, comment: string) => Promise<void>;
  inlineUpdateGoal: (id: string, target: number | string, weightage: number) => void;

  // Checkin actions
  getMyCheckins: (employeeId: string, period: CheckinPeriod) => Checkin[];
  getTeamCheckins: (managerId: string, period: CheckinPeriod) => { employee: any; checkins: Checkin[] }[];
  submitCheckin: (checkin: Omit<Checkin, 'id' | 'progressScore' | 'checkinDate'>) => Promise<void>;
  updateCheckinStatus: (id: string, status: GoalProgressStatus) => void;
  addManagerComment: (checkinId: string, comment: string) => Promise<void>;
}

export const useGoalStore = create<GoalState>()(
  persist(
    (set, get) => ({
      goals: SEED_GOALS,
      checkins: SEED_CHECKINS,
      isLoading: false,

      // ── Fetch from API ───────────────────────────────────────────────────────
      fetchMyGoals: async () => {
        try {
          const { data } = await api.get('/goals');
          set({ goals: data.goals });
        } catch (_) { /* keep cached goals */ }
      },

      fetchMyCheckins: async (period) => {
        try {
          const { data } = await api.get('/checkins', { params: { period } });
          const existing = get().checkins.filter(c => c.period !== period);
          set({ checkins: [...existing, ...data.checkins] });
        } catch (_) { /* keep cached */ }
      },

      // ── Local selectors ──────────────────────────────────────────────────────
      getMyGoals: (employeeId, cycleId = 'cy1') =>
        get().goals.filter(g => g.employeeId === employeeId && g.cycleId === cycleId),

      getMyCheckins: (employeeId, period) =>
        get().checkins.filter(c => c.employeeId === employeeId && c.period === period),

      getTeamCheckins: (managerId, period) => {
        const users = useAuthStore.getState().users;
        const teamMembers = users.filter((u: any) => u.managerId === managerId);
        return teamMembers.map((member: any) => ({
          employee: member,
          checkins: get().checkins.filter(c => c.employeeId === member.id && c.period === period),
        }));
      },

      getTeamGoalSheets: (managerId) => {
        const { goals } = get();
        const users = useAuthStore.getState().users;
        const teamMembers = users.filter((u: any) => u.managerId === managerId);
        return teamMembers.map((member: any) => {
          const memberGoals = goals.filter(g => g.employeeId === member.id);
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

      // ── Goal CRUD ────────────────────────────────────────────────────────────
      addGoal: async (goalData) => {
        try {
          const { data } = await api.post('/goals', goalData);
          set(s => ({ goals: [...s.goals, data.goal] }));
        } catch (_) {
          // Optimistic fallback
          const newGoal: Goal = {
            ...goalData,
            id: `g-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          set(s => ({ goals: [...s.goals, newGoal] }));
        }
      },

      updateGoal: async (id, updates) => {
        set(s => ({
          goals: s.goals.map(g =>
            g.id === id ? { ...g, ...updates, updatedAt: new Date().toISOString() } : g
          ),
        }));
        try { await api.put(`/goals/${id}`, updates); } catch (_) {}
      },

      deleteGoal: async (id) => {
        set(s => ({ goals: s.goals.filter(g => g.id !== id) }));
        try { await api.delete(`/goals/${id}`); } catch (_) {}
      },

      submitGoals: async (employeeId, cycleId) => {
        set(s => ({
          goals: s.goals.map(g =>
            g.employeeId === employeeId && g.cycleId === cycleId && g.status === 'draft'
              ? { ...g, status: 'submitted', updatedAt: new Date().toISOString() }
              : g
          ),
        }));
        try { await api.post('/goals/submit', { cycleId }); } catch (_) {}
      },

      approveGoalSheet: async (employeeId, cycleId) => {
        set(s => ({
          goals: s.goals.map(g =>
            g.employeeId === employeeId && g.cycleId === cycleId
              ? { ...g, status: 'locked', lockedAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
              : g
          ),
        }));
        try { await api.post('/manager/approve', { employeeId, cycleId }); } catch (_) {}
      },

      rejectGoalSheet: async (employeeId, cycleId, comment) => {
        set(s => ({
          goals: s.goals.map(g =>
            g.employeeId === employeeId && g.cycleId === cycleId
              ? { ...g, status: 'rejected', managerComment: comment, updatedAt: new Date().toISOString() }
              : g
          ),
        }));
        try { await api.post('/manager/reject', { employeeId, cycleId, comment }); } catch (_) {}
      },

      updateGoalSheetComment: async (employeeId, cycleId, comment) => {
        set(s => ({
          goals: s.goals.map(g =>
            g.employeeId === employeeId && g.cycleId === cycleId
              ? { ...g, managerComment: comment, updatedAt: new Date().toISOString() }
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

      // ── Check-ins ────────────────────────────────────────────────────────────
      submitCheckin: async (checkinData) => {
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
            id: 'ci' + Date.now() + Math.random(),
            progressScore,
            checkinDate: new Date().toISOString(),
          };
          set(s => ({ checkins: [...s.checkins, newCheckin] }));
        }

        try {
          await api.post('/checkins', { ...checkinData, progressScore });
        } catch (_) { /* optimistic — already saved locally */ }
      },

      updateCheckinStatus: (id, status) => {
        set(s => ({
          checkins: s.checkins.map(c => c.id === id ? { ...c, status } : c),
        }));
      },

      addManagerComment: async (checkinId, comment) => {
        set(s => ({
          checkins: s.checkins.map(c =>
            c.id === checkinId ? { ...c, managerComment: comment } : c
          ),
        }));
        try { await api.put(`/checkins/${checkinId}/comment`, { comment }); } catch (_) {}
      },
    }),
    {
      name: 'atomquest-goals-v2',
      partialize: (state) => ({ goals: state.goals, checkins: state.checkins }),
    }
  )
);
