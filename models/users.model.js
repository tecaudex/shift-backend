const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const userSchema = new Schema(
  {
    f_id: {
      type: String,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: /^\S+@\S+\.\S+$/, // regex for email validation
    },
    password: {
      type: String,
      minlength: 6, // at least 6 characters
      maxlength: 128, // at most 128 characters
    },
    profilePicture: {
      type: String,
    },
    role: {
      type: String,
      default: "regular",
      enum: ["regular", "admin"], // only allow 'regular' or 'admin' as values
    },
    gratitudes: [{ type: Schema.Types.ObjectId, ref: "Gratitude" }],
    provider: {
      type: String,
      default: "email",
      enum: ["email", "google", "apple"],
    },
  },
  {
    timestamps: true,
  }
);

const User = mongoose.model("User", userSchema);

module.exports = User;
