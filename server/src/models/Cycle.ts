import mongoose, { Schema, Document } from 'mongoose';

interface CycleWindow { opensAt: Date; closesAt: Date; }

export interface ICycle extends Document {
  name: string;
  year: number;
  goalSettingWindow: CycleWindow;
  Q1Window: CycleWindow;
  Q2Window: CycleWindow;
  Q3Window: CycleWindow;
  Q4Window: CycleWindow;
  isActive: boolean;
  isCurrentWindowOpen(period: 'goalSetting' | 'Q1' | 'Q2' | 'Q3' | 'Q4'): boolean;
}

const WindowSchema = new Schema<CycleWindow>({ opensAt: Date, closesAt: Date }, { _id: false });

const CycleSchema = new Schema<ICycle>({
  name: { type: String, required: true },
  year: { type: Number, required: true },
  goalSettingWindow: { type: WindowSchema, required: true },
  Q1Window: { type: WindowSchema, required: true },
  Q2Window: { type: WindowSchema, required: true },
  Q3Window: { type: WindowSchema, required: true },
  Q4Window: { type: WindowSchema, required: true },
  isActive: { type: Boolean, default: false },
}, { timestamps: true });

CycleSchema.methods.isCurrentWindowOpen = function (period: string): boolean {
  const now = new Date();
  const window = this[`${period}Window`] as CycleWindow;
  if (!window) return false;
  return now >= window.opensAt && now <= window.closesAt;
};

export default mongoose.model<ICycle>('Cycle', CycleSchema);
