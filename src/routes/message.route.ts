import {
  deleteMessage,
  editMessage,
  fetchMessage,
  fetchMessages,
  messageSeen,
  sendMessage,
  updateTypingStatus
} from '@/controllers/message.controller';
import { Router } from 'express';

const router = Router();
export const messageRoute = router;

router.put('/typing/:id', updateTypingStatus);
router.post('/message/:id', sendMessage);
router.get('/messages/:id', fetchMessages);
router.get('/message/:id', fetchMessage);
router.put('/seen/:id', messageSeen);
router.put('/message/:id', editMessage);
router.delete('/message/:id', deleteMessage);
