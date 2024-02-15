import {
  deleteMessage,
  editMessage,
  fetchMessage,
  fetchMessages,
  messageSeen,
  sendMessage
} from '@/controllers/message.controller';
import { isAuthenticated } from '@/middlewares/auth';
import { Router } from 'express';

const router = Router();
export const messageRoute = router;

router.post('/message/:id', isAuthenticated, sendMessage);
router.get('/messages/:id', isAuthenticated, fetchMessages);
router.get('/message/:id', isAuthenticated, fetchMessage);
router.put('/seen/:id', isAuthenticated, messageSeen);
router.put('/message/:id', isAuthenticated, editMessage);
router.delete('/message/:id', isAuthenticated, deleteMessage);
