import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  name: string;
  email: string;
  passwordHash: string;
  role: 'employee' | 'manager' | 'admin';
  department: string;
  designation: string;
  managerId?: mongoose.Types.ObjectId;
  azureOid?: string;
  isActive: boolean;
  comparePassword(password: string): Promise<boolean>;
}

const UserSchema = new Schema<IUser>({
  name:        { type: String, required: true, trim: true },
  email:       { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash:{ type: String, required: true },
  role:        { type: String, enum: ['employee', 'manager', 'admin'], default: 'employee' },
  department:  { type: String, required: true },
  designation: { type: String, required: true },
  managerId:   { type: Schema.Types.ObjectId, ref: 'User' },
  azureOid:    { type: String },
  isActive:    { type: Boolean, default: true },
}, { timestamps: true });

UserSchema.methods.comparePassword = async function (password: string): Promise<boolean> {
  return bcrypt.compare(password, this.passwordHash);
};

UserSchema.pre('save', async function (next) {
  if (!this.isModified('passwordHash')) return next();
  this.passwordHash = await bcrypt.hash(this.passwordHash, 12);
  next();
});

export default mongoose.model<IUser>('User', UserSchema);
