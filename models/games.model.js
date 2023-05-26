const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const gamesSchema = new Schema(
  {
    name: { type: String, unique: true, require: true },
    systemMessage: { type: String, require: true },
    isPaid: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

const Games = mongoose.model("Games", gamesSchema);

module.exports = Games;
