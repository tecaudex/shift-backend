const Session = require("../models/session.model.cjs");
const Gratitude = require("../models/gratitude.model.cjs");
const User = require("./users.controller.cjs");
const crypto = require("crypto");

const algorithm = "aes-256-cbc";
const key = process.env.GRATITUDE_ENCRYPTION_KEY;
const iv = crypto.randomBytes(16);

function encrypt(text) {
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  return `${iv.toString("hex")}:${encrypted}`;
}

function decrypt(ciphertext) {
  const [ivStr, encrypted] = ciphertext.split(":");
  const iv = Buffer.from(ivStr, "hex");
  const decipher = crypto.createDecipheriv(algorithm, key, iv);
  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}

async function checkChatSessionErrorHandler(socket, err) {
  console.log("Error while checking chat session", err);
  socket.emit("checkChatSession/Error", {
    error: "Internal server error: " + err,
    msg: "Error while checking chat session",
  });
}

async function closeChatSessionErrorHandler(socket, err) {
  console.log("Error while closing chat session", err);
  socket.emit("closeChatSession/Error", {
    error: "Internal server error: " + err,
    msg: "Error while closing chat session",
  });
}

exports.createChatSession = async (socket, userId) => {
  try {
    // create a session with the user id
    const session = await Session.create({
      userId: userId,
      isSessionOpen: true,
    });

    socket.emit("sessionId", session.id);
  } catch (err) {
    checkChatSessionErrorHandler(socket, err);
  }
};

exports.sendSystemMessage = async (socket, sessionId, gameId) => {
  try {
    // send the system message to openai
    await OpenAIServices.sendSystemMessageToOpenAI(socket, sessionId, gameId);
  } catch (err) {
    checkChatSessionErrorHandler(socket, err);
  }
};

exports.closeChatSession = async (sessionId, socket) => {
  try {
    // Update chat session to close it
    const sessionStatus = await Session.updateOne(
      { id: sessionId },
      { isSessionOpen: false }
    );

    if (sessionStatus.nModified === 1) {
      socket.emit("closeChatSession/Response", "SessionClosedSuccessfully");
      User.saveGratitudePoints(sessionId, sessionStatus.points);
    }
  } catch (err) {
    closeChatSessionErrorHandler(socket, err);
  }
};

exports.saveGratitudePoints = async (sessionId, points) => {
  try {
    await Session.updateOne({ id: sessionId }, { $inc: { points: points } });
  } catch (error) {
    console.log("error", error);
  }
};

exports.createSession = async (req, res) => {
  const user = req.user;

  try {
    const session = await Session.create({
      userId: user.id,
    });

    updateStreak(user.id, "gratitude", new Date());

    return res.status(200).json(session);
  } catch (err) {
    console.log(err);
    return res.status(500).json({ error: "Internal server error: " + err });
  }
};

exports.getAllSessions = async (req, res) => {
  const user = req.user;

  try {
    const sessions = await Session.find({ userId: user.id });
    if (!sessions) {
      return res.status(404).json([]);
    }

    return res.status(200).json(sessions);
  } catch (error) {
    console.log(err);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Get session by id
exports.getSession = async (req, res, next) => {
  try {
    // Get session from request parameters
    const sessionId = req.params.sessionId;

    // Find if that session exists
    const session = await Session.findByPk(sessionId);
    if (!session) {
      return res.status(404).json({ error: "No session found with that id." });
    }

    return res.status(200).json(session);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.getGratitudesBySessionId = async (req, res, next) => {
  try {
    // Get session ID from request parameters
    const sessionId = req.params.sessionId;

    // Find session by ID
    const session = await Session.findByPk(sessionId);

    // If session is not found, return error message
    if (!session) {
      return res.status(404).json({ error: "No session found with that ID." });
    }

    // Get gratitudes for the session
    const gratitudes = await Gratitude.find({
      id: { $in: session.gratitudes },
    });

    // Decrypt title and description for each gratitude
    gratitudes.forEach((gratitude) => {
      gratitude.title = decrypt(gratitude.title);
      gratitude.description = decrypt(gratitude.description);
    });

    // Return the gratitudes
    return res.status(200).json(gratitudes);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * Adds a new gratitude form to a session.
 *
 * @param {object} req - The HTTP request object.
 * @param {object} res - The HTTP response object.
 * @param {function} next - The next middleware function in the chain.
 */
exports.addFormToSession = async (req, res, next) => {
  try {
    const {
      user,
      params: { sessionId },
      body: { title, description, timeTaken },
    } = req;

    if (!title || !description || !timeTaken) {
      return res
        .status(400)
        .json({ error: "Please provide a title, description, and timeTaken." });
    }

    const session = await Session.findByPk(sessionId);

    if (!session) {
      return res.status(404).json({ error: "Session not found." });
    }

    if (session.user.toString() !== user.id.toString()) {
      return res
        .status(401)
        .json({ error: "You do not have permission to access this session." });
    }

    const gratitude = new Gratitude({
      title: encrypt(title),
      description: encrypt(description),
      timeTaken: timeTaken - session.timeTaken,
      user: user.id,
    });

    const savedGratitude = await gratitude.save();

    session.gratitudes.push(savedGratitude.id);
    session.timeTaken = timeTaken;

    await session.save();

    return res.status(200).json(session);
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ error: "An internal server error occurred." });
  }
};

exports.addFeelingToSession = async (req, res, next) => {
  try {
    const {
      user,
      params: { sessionId },
      body: { feeling },
    } = req;

    if (!feeling) {
      return res.status(400).json({ error: "Please provide a valid feeling." });
    }

    const session = await Session.findByPk(sessionId);

    if (!session) {
      return res.status(404).json({ error: "Session not found." });
    }

    if (session.user.toString() !== user.id.toString()) {
      return res
        .status(401)
        .json({ error: "You do not have permission to access this session." });
    }

    session.feeling = feeling;

    await session.save();

    return res.status(200).json(session);
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ error: "An internal server error occurred." });
  }
};

exports.getFeelingPercentage = async (req, res, next) => {
  try {
    const sessions = await Session.find({ user: req.user.id }).lean().exec();
    const numSessions = sessions.length;
    let sameCount = 0;
    let moreGratefulCount = 0;
    let lessGratefulCount = 0;
    let noFeelingCount = 0;

    for (let session of sessions) {
      const feeling = session.feeling;
      if (feeling === "the same") {
        sameCount++;
      } else if (feeling === "more grateful") {
        moreGratefulCount++;
      } else if (feeling === "less grateful") {
        lessGratefulCount++;
      } else {
        noFeelingCount++;
      }
    }

    const samePercentage =
      numSessions > 0 ? (sameCount / numSessions) * 100 : 0;
    const moreGratefulPercentage =
      numSessions > 0 ? (moreGratefulCount / numSessions) * 100 : 0;
    const lessGratefulPercentage =
      numSessions > 0 ? (lessGratefulCount / numSessions) * 100 : 0;
    const noFeelingPercentage =
      numSessions > 0 ? (noFeelingCount / numSessions) * 100 : 0;

    return res.json({
      samePercentage,
      moreGratefulPercentage,
      lessGratefulPercentage,
      noFeelingPercentage,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error });
  }
};
