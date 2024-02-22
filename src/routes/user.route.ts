import {
  deleteProfile,
  getFriendsList,
  getProfile,
  getUserProfile,
  loginUser,
  logoutUser,
  queryUsers,
  registerUser,
  updateProfile
} from '@/controllers/user.controller';
import { isAuthenticated } from '@/middlewares/auth';
import express from 'express';

const router = express.Router();
export const userRoute = router;

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/search', isAuthenticated, queryUsers);
router.get('/friends', isAuthenticated, getFriendsList);
router
  .route('/profile')
  .get(isAuthenticated, getProfile)
  .put(isAuthenticated, updateProfile)
  .delete(isAuthenticated, deleteProfile);
router.get('/user/:id', isAuthenticated, getUserProfile);
router.get('/logout', isAuthenticated, logoutUser);
