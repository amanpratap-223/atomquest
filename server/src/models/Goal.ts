import mongoose, { Schema, Document } from 'mongoose';

export interface IGoal extends Document {
  employeeId: mongoose.Types.ObjectId;
  cycleId: mongoose.Types.ObjectId;
  thrustArea: string;
  title: string;
  description: string;
  uomType: 'Min' | 'Max' | 'Timeline' | 'Zero';
  target: number | string;
  weightage: number;
  status: 'draft' | 'submitted' | 'approved' | 'rejected' | 'locked';
  isShared: boolean;
  sharedBy?: mongoose.Types.ObjectId;
  lockedAt?: Date;
  managerComment?: string;
}

const GoalSchema = new Schema<IGoal>({
  employeeId:    { type: Schema.Types.ObjectId, ref: 'User', required: true },
  cycleId:       { type: Schema.Types.ObjectId, ref: 'Cycle', required: true },
  thrustArea:    { type: String, required: true },
  title:         { type: String, required: true, trim: true },
  description:   { type: String, required: true },
  uomType:       { type: String, enum: ['Min','Max','Timeline','Zero'], required: true },
  target:        { type: Schema.Types.Mixed, required: true },
  weightage:     { type: Number, required: true, min: 10, max: 100 },
  status:        { type: String, enum: ['draft','submitted','approved','rejected','locked'], default: 'draft' },
  isShared:      { type: Boolean, default: false },
  sharedBy:      { type: Schema.Types.ObjectId, ref: 'User' },
  lockedAt:      { type: Date },
  managerComment:{ type: String },
}, { timestamps: true });

GoalSchema.index({ employeeId: 1, cycleId: 1 });

export default mongoose.model<IGoal>('Goal', GoalSchema);
