import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth.middleware';
import { submitCheckin, getCheckins, addManagerComment } from '../controllers/checkins.controller';

const router = Router();
router.use(authenticate);
router.get('/', getCheckins);
router.post('/', submitCheckin);
router.put('/:id/comment', requireRole('manager','admin'), addManagerComment);

export default router;
