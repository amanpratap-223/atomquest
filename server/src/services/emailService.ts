import nodemailer from 'nodemailer';
import { ENV } from '../config/env';

// ─── Transporter ──────────────────────────────────────────────────────────────
const transporter = nodemailer.createTransport({
  host:   ENV.EMAIL_HOST,
  port:   ENV.EMAIL_PORT,
  secure: ENV.EMAIL_PORT === 465,
  auth: {
    user: ENV.EMAIL_USER,
    pass: ENV.EMAIL_PASS,
  },
});

// ─── Base HTML Template ───────────────────────────────────────────────────────
function baseTemplate(title: string, body: string, cta?: { label: string; url: string }): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title}</title></head>
<body style="margin:0;padding:0;background:#f4f4f8;font-family:'Inter',sans-serif;">
  <div style="max-width:580px;margin:32px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.06);">
    <!-- Header -->
    <div style="background:linear-gradient(135deg,#7c3aed,#8b5cf6);padding:32px 36px;">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:16px;">
        <div style="width:36px;height:36px;background:rgba(255,255,255,.2);border-radius:10px;display:flex;align-items:center;justify-content:center;">
          <span style="color:#fff;font-weight:800;font-size:18px;">A</span>
        </div>
        <span style="color:#fff;font-weight:700;font-size:16px;">AtomQuest</span>
      </div>
      <h1 style="color:#fff;font-size:22px;font-weight:700;margin:0;">${title}</h1>
    </div>
    <!-- Body -->
    <div style="padding:32px 36px;color:#3f3f46;font-size:14px;line-height:1.8;">
      ${body}
      ${cta ? `
      <div style="margin-top:28px;text-align:center;">
        <a href="${cta.url}" style="display:inline-block;padding:12px 28px;background:#7c3aed;color:#fff;border-radius:10px;text-decoration:none;font-weight:600;font-size:14px;">${cta.label}</a>
      </div>` : ''}
    </div>
    <!-- Footer -->
    <div style="padding:20px 36px;background:#f9f9fb;border-top:1px solid #e4e4e7;text-align:center;">
      <p style="color:#a1a1aa;font-size:11px;margin:0;">
        AtomQuest · Atomberg Technologies · Internal Goal Tracker Portal<br/>
        This is an automated notification. Please do not reply.
      </p>
    </div>
  </div>
