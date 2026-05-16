/**
 * Microsoft Teams Notification Service (Frontend stub)
 * Real implementation uses Teams Webhooks + Adaptive Cards in the backend.
 * These stubs prevent build errors when the backend is not connected.
 */

export const teamsService = {
  sendGoalSubmittedCard: (_managerName: string, _employeeName: string, _goalCount: number) => {
    console.log('[TeamsService] Goal submitted card (demo mode — backend handles real Teams cards)');
  },
  sendGoalApprovedCard: (_employeeName: string, _cycleId: string) => {
    console.log('[TeamsService] Goal approved card (demo mode)');
  },
  sendGoalReturnedCard: (_employeeName: string, _comment: string) => {
    console.log('[TeamsService] Goal returned card (demo mode)');
  },
  sendEscalationAlert: (_managerName: string, _employeeName: string, _overdueDays: number) => {
    console.log('[TeamsService] Escalation alert (demo mode)');
  },
};
