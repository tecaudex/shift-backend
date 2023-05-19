const User = require("../models/users.model");
const fs = require("fs");
const AWS = require("aws-sdk");
const Session = require("../models/session.model");
const moment = require("moment");
const Gratitude = require("../models/gratitude.model");

exports.getAll = async (req, res) => {
  try {
    // Check if user is an admin
    if (!req.user.role == "admin") {
      return res.status(401).json({
        error: "Unauthorized. Only admin users can access this route.",
      });
    }
    const users = await User.find({});
    return res.json({ users });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.getUser = (req, res) => {
  try {
    const user = req.user;

    const userData = {
      _id: user._id,
      name: user.name,
      email: user.email,
      profilePicture: user.profilePicture,
      createdAt: user.createdAt,
    };

    return res.json(userData);
  } catch (err) {
    console.error(err.message);
    return res.status(500).json({ error: "Server error" });
  }
};

exports.updateUser = async (req, res) => {
  const { name, email } = req.body;
  const file = req.file;

  try {
    let user = req.user;

    if (!user) {
      return res.status(400).json({ error: "User not found" });
    }

    if (file) {
      AWS.config.update({
        accessKeyId: process.env.AWS_ACCESS_KEY,
        secretAccessKey: process.env.AWS_SECRET_KEY,
      });

      const s3 = new AWS.S3(process.env.AWS_BUCKET_REGION);

      const key = `user_profile_image/${user._id}/${Date.now()}-${
        file.originalname
      }`;

      const fileStream = fs.createReadStream(file.path);

      const uploadParams = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Body: fileStream,
        Key: key,
      };

      const s3UploadResponse = await s3.upload(uploadParams).promise();
      const profilePicture = s3UploadResponse.Location;

      user.profilePicture = profilePicture;

      fs.unlink(file.path, (err) => {
        if (err) {
          throw err;
        }

        console.log("Delete File successfully.");
      });
    }

    if (name) user.name = name;
    if (email) user.email = email;

    await user.save();

    const userData = {
      _id: user._id,
      name: user.name,
      email: user.email,
      profilePicture: user.profilePicture,
      createdAt: user.createdAt,
    };

    res.json(userData);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
};

exports.getResults = async (req, res) => {
  const userId = req.user._id; // assume the authenticated user's ID is stored in req.user._id

  const gratitudesCount = await Gratitude.countDocuments({ user: userId });

  const userSessions = await Session.find({ user: userId }).sort({
    createdAt: "asc",
  });

  let totalTime = 0;
  let currentStreak = 0;
  let longestStreak = 0;
  let previousDate;

  userSessions.forEach((session) => {
    totalTime += session.timeTaken;
    const sessionDate = moment(session.createdAt).startOf("day");

    // Check if the current session's date is consecutive with the previous session's date
    if (previousDate && sessionDate.diff(previousDate, "days") === 1) {
      currentStreak++;
    } else {
      // Check if the current streak is longer than the longest streak
      if (currentStreak > longestStreak) {
        longestStreak = currentStreak;
      }
      currentStreak = 1;
    }

    previousDate = sessionDate;
  });

  // Check if the current streak is longer than the longest streak
  if (currentStreak > longestStreak) {
    longestStreak = currentStreak;
  }

  return res.json({
    gratitudesCount,
    totalTime,
    longestStreak,
  });
};

exports.getGratitudeStats = async (req, res) => {
  try {
    const userId = req.user._id;

    const startDate = moment().startOf("week").add(1, "days");
    const endDate = moment().endOf("day");

    const totalGratitudes = await Gratitude.countDocuments({
      user: userId,
      createdAt: { $gt: startDate.toDate(), $lt: endDate.toDate() },
    });

    const avgGratitudesPerDay = parseInt(totalGratitudes / 7);

    // Calculate daily change in average
    const today = moment();
    const daysElapsed = today.diff(startDate, "days") + 1;
    const yesterdayTotalGratitudes =
      totalGratitudes -
      (await Gratitude.countDocuments({
        user: userId,
        createdAt: {
          $gt: today.startOf("day").toDate(),
          $lt: today.endOf("day").toDate(),
        },
      }));

    const yesterdayAvgGratitudes =
      daysElapsed != 1
        ? parseInt(yesterdayTotalGratitudes / (daysElapsed - 1))
        : 0;

    const dailyChangeInAvg = parseInt(
      avgGratitudesPerDay - yesterdayAvgGratitudes
    );

    return res.status(200).json({
      avgGratitudesPerDay: avgGratitudesPerDay,
      dailyChangeInAvg: dailyChangeInAvg,
    });
  } catch (err) {
    console.log(err);
    throw res.status(500).json({ error: err });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    // todo implement cases for google and apple account deletion

    const userId = req.user._id;

    const user = await User.findByIdAndDelete(userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (user.profilePicture) {
      const s3 = new AWS.S3({
        accessKeyId: process.env.AWS_ACCESS_KEY,
        secretAccessKey: process.env.AWS_SECRET_KEY,
        region: process.env.AWS_BUCKET_REGION,
      });

      const params = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: user.profilePicture.split("/").pop(),
      };

      await s3.deleteObject(params).promise();
    }

    await Session.deleteMany({ user: userId });
    await Gratitude.deleteMany({ user: userId });
    await Statistics.deleteOne({ userId });

    return res
      .status(200)
      .json({ message: "User account deleted successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.saveGratitudePoints = async (userId, points) => {
  // console.log("saveGratitudePoints \n", "userId:", userId ,"\n points:" , points);
  try {
    await User.updateOne({ _id: userId }, { $inc: { points: points } });
  } catch (error) {
    console.log("error", error);
  }
};
