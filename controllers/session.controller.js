const Session = require("../models/session.model");
const Gratitude = require("../models/gratitude.model");
const crypto = require("crypto");
const { updateStreak } = require("./streak.controller");

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

//=================== Using socket.io without using API's ===================
exports.checkChatSession = async (userId, socket) => {
  try {
    // Check chat session User Id
    const sessionStatus = await Session.findOne({
      user: userId,
      isSessionOpen: true,
    })
      .sort({ $natural: -1 })
      .limit(1);

    // console.log("sessionStatus", sessionStatus);
    if (sessionStatus) {
      const messages = await MessageHelper.getAllMessages(sessionStatus._id);
      socket.emit("checkChatSession/Response", {
        sessionId: sessionStatus._id,
        points: sessionStatus.points,
        messages,
      });
    } else {
      return createChatSession(userId, socket);
    }
  } catch (err) {
    checkChatSessionErrorHandler(socket, err);
  }
};
async function createChatSession(userId, socket) {
  try {
    const session = await Session.create({
      user: userId,
      isSessionOpen: true,
    });
    // console.log("session", session);

    socket.emit("checkChatSession/Response", {
      sessionId: session._id,
      points: session.points,
    });

    await OpenAIServices.sendSystemMessageToOpenAI(session._id, socket);
  } catch (err) {
    console.log("Error while creating new chat session", err);
    socket.emit("checkChatSession/Error", {
      error: "Internal server error: " + err,
      msg: "Error while creating new chat session",
    });
  }
}
exports.closeChatSession = async (sessionId, socket) => {
  // console.log("sessionId in closeChatSession", sessionId);
  try {
    // ====== Update chat session to close it ======
    const sessionStatus = await Session.findByIdAndUpdate(
      sessionId,
      { isSessionOpen: false },
      { useFindAndModify: false, new: true }
    );

    if (sessionStatus) {
      // console.log("sessionStatus", sessionStatus);
      socket.emit("closeChatSession/Response", "SessionClosedSuccessfully");
      User.saveGratitudePoints(sessionStatus.user, sessionStatus.points);
    }
  } catch (err) {
    closeChatSessionErrorHandler(socket, err);
  }
};
// Save User Gratitude Points in his opened session
exports.saveGratitudePoints = async (sessionId, points) => {
  // console.log("saveGratitudePoints \n", "sessionId:", sessionId ,"\n points:" , points);
  try {
    await Session.updateOne({ _id: sessionId }, { $inc: { points: points } });
  } catch (error) {
    console.log("error", error);
  }
};

// Create a new session
exports.createSession = async (req, res, next) => {
  try {
    // Get user from the request
    const user = req.user;

    // Create a new session document in the database
    const session = new Session({
      user: user._id,
    });

    await session.save();
    updateStreak(user._id, "gratitude", new Date());
    return res.status(200).json(session);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Internal server error: " + err });
  }
};
// Get all sessions
exports.getAllSessions = async (req, res, next) => {
  try {
    // Get user from the request
    const user = req.user;

    // Find all sessions by user id
    const sessions = await Session.find({ user: user._id });
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
    const session = await Session.findById(sessionId);
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
    const session = await Session.findById(sessionId);

    // If session is not found, return error message
    if (!session) {
      return res.status(404).json({ error: "No session found with that ID." });
    }

    // Get gratitudes for the session
    const gratitudes = await Gratitude.find({
      _id: { $in: session.gratitudes },
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

    const session = await Session.findById(sessionId);

    if (!session) {
      return res.status(404).json({ error: "Session not found." });
    }

    if (session.user.toString() !== user._id.toString()) {
      return res
        .status(401)
        .json({ error: "You do not have permission to access this session." });
    }

    const gratitude = new Gratitude({
      title: encrypt(title),
      description: encrypt(description),
      timeTaken: timeTaken - session.timeTaken,
      user: user._id,
    });

    const savedGratitude = await gratitude.save();

    session.gratitudes.push(savedGratitude._id);
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

    const session = await Session.findById(sessionId);

    if (!session) {
      return res.status(404).json({ error: "Session not found." });
    }

    if (session.user.toString() !== user._id.toString()) {
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
    const sessions = await Session.find({ user: req.user._id }).lean().exec();
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
