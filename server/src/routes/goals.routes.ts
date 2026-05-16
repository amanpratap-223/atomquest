import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth.middleware';
import { createGoal, getMyGoals, updateGoal, deleteGoal, submitGoals } from '../controllers/goals.controller';

const router = Router();
router.use(authenticate);
router.get('/', getMyGoals);
router.post('/', createGoal);
router.put('/:id', updateGoal);
router.delete('/:id', deleteGoal);
router.post('/submit', submitGoals);

export default router;
