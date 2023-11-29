import express from 'express';
import {
  createUser,
  login,
  logout,
  myProfile,
  searchUsers,
  suggestedUsers
} from '@/controllers/user.controller';
import { isAuthenticated } from '@/middlewares/auth';
const router = express.Router();

router.post('/register', createUser);
router.post('/login', login);
router.get('/profile', isAuthenticated, myProfile);
router.get('/logout', logout);
router.get('/users', isAuthenticated, searchUsers);
router.get('/suggestedusers', isAuthenticated, suggestedUsers);

export default router;
