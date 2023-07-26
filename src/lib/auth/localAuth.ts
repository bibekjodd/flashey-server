// @ts-ignore
import { Strategy } from "passport-local";

// @ts-ignore
import passport from "passport";
import User from "../../models/User.Model";

export const initializeLocalAuth = () => {
  passport.use(
    new Strategy(
      { passwordField: "password", usernameField: "email" },
      // @ts-ignore
      async (username, password, done) => {
        const user = await User.findOne({ email: username }).select(
          "+password"
        );

        if (!user) return done(null, false);

        const isMatch = await user.comparePassword(password);
        if (!isMatch) return done(null, false);
        done(null, user);
      }
    )
  );

  // @ts-ignore
  passport.serializeUser(function (user, done) {
    // @ts-ignore
    done(null, user.id);
  });

  // @ts-ignore
  passport.deserializeUser(async (id, done) => {
    try {
      const user = await User.findById(id);
      done(null, user);
    } catch (error) {
      done(error, false);
    }
  });
};
