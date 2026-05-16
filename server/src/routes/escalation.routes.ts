import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth.middleware';
import { getRules, createRule, updateRule, deleteRule } from '../controllers/escalation.controller';

const router = Router();
router.use(authenticate, requireRole('admin'));
router.get('/', getRules);
router.post('/', createRule);
router.put('/:id', updateRule);
router.delete('/:id', deleteRule);

export default router;
