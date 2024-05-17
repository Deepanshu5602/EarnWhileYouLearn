import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Strategy as JWTStrategy, ExtractJwt } from "passport-jwt";
import User from "../db/User.js";
import { authKeys } from "./authKeys.js";

const filterJson = (obj, unwantedKeys) => {
    const filteredObj = {};
    Object.keys(obj).forEach((key) => {
      if (unwantedKeys.indexOf(key) === -1) {
        filteredObj[key] = obj[key];
      }
    });
    return filteredObj;
};

passport.use(
  new LocalStrategy(
    {
      usernameField: "email",
      passReqToCallback: true,
    },
    async (req, email, password, done) => {
      try {
        const user = await User.findOne({ email: email });
        if (!user) {
          return done(null, false, {
            message: "User does not exist",
          });
        }
        try{
            await user.login(password);
            const filteredUser = filterJson(user.toObject(), ["password", "__v"]);
            // Filter out sensitive fields like password and __v from the user object
            return done(null, filteredUser);
        }catch(err){
          return done(null, false, {
            message: "Password is incorrect.",
          });
        } 
      } catch (err) {
        return done(err);
      }
    }
  )
);


  
passport.use(
    new JWTStrategy(
      {
        jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
        secretOrKey: authKeys.jwtSecretKey,
      },
      (jwt_payload, done) => {
        User.findById(jwt_payload._id)
          .then((user) => {
            if (!user) {
              return done(null, false, {
                message: "JWT Token does not exist",
              });
            }
            user["_doc"] = filterJson(user["_doc"], ["password", "__v"]);
            return done(null, user);
          })
          .catch((err) => {
            return done(err, false, {
              message: "Incorrect Token",
            });
          });
      }
    )
);
  
export default passport;