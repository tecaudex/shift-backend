const Streak = require("../models/streak.model");

async function getStreak(req, res) {
  try {
    const userId = req.user._id;
    const actionType = req.params.actionType;

    let streak = await Streak.findOne({ userId, actionType });
    if (!streak) {
      streak = new Streak({
        userId: userId,
        actionType: actionType,
        lastActionTime: Date(),
        streakCount: 0,
        longestStreak: 0,
        dailyChange: 0,
      });
    }

    return res.status(200).json(streak);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err });
  }
}

async function updateStreak(userId, actionType, actionTime) {
  // Find the streak for the user and action type
  let streak = await Streak.findOne({ userId, actionType });

  // If there is no existing streak, create a new one
  if (!streak) {
    streak = new Streak({
      userId,
      actionType,
      lastActionTime: actionTime,
      streakCount: 1,
      longestStreak: 1,
      dailyChange: 0,
    });
  } else {
    // If the user has performed the action within the streak window, increment the streak count
    const lastActionDate = new Date(streak.lastActionTime);
    const actionDate = new Date(actionTime);

    if (actionDate.toDateString() === lastActionDate.toDateString()) {
      // If the action was performed on the same day as the last successful streak, do not increment the streak count
    } else if (actionDate - lastActionDate === 86400000) {
      // 86400000 ms = 1 day
      // If the user performed the action within the streak window (24 hours), increment the streak count
      streak.streakCount += 1;
      if (streak.streakCount > streak.longestStreak) {
        streak.longestStreak = streak.streakCount;
      }
      streak.dailyChange = 1; // Incremented the streak count, so daily change is +1
    } else {
      // If the user missed a day, reset the streak count
      streak.dailyChange =
        streak.streakCount > 1 ? -1 * (streak.streakCount - 1) : 0; // Calculate the daily change when the streak count is reset
      streak.streakCount = 1;
    }

    streak.lastActionTime = actionTime;
  }

  // Save the streak to the database
  await streak.save();

  return streak;
}

module.exports = { getStreak, updateStreak };
