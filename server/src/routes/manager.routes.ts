import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth.middleware';
import { getTeamGoals, approveGoals, rejectGoals, inlineEditGoal, pushSharedGoal, getTeamCheckins } from '../controllers/manager.controller';

const router = Router();
router.use(authenticate, requireRole('manager','admin'));
router.get('/team-goals', getTeamGoals);
router.post('/approve', approveGoals);
router.post('/reject', rejectGoals);
router.put('/goals/:goalId/inline-edit', inlineEditGoal);
router.post('/shared-goals', pushSharedGoal);
router.get('/team-checkins', getTeamCheckins);

export default router;
