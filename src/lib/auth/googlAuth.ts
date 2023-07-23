import passport from "passport";
import { Strategy } from "passport-google-oauth20";
import User from "../../models/User.Model";

export const initializeGoogleAuth = () => {
  passport.use(
    new Strategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.CALLBACK_URL,
      },
      async (accessToken, refreshToken, profile, done) => {
        const name = profile.displayName;
        const email = profile.emails?.at(0)?.value || "";
        const pictureUrl = profile.photos?.at(0)?.value || "";

        try {
          const user = await User.findOne({ email });
          if (user) {
            user.name = name;
            user.email = email;
            user.picture = { url: pictureUrl };
            await user.save();
            return done(null, user as any);
          } else {
            const user = await User.create({
              name,
              email,
              picture: {
                url: pictureUrl,
              },
              password: process.env.SESSION_SECRET.slice(0, 10),
            });

            return done(null, user);
          }
        } catch (err: any) {
          done(err, false);
        }
      }
    )
  );

  passport.serializeUser((user, done) => {
    // @ts-ignore
    return done(null, user.id);
  });

  passport.deserializeUser(async (id, done) => {
    try {
      const user = await User.findById(id);
      return done(null, user);
    } catch (error: any) {
      return done(error, undefined);
    }
  });
};
