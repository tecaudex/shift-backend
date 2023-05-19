const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const sessionSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    gratitudes: [
      {
        type: Schema.Types.ObjectId,
        ref: "Gratitude",
      },
    ],
    timeTaken: {
      type: Number,
      default: 0,
    },
    feeling: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

const Session = mongoose.model("Session", sessionSchema);

module.exports = Session;
