import {
  accessChat,
  addToGroupChat,
  createGroupChat,
  deleteChat,
  fetchChats,
  removeFromGroup,
  updateChat
} from '@/controllers/chat.controller';
import { isAuthenticated } from '@/middlewares/auth';
import { Router } from 'express';

const router = Router();
export const chatRoute = router;

router.post('/group', isAuthenticated, createGroupChat);
router.get('/chats', isAuthenticated, fetchChats);
router.get('/chat/:id', isAuthenticated, accessChat);
router.put('/update-group/:id', isAuthenticated, updateChat);
router.put('/add-to-group/:id', isAuthenticated, addToGroupChat);
router.put('/remove-from-group/:id', isAuthenticated, removeFromGroup);
router.delete('/chat/:id', isAuthenticated, deleteChat);
