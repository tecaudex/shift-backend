const axios = require("axios");
const MessageHelper = require("../helper/messages.helper");
const Message = require("../models/message.model");
const SessionController = require("../controllers/session.controller");
const Readable = require("stream").Readable;
const OPENAI_URL = process.env.OPENAI_API_URL;

// ======= Options for OpenAI API =======
const options = {
  headers: {
    "content-type": "application/json",
    Authorization: "Bearer " + process.env.OPENAI_API_KEY,
  },
  responseType: "stream",
};

// ======= Body for OpenAI API =======
const body = {
  model: "gpt-3.5-turbo",
  messages: [
    {
      role: "system",
      content: process.env.SYSTEM_MESSAGE_CONTENT,
    },
  ],
  stream: true,
};

// ======= Send system message to OpenAI for the first time =======

exports.sendSystemMessageToOpenAI = async (sessionId, socket) => {
  // console.log("sendSystemMessageToOpenAI \n sessionId: ",sessionId);
  const content = process.env.SYSTEM_MESSAGE_CONTENT;
  //Saving new User Message using Message Helper
  MessageHelper.saveThisMessage(sessionId, "system", content);

  try {
    const response = await axios.post(OPENAI_URL, body, options);
    const stream = Readable.from(response.data);
    await processStreamData(sessionId, socket, false, stream);
  } catch (err) {
    console.error("Error while calling OpenAI API:", err);
    socket.emit("checkChatSession/Error", {
      error: `Internal server error: ${err}`,
      msg: "Error while calling OpenAI API",
    });
  }
};

// ============== Send user message to OpenAI  ==============

exports.sendUserMessageToOpenAI = async (sessionId, content, socket) => {
  // console.log( "sendUserMessageToOpenAI \n", "sessionId: ", sessionId, "\n content: ", content );
  try {
    // ======= Saving new User Message  =======
    await MessageHelper.saveThisMessage(sessionId, "user", content);
    // ======= Getting all messages from database =======
    const exclude = "-_id -sessionId -createdAt -updatedAt -__v";
    const messages = await Message.find({ sessionId }).select(exclude);
    // console.log("messages", messages);

    // ======= Body for OpenAI API =======
    const body = {
      model: "gpt-3.5-turbo",
      messages: messages,
      stream: true,
    };

    // ======= Calling OpenAI API =======
    let response = await axios.post(OPENAI_URL, body, options);
    const stream = Readable.from(response.data);
    await processStreamData(sessionId, socket, true, stream);
  } catch (err) {
    console.log("Error while calling Open AI API", err);
  }
};

// ======= Process Stream data to get relevant data and send to user =======
async function processStreamData(sessionId, socket, isUserMessage, stream) {
  let fullMessage = "";
  stream.on("data", (streamData) => {
    // console.log("streamData", streamData);

    // ====== Convert buffer to string and remove "data: " ======
    let data = streamData.toString("utf-8").replaceAll("data: ", "");
    // console.log("data", data, "----\n");

    // ====== Get the relevant content words from the string ======
    const splitData = data.split("\n");
    data = fullMessage ? splitData[0] : splitData[2];
    // console.log("data after split: ", data, "----\n");

    // ====== Check Data & Convert data from String to JSON ======
    if (data && data !== "" && data !== "[DONE]") {
      const { choices } = JSON.parse(data);
      const { content, finish_reason: finished } = choices[0].delta;

      if (!finished && content) {
        // console.log("Content:", content);
        fullMessage += content;
        socket.emit("stream", content);
      } else {
        // console.log("Finished - Full Message:", fullMessage);
        MessageHelper.saveThisMessage(sessionId, "assistant", fullMessage);
        socket.emit("streamEnd", "streamEnd");
        if (isUserMessage) {
          extractPointsFromMessage(sessionId, socket, fullMessage);
        }
      }
    }
  });
}

// ======= Extract gratitude points from AI response and send to user =======
async function extractPointsFromMessage(sessionId, socket, message) {
  // console.log("message", message);
  // let points = message.replace(/^\D+/g, "")[0];
  let points = parseInt(message.match(/\d+/));
  // console.log("points", points);
  points = !points ? 0 : Number(points);

  // const isListNumber = message.includes(points + ".");
  // points = isListNumber ? 0 : points;

  // console.log("points===:", points);
  socket.emit("points", points);
  await SessionController.saveGratitudePoints(sessionId, points);
}
