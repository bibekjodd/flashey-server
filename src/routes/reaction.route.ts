import { addReaction } from '@/controllers/reaction.controller';
import { isAuthenticated } from '@/middlewares/auth';
import { Router } from 'express';

const router = Router();
export const reactionRoute = router;

router.put('/reaction/:id', isAuthenticated, addReaction);