</body>
</html>`;
}

// ─── Send Helper ──────────────────────────────────────────────────────────────
async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  if (!ENV.EMAIL_USER || !ENV.EMAIL_PASS) {
    console.log(`[EMAIL STUB] To: ${to} | Subject: ${subject}`);
    return;
  }
  try {
    await transporter.sendMail({ from: ENV.EMAIL_FROM, to, subject, html });
    console.log(`✅ Email sent to ${to}: ${subject}`);
  } catch (err) {
    console.error(`❌ Email failed to ${to}:`, err);
  }
}

// ─── Email Triggers ───────────────────────────────────────────────────────────
export const emailService = {
  /**
   * Sent to manager when employee submits their goal sheet
   */
  goalSubmitted: async (managerEmail: string, managerName: string, employeeName: string, goalCount: number) => {
    const body = `
      <p>Hi <strong>${managerName}</strong>,</p>
      <p><strong>${employeeName}</strong> has submitted their goal sheet for FY 2025-26 (Cycle 1) and is awaiting your review.</p>
      <ul style="background:#f5f3ff;padding:16px 24px;border-radius:10px;margin:16px 0;">
        <li><strong>Employee:</strong> ${employeeName}</li>
        <li><strong>Goals submitted:</strong> ${goalCount}</li>
        <li><strong>Action required:</strong> Approve or return for rework</li>
      </ul>
      <p>Please log into AtomQuest to review the goal sheet, make any inline edits, and approve or return it with comments.</p>`;
    await sendEmail(managerEmail, `[AtomQuest] 📋 ${employeeName}'s goals await your approval`,
      baseTemplate('Goal Sheet Submitted', body, { label: 'Review Goals', url: `${ENV.CLIENT_URL}/manager/approvals` }));
  },

  /**
   * Sent to employee when manager approves their goals
   */
  goalApproved: async (employeeEmail: string, employeeName: string, managerName: string) => {
    const body = `
      <p>Hi <strong>${employeeName}</strong>,</p>
      <p>Great news! 🎉 Your goal sheet for FY 2025-26 has been <strong style="color:#16a34a;">approved and locked</strong> by ${managerName}.</p>
      <div style="background:#f0fdf4;border-left:4px solid #22c55e;padding:16px 20px;border-radius:0 10px 10px 0;margin:16px 0;">
        <p style="margin:0;font-weight:600;color:#15803d;">Your goals are now active!</p>
        <p style="margin:4px 0 0;color:#166534;font-size:13px;">Check-in windows will open quarterly. You'll receive reminders to log your achievements.</p>
      </div>
      <p>Log into AtomQuest to view your locked goal sheet and prepare for Q1 check-ins.</p>`;
    await sendEmail(employeeEmail, `[AtomQuest] ✅ Your goals are approved!`,
      baseTemplate('Goals Approved & Locked', body, { label: 'View My Goals', url: `${ENV.CLIENT_URL}/employee/goals` }));
  },

  /**
   * Sent to employee when manager returns goals for rework
   */
  goalRejected: async (employeeEmail: string, employeeName: string, managerName: string, comment: string) => {
    const body = `
      <p>Hi <strong>${employeeName}</strong>,</p>
      <p>Your goal sheet has been <strong style="color:#dc2626;">returned for rework</strong> by ${managerName}. Please review the feedback and resubmit.</p>
      <div style="background:#fef2f2;border-left:4px solid #f43f5e;padding:16px 20px;border-radius:0 10px 10px 0;margin:16px 0;">
        <p style="margin:0;font-weight:600;color:#991b1b;">Manager's Feedback:</p>
        <p style="margin:8px 0 0;color:#7f1d1d;">"${comment}"</p>
      </div>
      <p>Please update your goals and resubmit before the goal-setting window closes.</p>`;
    await sendEmail(employeeEmail, `[AtomQuest] ⚠️ Goals returned for rework`,
      baseTemplate('Goals Returned for Rework', body, { label: 'Update My Goals', url: `${ENV.CLIENT_URL}/employee/goals` }));
  },

  /**
   * Sent to employees when a check-in window opens
   */
  checkinWindowOpened: async (employeeEmail: string, employeeName: string, period: string, closesAt: string) => {
    const body = `
      <p>Hi <strong>${employeeName}</strong>,</p>
      <p>The <strong>${period} Check-in window</strong> is now open! Please log your actual achievements against your approved goals.</p>
      <ul style="background:#fffbeb;padding:16px 24px;border-radius:10px;margin:16px 0;">
        <li><strong>Period:</strong> ${period}</li>
        <li><strong>Deadline:</strong> ${new Date(closesAt).toLocaleDateString('en-IN', { dateStyle: 'long' })}</li>
        <li><strong>Action:</strong> Log actual achievements for all approved goals</li>
      </ul>
      <p>Don't miss the window — check-ins cannot be submitted after the deadline.</p>`;
    await sendEmail(employeeEmail, `[AtomQuest] 📅 ${period} Check-in window is open`,
      baseTemplate(`${period} Check-in Window Open`, body, { label: 'Log My Check-ins', url: `${ENV.CLIENT_URL}/employee/checkins` }));
  },

  /**
   * Escalation notification - sent when someone misses a deadline
   */
  escalationAlert: async (toEmail: string, toName: string, subject: string, message: string, targetName: string, daysLate: number) => {
    const body = `
      <p>Hi <strong>${toName}</strong>,</p>
      <p>${message}</p>
      <div style="background:#fef2f2;border-left:4px solid #f43f5e;padding:16px 20px;border-radius:0 10px 10px 0;margin:16px 0;">
        <p style="margin:0;font-weight:600;color:#991b1b;">Escalation Details:</p>
        <p style="margin:4px 0 0;color:#7f1d1d;">
          <strong>Person:</strong> ${targetName}<br/>
          <strong>Overdue by:</strong> ${daysLate} days<br/>
          <strong>Action required:</strong> Immediate follow-up
        </p>
      </div>
      <p>Please take action immediately to ensure compliance with the goal-setting process.</p>`;
    await sendEmail(toEmail, `[AtomQuest] 🚨 ${subject}`,
      baseTemplate(subject, body, { label: 'View in AtomQuest', url: `${ENV.CLIENT_URL}/admin` }));
  },
};
