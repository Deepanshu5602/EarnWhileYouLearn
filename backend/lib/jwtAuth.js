import passport from "passport";

const jwtAuth = async (req, res, next) => {
  // console.log(req);
  // console.log(req.body.headers);
  try {
    const user = await new Promise((resolve, reject) => {
      passport.authenticate("jwt", { session: false }, (err, user, info) => {
        if (err) return reject(err);
        if (!user) return resolve(null);
        resolve(user);
      })(req, res, next);
    });
    // console.log(user);
    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

export default jwtAuth;
