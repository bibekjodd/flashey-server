import { env } from '@/config/env.config';
import {
  deleteProfile,
  getFriendsList,
  getProfile,
  getUserProfile,
  logoutUser,
  queryUsers,
  registerUser,
  updateProfile
} from '@/controllers/user.controller';
import express from 'express';
import passport from 'passport';

const router = express.Router();
export const userRoute = router;

router.post('/register', registerUser);
router.post('/login', passport.authenticate('local'), getProfile);
router.get(
  '/login/google',
  passport.authenticate('google', { scope: ['email', 'profile'] }),
  getProfile
);
router.get('/callback/google', passport.authenticate('google'), (req, res) => {
  return res.redirect(env.AUTH_REDIRECT_URI);
});
router.get('/search', queryUsers);
router.get('/friends', getFriendsList);
router
  .route('/profile')
  .get(getProfile)
  .put(updateProfile)
  .delete(deleteProfile);
router.get('/user/:id', getUserProfile);
router.get('/logout', logoutUser);
