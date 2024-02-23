import { addReaction } from '@/controllers/reaction.controller';
import { Router } from 'express';

const router = Router();
export const reactionRoute = router;

router.put('/reaction/:id', addReaction);
