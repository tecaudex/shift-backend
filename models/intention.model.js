const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const intentionSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    event: {
      type: String,
      required: true,
    },
    intention: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const Intention = mongoose.model("Intention", intentionSchema);

module.exports = Intention;
