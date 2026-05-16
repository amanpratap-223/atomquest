import mongoose, { Schema, Document } from 'mongoose';

export interface IAuditLog extends Document {
  entityType: 'goal' | 'checkin' | 'user' | 'cycle';
  entityId: mongoose.Types.ObjectId;
  changedBy: mongoose.Types.ObjectId;
  changedByName: string;
  field: string;
  oldValue: string;
  newValue: string;
  action: string;
  timestamp: Date;
}

const AuditLogSchema = new Schema<IAuditLog>({
  entityType:    { type: String, enum: ['goal','checkin','user','cycle'], required: true },
  entityId:      { type: Schema.Types.ObjectId, required: true },
  changedBy:     { type: Schema.Types.ObjectId, ref: 'User', required: true },
  changedByName: { type: String, required: true },
  field:         { type: String, required: true },
  oldValue:      { type: String, default: '' },
  newValue:      { type: String, required: true },
  action:        { type: String, required: true },
  timestamp:     { type: Date, default: Date.now },
}, { timestamps: false });

AuditLogSchema.index({ entityType: 1, entityId: 1 });
AuditLogSchema.index({ changedBy: 1 });
AuditLogSchema.index({ timestamp: -1 });

export default mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);
