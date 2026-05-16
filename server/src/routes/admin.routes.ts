import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth.middleware';
import { getUsers, createUser, updateUserRole, getCycles, createCycle, updateCycle, unlockGoal, getAuditLogs, getAchievementReport } from '../controllers/admin.controller';

const router = Router();
router.use(authenticate, requireRole('admin'));
router.get('/users', getUsers);
router.post('/users', createUser);
router.put('/users/:id/role', updateUserRole);
router.get('/cycles', getCycles);
router.post('/cycles', createCycle);
router.put('/cycles/:id', updateCycle);
router.post('/goals/:id/unlock', unlockGoal);
router.get('/audit-logs', getAuditLogs);
router.get('/reports/achievement', getAchievementReport);

export default router;
