import {
  accessChat,
  createGroupChat,
  deleteChat,
  fetchChats,
  updateChat
} from '@/controllers/chat.controller';
import { Router } from 'express';

const router = Router();
export const chatRoute = router;

router.post('/chat', createGroupChat);
router.get('/chats', fetchChats);
router.route('/chat/:id').get(accessChat).put(updateChat).delete(deleteChat);
