import mongoose, { Schema, Document } from 'mongoose';

export interface IEscalationRule extends Document {
  name: string;
  trigger: 'goal_not_submitted' | 'goal_not_approved' | 'checkin_not_submitted';
  thresholdDays: number;
  notifyEmployee: boolean;
  notifyManager:  boolean;
  notifyAdmin:    boolean;
  isActive: boolean;
  lastRunAt?: Date;
}

const EscalationRuleSchema = new Schema<IEscalationRule>({
  name:              { type: String, required: true },
  trigger:           { type: String, enum: ['goal_not_submitted','goal_not_approved','checkin_not_submitted'], required: true },
  thresholdDays:     { type: Number, required: true, min: 1 },
  notifyEmployee:    { type: Boolean, default: true },
  notifyManager:     { type: Boolean, default: true },
  notifyAdmin:       { type: Boolean, default: false },
  isActive:          { type: Boolean, default: true },
  lastRunAt:         { type: Date },
}, { timestamps: true });

export default mongoose.model<IEscalationRule>('EscalationRule', EscalationRuleSchema);
