const Gratitude = require("../models/gratitude.model");
const crypto = require("crypto");

const algorithm = "aes-256-cbc";
const key = process.env.GRATITUDE_ENCRYPTION_KEY;

function decrypt(ciphertext) {
  const [ivStr, encrypted] = ciphertext.split(":");
  const iv = Buffer.from(ivStr, "hex");
  const decipher = crypto.createDecipheriv(algorithm, key, iv);
  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}

exports.create = async (req, res) => {
  const user = req.user;
  const { title, description, timeTaken } = req.body;

  if (!title || !description || !timeTaken)
    return res
      .status(400)
      .json({ error: "Please send title, description and timeTaken" });

  const gratitude = new Gratitude({
    title: title,
    description: description,
    timeTaken: timeTaken,
    user: user._id,
  });

  gratitude
    .save()
    .then(async (savedGratitude) => {
      user.gratitudes.push(savedGratitude._id);

      user
        .save()
        .then((savedUser) => res.status(200).json(savedGratitude))
        .catch((err) =>
          res
            .status(500)
            .json({ error: `Error while saving user to DB, ${err}` })
        );
    })
    .catch((err) =>
      res
        .status(500)
        .json({ error: `Error while saving Gratitude to DB, ${err}` })
    );
};

// Get gratitudes for the week with pagination
exports.getGratitudesForWeek = async (req, res, next) => {
  try {
    // Get user from the request
    const user = req.user;

    // Get the page number from the request query (default to 1 if not provided)
    const page = parseInt(req.query.page) || 1;

    // Find the last gratitude date for the current user
    const lastGratitude = await Gratitude.findOne({ user: user._id }).sort({
      createdAt: -1,
    });

    if (lastGratitude) {
      const date = lastGratitude.createdAt;

      // Calculate the date range for the week containing the given date
      const startOfWeek = new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate() - date.getDay() - (page - 1) * 7
      );
      const endOfWeek = new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate() + (6 - date.getDay()) - (page - 1) * 7
      );

      // Find gratitudes within the date range for the current user
      const gratitudes = await Gratitude.find({
        user: user._id,
        createdAt: { $gte: startOfWeek, $lte: endOfWeek },
      });

      // Decrypt the title and description of each gratitude
      const decryptedGratitudes = gratitudes.map((gratitude) => {
        const decryptedTitle = decrypt(gratitude.title);
        const decryptedDescription = decrypt(gratitude.description);

        return {
          ...gratitude._doc,
          title: decryptedTitle,
          description: decryptedDescription,
        };
      });

      // Create week label
      const weekNumber = getWeekOfMonth(startOfWeek);
      const monthName = getMonthName(startOfWeek);
      const weekLabel = `${weekNumber}${getOrdinalSuffix(
        weekNumber
      )} Week of ${monthName} ${startOfWeek.getFullYear()}`;

      return res
        .status(200)
        .json({ weekLabel, gratitudes: decryptedGratitudes });
    } else {
      return res
        .status(200)
        .json({ weekLabel: "No Gratitudes", gratitudes: [] });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Helper function to get the ordinal suffix of a number
function getOrdinalSuffix(n) {
  const s = ["th", "st", "nd", "rd"],
    v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
}

function getWeekOfMonth(date) {
  const day = date.getUTCDate();
  const weekOfMonth = Math.ceil(day / 7);
  return weekOfMonth;
}

function getMonthName(date) {
  const options = { month: "long", timeZone: "UTC" };
  const monthName = date.toLocaleString("en-US", options);
  return monthName;
}

// Get all gratitudes with pagination
exports.getAllGratitudes = async (req, res, next) => {
  try {
    // Get user from the request
    const user = req.user;

    // Get pagination parameters from the request query (or use default values)
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    // Calculate the number of documents to skip
    const skip = (page - 1) * limit;

    // Find gratitudes for the current user with pagination
    const gratitudes = await Gratitude.find({ user: user._id })
      .sort({ createdAt: -1 }) // Order by creation date (descending)
      .skip(skip)
      .limit(limit);

    // Decrypt the title and description of each gratitude
    const decryptedGratitudes = gratitudes.map((gratitude) => {
      const decryptedTitle = decrypt(gratitude.title);
      const decryptedDescription = decrypt(gratitude.description);

      return {
        ...gratitude._doc,
        title: decryptedTitle,
        description: decryptedDescription,
      };
    });

    // Count the total number of gratitudes for the current user
    const totalGratitudes = await Gratitude.countDocuments({ user: user._id });

    // Calculate the total number of pages
    const totalPages = Math.ceil(totalGratitudes / limit);

    return res.status(200).json({
      gratitudes: decryptedGratitudes,
      currentPage: page,
      totalPages,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: error });
  }
};
