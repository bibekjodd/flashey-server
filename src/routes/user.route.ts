import {
  deleteProfile,
  getProfile,
  loginUser,
  logoutUser,
  queryUsers,
  registerUser
} from '@/controllers/user.controller';
import { isAuthenticated } from '@/middlewares/auth';
import express from 'express';

const router = express.Router();
export const userRoute = router;

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/search', isAuthenticated, queryUsers);
router
  .route('/profile')
  .get(isAuthenticated, getProfile)
  .delete(isAuthenticated, deleteProfile);
router.get('/logout', isAuthenticated, logoutUser);
