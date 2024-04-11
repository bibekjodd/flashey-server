import { db } from '@/config/database';
import { env } from '@/config/env.config';
import { selectUserSnapshot, users } from '@/schemas/user.schema';
import { Strategy } from 'passport-google-oauth20';

export const GoogleStrategy = new Strategy(
  {
    clientID: env.GOOGLE_CLIENT_ID,
    clientSecret: env.GOOGLE_CLIENT_SECRET,
    passReqToCallback: true,
    callbackURL: env.GOOGLE_CALLBACK_URL
  },
  async (req, accessToken, refreshToken, profile, done) => {
    try {
      const name: string = profile.displayName;
      const email: string = profile.emails?.at(0)?.value || '';
      const image: string | null = profile.photos?.at(0)?.value || null;

      const [user] = await db
        .insert(users)
        .values({ email, name, image, isGoogleUser: true })
        .onConflictDoUpdate({
          target: [users.email],
          set: { isGoogleUser: true, lastOnline: new Date().toISOString() }
        })
        .returning(selectUserSnapshot);
      return done(null, user);
    } catch (err) {
      done(err as Error, undefined);
    }
  }
);
