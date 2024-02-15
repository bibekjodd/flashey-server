import {
  accessChat,
  accessGroupChat,
  addToGroupChat,
  createGroupChat,
  deleteChat,
  fetchChats,
  removeFromGroup,
  updateGroup
} from '@/controllers/chat.controller';
import { isAuthenticated } from '@/middlewares/auth';
import { Router } from 'express';

const router = Router();
export const chatRoute = router;

router.post('/group', isAuthenticated, createGroupChat);
router.get('/chats', isAuthenticated, fetchChats);
router.get('/chat/friend/:id', isAuthenticated, accessChat);
router.get('/chat/group/:id', isAuthenticated, accessGroupChat);
router.put('/update-group/:id', isAuthenticated, updateGroup);
router.put('/add-to-group/:id', isAuthenticated, addToGroupChat);
router.put('/remove-from-group/:id', isAuthenticated, removeFromGroup);
router.delete('/group/:id', isAuthenticated, deleteChat);
