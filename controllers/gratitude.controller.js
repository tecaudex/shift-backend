const { Op } = require("sequelize");
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

// Create gratitude
exports.create = async (req, res) => {
  const user = req.user;
  const { title, description, timeTaken } = req.body;

  if (!title || !description || !timeTaken) {
    return res
      .status(400)
      .json({ error: "Please send title, description, and timeTaken" });
  }

  try {
    const gratitude = await Gratitude.create({
      title,
      description,
      timeTaken,
      userId: user._id,
    });

    user.gratitudes.push(gratitude.id);

    await user.save();

    return res.status(200).json(gratitude);
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ error: "Error while saving Gratitude to DB" });
  }
};

// Get gratitudes for the week with pagination
exports.getGratitudesForWeek = async (req, res) => {
  const user = req.user;
  const { page = 1 } = req.query;

  try {
    const lastGratitude = await Gratitude.findOne({
      where: { userId: user._id },
      order: [["createdAt", "DESC"]],
    });

    if (lastGratitude) {
      const date = lastGratitude.createdAt;

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

      const gratitudes = await Gratitude.findAll({
        where: {
          userId: user._id,
          createdAt: { [Op.between]: [startOfWeek, endOfWeek] },
        },
      });

      const decryptedGratitudes = gratitudes.map((gratitude) => {
        const decryptedTitle = decrypt(gratitude.title);
        const decryptedDescription = decrypt(gratitude.description);

        return {
          ...gratitude.dataValues,
          title: decryptedTitle,
          description: decryptedDescription,
        };
      });

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
    return res.status(500).json({ error: "Failed to retrieve gratitudes" });
  }
};

// Get all gratitudes with pagination
exports.getAllGratitudes = async (req, res) => {
  const user = req.user;
  const { page = 1, limit = 10 } = req.query;

  try {
    const skip = (page - 1) * limit;

    const gratitudes = await Gratitude.findAll({
      where: { userId: user._id },
      order: [["createdAt", "DESC"]],
      offset: skip,
      limit,
    });

    const decryptedGratitudes = gratitudes.map((gratitude) => {
      const decryptedTitle = decrypt(gratitude.title);
      const decryptedDescription = decrypt(gratitude.description);

      return {
        ...gratitude.dataValues,
        title: decryptedTitle,
        description: decryptedDescription,
      };
    });

    const totalGratitudes = await Gratitude.count({
      where: { userId: user._id },
    });

    const totalPages = Math.ceil(totalGratitudes / limit);

    return res.status(200).json({
      gratitudes: decryptedGratitudes,
      currentPage: page,
      totalPages,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Failed to retrieve gratitudes" });
  }
};

// Helper function to get the ordinal suffix of a number
function getOrdinalSuffix(n) {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
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
