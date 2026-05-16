import mongoose, { Schema, Document } from 'mongoose';

export interface ICheckin extends Document {
  goalId: mongoose.Types.ObjectId;
  employeeId: mongoose.Types.ObjectId;
  cycleId: mongoose.Types.ObjectId;
  period: 'Q1' | 'Q2' | 'Q3' | 'Q4';
  actualAchievement: number | string;
  status: 'not_started' | 'on_track' | 'completed';
  progressScore: number;
  managerComment?: string;
  checkinDate: Date;
}

const CheckinSchema = new Schema<ICheckin>({
  goalId:            { type: Schema.Types.ObjectId, ref: 'Goal', required: true },
  employeeId:        { type: Schema.Types.ObjectId, ref: 'User', required: true },
  cycleId:           { type: Schema.Types.ObjectId, ref: 'Cycle', required: true },
  period:            { type: String, enum: ['Q1','Q2','Q3','Q4'], required: true },
  actualAchievement: { type: Schema.Types.Mixed, required: true },
  status:            { type: String, enum: ['not_started','on_track','completed'], default: 'not_started' },
  progressScore:     { type: Number, default: 0 },
  managerComment:    { type: String },
  checkinDate:       { type: Date, default: Date.now },
}, { timestamps: true });

CheckinSchema.index({ goalId: 1, period: 1 }, { unique: true });
CheckinSchema.index({ employeeId: 1, cycleId: 1, period: 1 });

export default mongoose.model<ICheckin>('Checkin', CheckinSchema);
