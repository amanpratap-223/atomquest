// ─── User Types ─────────────────────────────────────────────────────────────
export type UserRole = 'employee' | 'manager' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department: string;
  designation: string;
  managerId?: string;
  avatar?: string;
}

// ─── Goal Types ──────────────────────────────────────────────────────────────
export type UoMType = 'Min' | 'Max' | 'Timeline' | 'Zero';
export type UoMDirection = 'higher_better' | 'lower_better';
export type GoalStatus = 'draft' | 'submitted' | 'approved' | 'rejected' | 'locked';

export interface Goal {
  id: string;
  employeeId: string;
  cycleId: string;
  thrustArea: string;
  title: string;
  description: string;
  uomType: UoMType;
  target: number | string; // number for numeric, ISO string for timeline
  weightage: number;
  status: GoalStatus;
  isShared: boolean;
  sharedBy?: string;
  lockedAt?: string;
  managerComment?: string;
  createdAt: string;
  updatedAt: string;
}

export interface GoalSheet {
  id: string;
  employeeId: string;
  employee: User;
  cycleId: string;
  goals: Goal[];
  totalWeightage: number;
  status: 'draft' | 'submitted' | 'approved' | 'returned';
  submittedAt?: string;
  approvedAt?: string;
}

// ─── Check-in Types ──────────────────────────────────────────────────────────
export type CheckinPeriod = 'Q1' | 'Q2' | 'Q3' | 'Q4';
export type GoalProgressStatus = 'not_started' | 'on_track' | 'completed';

export interface Checkin {
  id: string;
  goalId: string;
  employeeId: string;
  cycleId: string;
  period: CheckinPeriod;
  actualAchievement: number | string;
  status: GoalProgressStatus;
  progressScore: number;
  managerComment?: string;
  checkinDate: string;
}

// ─── Cycle Types ─────────────────────────────────────────────────────────────
export interface CycleWindow {
  opensAt: string;
  closesAt: string;
}

export interface Cycle {
  id: string;
  name: string;
  year: number;
  goalSettingWindow: CycleWindow;
  Q1Window: CycleWindow;
  Q2Window: CycleWindow;
  Q3Window: CycleWindow;
  Q4Window: CycleWindow;
  isActive: boolean;
}

// ─── Audit Log Types ─────────────────────────────────────────────────────────
export interface AuditLog {
  id: string;
  entityType: 'goal' | 'checkin' | 'user' | 'cycle';
  entityId: string;
  changedBy: string;
  changedByName: string;
  field: string;
  oldValue: string;
  newValue: string;
  timestamp: string;
}

// ─── API Response Types ──────────────────────────────────────────────────────
export interface ApiResponse<T> {
  data: T;
  message: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

// ─── Thrust Areas ────────────────────────────────────────────────────────────
export const THRUST_AREAS = [
  'Sales & Revenue',
  'Operations & Efficiency',
  'Customer Success',
  'Product & Innovation',
  'People & Culture',
  'Finance & Cost',
  'Quality & Compliance',
  'Technology & Digital',
] as const;

export type ThrustArea = typeof THRUST_AREAS[number];

// ─── Constants ───────────────────────────────────────────────────────────────
export const MAX_GOALS = 8;
export const MIN_WEIGHTAGE = 10;
export const TOTAL_WEIGHTAGE = 100;

export const UOM_LABELS: Record<UoMType, string> = {
  Min: 'Min (Numeric / %)',
  Max: 'Max (Numeric / %)',
  Timeline: 'Timeline',
  Zero: 'Zero-Based',
};

export const UOM_DESCRIPTIONS: Record<UoMType, string> = {
  Min: 'Higher is better — e.g., Sales Revenue. Score = Achievement ÷ Target',
  Max: 'Lower is better — e.g., TAT, Cost. Score = Target ÷ Achievement',
  Timeline: 'Date-based completion. Score = 100% if on/before deadline',
  Zero: 'Zero = Success — e.g., Safety incidents. Score = 100% if 0',
};

export const STATUS_LABELS: Record<GoalStatus, string> = {
  draft: 'Draft',
  submitted: 'Submitted',
  approved: 'Approved',
  rejected: 'Returned',
  locked: 'Locked',
};
