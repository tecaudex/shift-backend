const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const gratitudeSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    timeTaken: {
      type: Number,
      required: true,
    },
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  {
    timestamps: true,
  }
);

const Gratitude = mongoose.model("Gratitude", gratitudeSchema);

module.exports = Gratitude;
