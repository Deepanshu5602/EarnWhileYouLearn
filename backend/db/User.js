import mongoose from "mongoose";
import bcrypt from "bcrypt";
import mongooseTypeEmail from "mongoose-type-email";

let schema = new mongoose.Schema(
    {
      email: {
        type: mongooseTypeEmail,
        unique: true,
        lowercase: true,
        required: true,
        validate: {
          validator: function (value) {
            // Use a regular expression to check if the email has the desired domain
            return /@iitjammu\.ac\.in$/.test(value);
          },
          message: 'Please use institute email-id',
        },
      },
      password: {
        type: String,
        required: true,
      },
      type: {
        type: String,
        enum: ["recruiter", "applicant"],
        required: true,
      },
      verified: {
        type: Boolean,
        default: false,
      },
    },
    { collation: { locale: "en" } }
  );
  
  // Password hashing
  schema.pre("save", function (next) {
    const user = this;
  
    // if the data is not modified
    if (!user.isModified("password")) {
      return next();
    }
  
    bcrypt.hash(user.password, 10, (err, hash) => {
      if (err) {
        return next(err);
      }
      user.password = hash;
      next();
    });
  });
  
  // Password verification upon login
  schema.methods.login = function (password) {
    const user = this;
  
    return new Promise((resolve, reject) => {
      bcrypt.compare(password, user.password, (err, result) => {
        if (err) {
          reject(err);
        }
        if (result) {
          resolve();
        } else {
          reject();
        }
      });
    });
};

export default mongoose.model("UserAuth", schema);
