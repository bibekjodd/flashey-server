import {
  accessChat,
  addToGroupChat,
  createGroupChat,
  deleteChat,
  fetchChats,
  removeFromGroup,
  updateChat
} from '@/controllers/chat.controller';
import { Router } from 'express';

const router = Router();
export const chatRoute = router;

router.post('/group', createGroupChat);
router.get('/chats', fetchChats);
router.get('/chat/:id', accessChat);
router.put('/update-group/:id', updateChat);
router.put('/add-to-group/:id', addToGroupChat);
router.put('/remove-from-group/:id', removeFromGroup);
router.delete('/chat/:id', deleteChat);
