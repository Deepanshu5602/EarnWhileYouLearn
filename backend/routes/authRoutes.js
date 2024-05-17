// import express from "express";
// import passport from "passport";
// import jwt from "jsonwebtoken";

// import { authKeys } from "../lib/authKeys.js"; 
// import User from '../db/User.js'; 
// import JobApplicant from '../db/JobApplicant.js';
// import Recruiter from '../db/Recruiter.js';
// import nodemailer from "nodemailer";
// import { randomBytes } from 'crypto';
// const router = express.Router();

// router.post("/signup", async(req, res) => {
//     let user;
//     try{
//         const data = req.body;
//         console.log(data);
//         //  res.json(data);
//         const verificationToken = crypto.randomBytes(20).toString("hex");
//         console.log(erificationToken);
//         user = new User({
//             email: data.email,
//             password: data.password,
//             type: data.type,
//             verificationToken: verificationToken,
//         }); 
//         await user.save();
//         const verificationLink = `https://yourwebsite.com/verify-email/${verificationToken}`;
//         sendVerificationEmail(data.email, verificationLink);
//         const userDetails =
//             user.type === "recruiter"
//                 ? new Recruiter({
//                     userId: user._id,
//                     name: data.name,
//                     contactNumber: data.contactNumber,
//                     bio: data.bio,
//                 })
//                 :new JobApplicant({
//                     userId: user._id,
//                     name: data.name,
//                     education: data.education,
//                     skills: data.skills,
//                     rating: data.rating,
//                     resume: data.resume,
//                     profile: data.profile,
//                 });
//         await userDetails.save()
//         // Token
//         const token = jwt.sign({ _id: user._id }, authKeys.jwtSecretKey);
//         res.json({
//             token: token,
//             type: user.type,
//         });
//     }catch(err){
//         if (user && user._id) {
//           await User.findByIdAndRemove(user._id);
//         }
//         console.log(err);
//         res.status(400).json(err);
//     }
// });
// // Email verification route
// router.get("/verify-email/:token", async (req, res) => {
//   const token = req.params.token;

//   // Find the user with the provided verification token
//   const user = await User.findOne({ verificationToken: token });

//   if (!user) {
//     // Token is invalid or has already been used
//     return res.status(400).json({ error: "Invalid verification token" });
//   }

//   // Update the user's status to indicate that they have been verified
//   user.verified = true;
//   user.verificationToken = undefined; // Clear the verification token
//   await user.save();

//   // Redirect the user to a thank you page or login page
//   res.redirect("/thank-you");
// });
// // Function to send a verification email
// function sendVerificationEmail(email, verificationLink) {
//   const transporter = nodemailer.createTransport({
//     service: "Gmail",
//     auth: {
//       user: "jainshreya16416@gmail.com", // Your Gmail email address
//       pass: "qwerty@123",}
//   });

//   const mailOptions = {
//     from: "jainshreya16416@gmail.com",
//     to: email,
//     subject: "Email Verification",
//     html: `Please click the following link to verify your email: <a href="${verificationLink}">${verificationLink}</a>`,
//   };

//   transporter.sendMail(mailOptions, (error, info) => {
//     if (error) {
//       console.error("Email verification failed:", error);
//     } else {
//       console.log("Email verification sent:", info.response);
//     }
//   });
// }

// router.post("/login", async (req, res, next) => {
//     try {
//         const { err, user, info } = await new Promise((resolve, reject) => {
//           passport.authenticate("local", { session: false }, (err, user, info) => {
//             if (err) reject(err);
//             resolve({ err, user, info });
//           })(req, res, next);
//         });
    
//         if (!user) {
//           res.status(401).json(info);
//           return;
//         }
    
//         const token = jwt.sign({ _id: user._id }, authKeys.jwtSecretKey);
//         res.json({
//           token,
//           type: user.type,
//         });
//       } catch (error) {
//         next(error);
//       }
// });

// export default router;



import express from "express";
import passport from "passport";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { authKeys } from "../lib/authKeys.js";
import User from '../db/User.js';
import JobApplicant from '../db/JobApplicant.js';
import Recruiter from '../db/Recruiter.js';
import nodemailer from "nodemailer";

const router = express.Router();

const sendVerifyMail = async (name, email, user_id) => {
  try {
    console.log("in the function");
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      auth: {
        user: '',
        pass: ''
      }
    });
    const mailOptions = {
      from: 'Your Mail',
      to: email,
      subject: 'Verification',
      html: `<p>Hi ${name}, please click <a href="http://localhost:3000/verify?id=${user_id}">here</a> to verify your email</p>`
    }
    transporter.sendMail(mailOptions, function (error, info) {
      if (error) {
        console.log(error);
      } else {
        console.log("Email has been sent:", info.response);
      }
    });
  } catch (error) {
    console.log(error.message);
  }
};

router.post("/signup", async (req, res) => {
  let user;
  try {
    const data = req.body;
    if (data.type === "recruiter" && !/^[A-Za-z]/.test(data.email)) {
      return res.status(400).json({
        message: "You don't have permission to be a recruiter",
      });
    }
    user = new User({
      email: data.email,
      password: data.password,
      type: data.type,
    });
    console.log(user);
    await user.save();

    const userDetails =
      user.type === "recruiter"
        ? new Recruiter({
          userId: user._id,
          name: data.name,
          contactNumber: data.contactNumber,
          bio: data.bio,
        })
        : new JobApplicant({
          userId: user._id,
          name: data.name,
          education: data.education,
          skills: data.skills,
          rating: data.rating,
          resume: data.resume,
          profile: data.profile,
        });
    await userDetails.save();
    if (userDetails) {
      // console.log("sending mail");
      // console.log(userDetails);
      // console.log(userDetails.userId);
      sendVerifyMail(req.body.name, req.body.email, userDetails.userId);
    }
    

    // const token = jwt.sign({ _id: user._id }, authKeys.jwtSecretKey);
    // res.json({
    //   token: token,
    //   type: user.type,
    // });
    return res.status(200).json({
      message: "Verification link sent to your email",
    });
  } catch (err) {
    if (user && user._id) {
      await User.findByIdAndRemove(user._id);
    }
    console.log(err);
    if (err.code === 11000) {
      // Handle duplicate key error (email already exists)
      return res.status(400).json({
        message: "User with this email already exists",
      });
    }
    res.status(400).json(err);
  }
});

router.post("/login", async (req, res, next) => {
  try {
    console.log(req.params);
    
    console.log(req);
    console.log(req.user);
    const { err, user, info } = await new Promise((resolve, reject) => {
      passport.authenticate("local", { session: false }, (err, user, info) => {
        if (err) reject(err);
        resolve({ err, user, info });
      })(req, res, next);
    });

    if (!user) {
      res.status(401).json(info);
      return;
    }
    console.log(user);
    if(!user.verified){
      return res.status(401).json({
        message: "Not verified",
      });
    }

    const token = jwt.sign({ _id: user._id }, authKeys.jwtSecretKey);
    res.json({
      token,
      type: user.type,
    });
  } catch (error) {
    next(error);
  }
});

router.get("/verify", async (req, res) => {
  try {
    console.log(req.query.id);
    const userID = req.query.id;
    const user = await User.findOne({_id: new mongoose.Types.ObjectId(userID)}).exec();
    console.log("verifying", user);
    user.verified = true;
    await user.save();
    console.log("Verification success");
  } catch (error) {
    console.log(error.message);
  }
});

export default router;
