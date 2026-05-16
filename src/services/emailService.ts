/**
 * Email Notification Service (Frontend stub)
 * Real implementation is in the backend server.
 * These stubs prevent build errors when the backend is not connected.
 */

export const emailService = {
  sendGoalSubmitted: (_employeeEmail: string, _managerEmail: string, _goalCount: number) => {
    console.log('[EmailService] Goal submitted notification (demo mode — backend handles real emails)');
  },
  sendGoalApproved: (_employeeEmail: string, _cycleId: string) => {
    console.log('[EmailService] Goal approved notification (demo mode)');
  },
  sendGoalReturned: (_employeeEmail: string, _comment: string) => {
    console.log('[EmailService] Goal returned notification (demo mode)');
  },
  sendCheckinReminder: (_emails: string[], _period: string) => {
    console.log('[EmailService] Check-in reminder (demo mode)');
  },
};
