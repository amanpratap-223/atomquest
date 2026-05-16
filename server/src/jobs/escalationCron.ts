import cron from 'node-cron';
import User from '../models/User';
import Goal from '../models/Goal';
import Checkin from '../models/Checkin';
import Cycle from '../models/Cycle';
import EscalationRule from '../models/EscalationRule';
import { emailService } from '../services/emailService';
import { teamsService } from '../services/teamsService';

// ─── Helper: days since date ──────────────────────────────────────────────────
function daysSince(date: Date): number {
  return Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
}

// ─── Run Escalation Check ─────────────────────────────────────────────────────
async function runEscalationCheck() {
  console.log('⏰ [Escalation Cron] Running daily check at', new Date().toISOString());

  const rules   = await EscalationRule.find({ isActive: true });
  const cycles  = await Cycle.find({ isActive: true });
  if (!cycles.length) return;

  const cycle = cycles[0];
  const now   = new Date();

  for (const rule of rules) {
    try {
      const employees = await User.find({ role: 'employee', isActive: true });

      // ── Rule: Employee hasn't submitted goals ─────────────────────────────
      if (rule.trigger === 'goal_not_submitted') {
        const goalSettingClose = cycle.goalSettingWindow.closesAt;
        const daysLeft = Math.floor((goalSettingClose.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        if (daysLeft >= 0 && daysLeft <= rule.thresholdDays) {
          for (const emp of employees) {
            const goals = await Goal.find({ employeeId: emp._id, cycleId: cycle._id });
            const submitted = goals.filter(g => g.status !== 'draft');
            if (submitted.length === 0) {
              const manager = emp.managerId ? await User.findById(emp.managerId) : null;
              const daysLate = rule.thresholdDays - daysLeft;
              console.log(`[Escalation] ${emp.name} has not submitted goals. Days left: ${daysLeft}`);

              if (rule.notifyEmployee) {
                await emailService.escalationAlert(emp.email, emp.name,
                  'Goal Submission Deadline Approaching',
                  `You have not submitted your goals yet. Only ${daysLeft} days remaining in the goal-setting window.`,
                  emp.name, daysLate
                );
              }
              if (rule.notifyManager && manager) {
                await emailService.escalationAlert(manager.email, manager.name,
                  `${emp.name} Has Not Submitted Goals`,
                  `Your team member ${emp.name} has not yet submitted their goals. The window closes in ${daysLeft} days.`,
                  emp.name, daysLate
                );
                await teamsService.escalationAlert(emp.name, `Goals not submitted (${daysLeft} days left)`, daysLate);
              }
            }
          }
        }
      }

      // ── Rule: Manager hasn't approved submitted goals ──────────────────────
      if (rule.trigger === 'goal_not_approved') {
        const submittedGoals = await Goal.find({ cycleId: cycle._id, status: 'submitted' });
        const employeeIds = [...new Set(submittedGoals.map(g => g.employeeId.toString()))];

        for (const empId of employeeIds) {
          const firstSubmit = submittedGoals.find(g => g.employeeId.toString() === empId);
          if (!firstSubmit) continue;
          const goalDoc = firstSubmit as any;
          const daysPending = daysSince(goalDoc.updatedAt || goalDoc.createdAt || new Date());
          if (daysPending >= rule.thresholdDays) {
            const emp = await User.findById(empId);
            const manager = emp?.managerId ? await User.findById(emp.managerId) : null;
            if (manager) {
              console.log(`[Escalation] ${emp?.name}'s goals pending approval for ${daysPending} days`);
              await emailService.escalationAlert(manager.email, manager.name,
                `${emp?.name}'s Goals Pending Approval`,
                `${emp?.name}'s goals have been awaiting your approval for ${daysPending} days.`,
                emp?.name || 'Unknown', daysPending
              );
              await teamsService.escalationAlert(emp?.name || '', `Goals pending manager approval for ${daysPending} days`, daysPending);
            }
          }
        }
      }

      // ── Rule: Employee hasn't submitted check-in ───────────────────────────
      if (rule.trigger === 'checkin_not_submitted') {
        const periods: Array<'Q1' | 'Q2' | 'Q3' | 'Q4'> = ['Q1', 'Q2', 'Q3', 'Q4'];
        for (const period of periods) {
          const window = cycle[`${period}Window`];
          if (!window) continue;
          const daysSinceOpen = daysSince(window.opensAt);
          if (daysSinceOpen < rule.thresholdDays || now > window.closesAt) continue;

          for (const emp of employees) {
            const lockedGoals = await Goal.find({ employeeId: emp._id, cycleId: cycle._id, status: 'locked' });
            if (!lockedGoals.length) continue;
            const checkins = await Checkin.find({ employeeId: emp._id, cycleId: cycle._id, period });
            if (checkins.length === 0) {
              const manager = emp.managerId ? await User.findById(emp.managerId) : null;
              console.log(`[Escalation] ${emp.name} has not submitted ${period} check-in (${daysSinceOpen} days open)`);

              if (rule.notifyEmployee) {
                await emailService.checkinWindowOpened(emp.email, emp.name, period, window.closesAt.toISOString());
              }
              if (rule.notifyManager && manager) {
                await emailService.escalationAlert(manager.email, manager.name,
                  `${emp.name} Has Not Submitted ${period} Check-in`,
                  `${emp.name} has not yet submitted their ${period} check-in. The window has been open for ${daysSinceOpen} days.`,
                  emp.name, daysSinceOpen
                );
              }
            }
          }
        }
      }

      // Update lastRunAt
      rule.lastRunAt = new Date();
      await rule.save();

    } catch (err) {
      console.error(`[Escalation] Rule "${rule.name}" failed:`, err);
    }
  }

  console.log('✅ [Escalation Cron] Check complete');
}

// ─── Schedule: Run daily at midnight ─────────────────────────────────────────
export function startEscalationCron(): void {
  // Daily at midnight
  cron.schedule('0 0 * * *', runEscalationCheck, { timezone: 'Asia/Kolkata' });
  // Also run every Monday at 9am for weekly summary
  cron.schedule('0 9 * * 1', runEscalationCheck, { timezone: 'Asia/Kolkata' });
  console.log('⏰ Escalation cron job scheduled (daily midnight + Monday 9am IST)');
}
