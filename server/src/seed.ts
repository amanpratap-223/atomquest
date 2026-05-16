import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { connectDB } from './config/db';
import User from './models/User';
import Goal from './models/Goal';
import Cycle from './models/Cycle';

async function seed() {
  await connectDB();
  await Promise.all([User.deleteMany({}), Goal.deleteMany({}), Cycle.deleteMany({})]);
  console.log('🗑️  Cleared existing data');

  // ── Users ──────────────────────────────────────────────────────────────────
  const adminHash   = await bcrypt.hash('demo123', 12);
  const mgrHash     = await bcrypt.hash('demo123', 12);
  const empHash     = await bcrypt.hash('demo123', 12);

  const admin = await User.create({ name: 'Kavita Rao', email: 'kavita@atomberg.com', passwordHash: adminHash, role: 'admin', department: 'HR', designation: 'HR Manager', isActive: true });
  const mgr1  = await User.create({ name: 'Rahul Kapoor', email: 'rahul@atomberg.com', passwordHash: mgrHash, role: 'manager', department: 'Sales', designation: 'Sales Manager', isActive: true });
  const mgr2  = await User.create({ name: 'Deepa Nair', email: 'deepa@atomberg.com', passwordHash: mgrHash, role: 'manager', department: 'Technology', designation: 'Engineering Manager', isActive: true });

  const emp1 = await User.create({ name: 'Aman Sharma',  email: 'aman@atomberg.com',  passwordHash: empHash, role: 'employee', department: 'Sales', designation: 'Sales Executive', managerId: mgr1._id, isActive: true });
  const emp2 = await User.create({ name: 'Priya Singh',  email: 'priya@atomberg.com', passwordHash: empHash, role: 'employee', department: 'Sales', designation: 'Account Manager',  managerId: mgr1._id, isActive: true });
  const emp3 = await User.create({ name: 'Rohan Mehta',  email: 'rohan@atomberg.com', passwordHash: empHash, role: 'employee', department: 'Technology', designation: 'Software Engineer', managerId: mgr2._id, isActive: true });

  console.log('✅ Users seeded');

  // ── Cycle ──────────────────────────────────────────────────────────────────
  const cycle = await Cycle.create({
    name: 'FY 2025-26 Cycle 1', year: 2025,
    goalSettingWindow: { opensAt: new Date('2025-05-01'), closesAt: new Date('2025-05-31') },
    Q1Window: { opensAt: new Date('2025-07-01'), closesAt: new Date('2025-07-31') },
    Q2Window: { opensAt: new Date('2025-10-01'), closesAt: new Date('2025-10-31') },
    Q3Window: { opensAt: new Date('2026-01-01'), closesAt: new Date('2026-01-31') },
    Q4Window: { opensAt: new Date('2026-03-01'), closesAt: new Date('2026-04-30') },
    isActive: true,
  });
  console.log('✅ Cycle seeded');

  // ── Goals ──────────────────────────────────────────────────────────────────
  await Goal.insertMany([
    { employeeId: emp1._id, cycleId: cycle._id, thrustArea: 'Sales & Revenue', title: 'Achieve Monthly Sales Target', description: 'Hit ₹25L monthly sales', uomType: 'Min', target: 100, weightage: 30, status: 'locked', isShared: false, lockedAt: new Date('2025-05-15') },
    { employeeId: emp1._id, cycleId: cycle._id, thrustArea: 'Customer Success', title: 'Improve Customer Satisfaction Score', description: 'Target CSAT ≥ 90', uomType: 'Min', target: 90, weightage: 25, status: 'locked', isShared: false, lockedAt: new Date('2025-05-15') },
    { employeeId: emp1._id, cycleId: cycle._id, thrustArea: 'Operations & Efficiency', title: 'Reduce TAT for Order Processing', description: 'Max 3 day TAT', uomType: 'Max', target: 3, weightage: 20, status: 'submitted', isShared: false },
    { employeeId: emp1._id, cycleId: cycle._id, thrustArea: 'People & Culture', title: 'Complete Training Modules', description: 'Complete by Sep 30', uomType: 'Timeline', target: '2025-09-30', weightage: 15, status: 'draft', isShared: false },
    { employeeId: emp1._id, cycleId: cycle._id, thrustArea: 'Quality & Compliance', title: 'Zero Safety Incidents', description: 'Zero safety incidents FY25', uomType: 'Zero', target: 0, weightage: 10, status: 'draft', isShared: true, sharedBy: mgr1._id },
    { employeeId: emp2._id, cycleId: cycle._id, thrustArea: 'Sales & Revenue', title: 'New Account Acquisition', description: '5 new accounts per quarter', uomType: 'Min', target: 20, weightage: 40, status: 'submitted', isShared: false },
    { employeeId: emp2._id, cycleId: cycle._id, thrustArea: 'Customer Success', title: 'Renewal Rate Target', description: '95% renewal rate', uomType: 'Min', target: 95, weightage: 35, status: 'submitted', isShared: false },
    { employeeId: emp2._id, cycleId: cycle._id, thrustArea: 'Quality & Compliance', title: 'Zero Safety Incidents', description: 'Shared KPI', uomType: 'Zero', target: 0, weightage: 25, status: 'submitted', isShared: true, sharedBy: mgr1._id },
  ]);
  console.log('✅ Goals seeded');
  console.log('\n🎉 Seed complete! Login with:');
  console.log('   Employee:  aman@atomberg.com   / demo123');
  console.log('   Manager:   rahul@atomberg.com  / demo123');
  console.log('   Admin/HR:  kavita@atomberg.com / demo123');
  await mongoose.disconnect();
}

seed().catch(console.error);
