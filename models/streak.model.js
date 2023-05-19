const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const streakSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    required: true,
  },
  actionType: {
    type: String,
    required: true,
  },
  lastActionTime: {
    type: Date,
    required: true,
  },
  streakCount: {
    type: Number,
    default: 0,
  },
  longestStreak: {
    type: Number,
    default: 0,
  },
  dailyChange: {
    type: Number,
    default: 0,
  },
});

const Streak = mongoose.model("Streak", streakSchema);

module.exports = Streak;
