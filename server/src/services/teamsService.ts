import { ENV } from '../config/env';

const TEAMS_WEBHOOK_URL = process.env.TEAMS_WEBHOOK_URL || '';

// ─── Adaptive Card Helper ─────────────────────────────────────────────────────
function makeAdaptiveCard(title: string, subtitle: string, facts: { title: string; value: string }[], actionLabel: string, actionUrl: string) {
  return {
    type: 'message',
    attachments: [{
      contentType: 'application/vnd.microsoft.card.adaptive',
      contentUrl: null,
      content: {
        $schema: 'http://adaptivecards.io/schemas/adaptive-card.json',
        type: 'AdaptiveCard',
        version: '1.5',
        body: [
          {
            type: 'Container',
            style: 'emphasis',
            items: [{
              type: 'ColumnSet',
              columns: [
                { type: 'Column', width: 'auto', items: [{ type: 'Image', url: 'https://img.icons8.com/fluency/48/goal.png', size: 'Small' }] },
                { type: 'Column', width: 'stretch', items: [{ type: 'TextBlock', text: 'AtomQuest', weight: 'Bolder', size: 'Small', color: 'Accent' }, { type: 'TextBlock', text: title, weight: 'Bolder', size: 'Medium', wrap: true, spacing: 'None' }] },
              ],
            }],
          },
          { type: 'TextBlock', text: subtitle, wrap: true, spacing: 'Medium', color: 'Default' },
          {
            type: 'FactSet',
            facts: facts.map(f => ({ title: f.title, value: f.value })),
            spacing: 'Medium',
          },
        ],
        actions: [{
          type: 'Action.OpenUrl',
          title: actionLabel,
          url: actionUrl,
          style: 'positive',
        }],
      },
    }],
  };
}

// ─── Send Helper ──────────────────────────────────────────────────────────────
async function sendToTeams(payload: object): Promise<void> {
  if (!TEAMS_WEBHOOK_URL) {
    console.log('[TEAMS STUB]', JSON.stringify(payload).slice(0, 100));
    return;
  }
  try {
    const resp = await fetch(TEAMS_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!resp.ok) throw new Error(`Teams webhook returned ${resp.status}`);
    console.log('✅ Teams notification sent');
  } catch (err) {
    console.error('❌ Teams notification failed:', err);
  }
}

// ─── Teams Notification Types ─────────────────────────────────────────────────
export const teamsService = {
  /**
   * Notify manager in Teams when employee submits goals
   */
  goalSubmitted: (employeeName: string, goalCount: number, managerName: string) =>
    sendToTeams(makeAdaptiveCard(
      '📋 Goal Sheet Submitted',
      `${employeeName} has submitted ${goalCount} goals for your approval.`,
      [
        { title: 'Employee', value: employeeName },
        { title: 'Goals', value: `${goalCount} goals submitted` },
        { title: 'Action', value: 'Approve or Return for Rework' },
      ],
      'Review in AtomQuest',
      `${ENV.CLIENT_URL}/manager/approvals`
    )),

  /**
   * Notify employee in Teams when goals are approved
   */
  goalApproved: (employeeName: string, managerName: string) =>
    sendToTeams(makeAdaptiveCard(
      '✅ Goals Approved!',
      `Your goals have been approved and locked by ${managerName}.`,
      [
        { title: 'Status', value: '🔒 Locked & Active' },
        { title: 'Next step', value: 'Prepare for Q1 Check-in (July)' },
      ],
      'View My Goals',
      `${ENV.CLIENT_URL}/employee/goals`
    )),

  /**
   * Notify employee when goals are returned
   */
  goalRejected: (employeeName: string, managerName: string, comment: string) =>
    sendToTeams(makeAdaptiveCard(
      '⚠️ Goals Returned for Rework',
      `${managerName} has returned your goal sheet. Please update and resubmit.`,
      [
        { title: 'Feedback', value: comment.slice(0, 100) },
        { title: 'Action', value: 'Update and resubmit goals' },
      ],
      'Update Goals',
      `${ENV.CLIENT_URL}/employee/goals`
    )),

  /**
   * Remind employees when check-in window opens
   */
  checkinWindowOpened: (period: string, closesAt: string) =>
    sendToTeams(makeAdaptiveCard(
      `📅 ${period} Check-in Window Open`,
      `The ${period} check-in window is now open. Log your actual achievements before the deadline.`,
      [
        { title: 'Period', value: period },
        { title: 'Deadline', value: new Date(closesAt).toLocaleDateString('en-IN', { dateStyle: 'long' }) },
        { title: 'Action', value: 'Log actual achievements for all goals' },
      ],
      'Log Check-ins Now',
      `${ENV.CLIENT_URL}/employee/checkins`
    )),

  /**
   * Escalation alert to manager/HR
   */
  escalationAlert: (targetName: string, issue: string, daysLate: number) =>
    sendToTeams(makeAdaptiveCard(
      '🚨 Escalation Alert',
      `Action required: ${issue}`,
      [
        { title: 'Person', value: targetName },
        { title: 'Overdue', value: `${daysLate} days` },
        { title: 'Priority', value: '🔴 High' },
      ],
      'View in AtomQuest',
      `${ENV.CLIENT_URL}/admin`
    )),
};
