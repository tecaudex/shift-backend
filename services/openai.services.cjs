const axios = require("axios");
const MessageHelper = require("../helper/messages.helper.cjs");
const Message = require("../models/message.model.cjs");
const SessionController = require("../controllers/session.controller.cjs");
const Readable = require("stream").Readable;
const Exercise = require("../models/exercise.model.cjs");
const Chat = require("../models/chat.model.cjs");

// ======= Options for OpenAI API =======

const options = {
  headers: {
    "content-type": "application/json",
    Authorization: "Bearer " + process.env.OPENAI_API_KEY,
  },
  responseType: "stream",
};

async function createChatSession(socket, userId, exerciseId) {
  try {
    const chat = await Chat.create({ userId, exerciseId });

    if (!chat) throw Error("Couldn't create chat session.");

    socket.emit("chatId", chat.id);

    sendSystemMessageToOpenAI(socket, chat.id, exerciseId);
  } catch (err) {
    console.log(err);
  }
}

async function sendSystemMessageToOpenAI(socket, chatId, exerciseId) {
  try {
    const exercise = await Exercise.findByPk(exerciseId);

    if (!exercise) throw Error("Couldn't find exercise.");

    MessageHelper.saveThisMessage(chatId, "system", exercise.systemMessage);

    const response = await axios.post(
      process.env.OPENAI_API_URL,
      {
        model: exercise.model,
        temperature: exercise.temperature,
        top_p: exercise.topP,
        max_tokens: exercise.maxLength,
        presence_penalty: exercise.presencePenalty,
        frequency_penalty: exercise.frequencyPenalty,
        messages: [
          {
            role: "system",
            content: exercise.systemMessage,
          },
        ],
        stream: true,
      },
      options
    );
    const stream = Readable.from(response.data);
    await processStreamData(chatId, socket, stream);
  } catch (err) {
    console.log(err);
  }
}

// ============== Send user message to OpenAI  ==============

async function sendUserMessageToOpenAI(socket, chatId, content) {
  // console.log( "sendUserMessageToOpenAI \n", "sessionId: ", sessionId, "\n content: ", content );
  try {
    // ======= Saving new User Message  =======
    await MessageHelper.saveThisMessage(chatId, "user", content);
    // ======= Getting all messages from database =======
    const exclude = ["id", "chatId", "createdAt", "updatedAt"];
    const messages = await Message.findAll({
      where: {
        chatId: chatId,
      },
      attributes: {
        exclude: exclude,
      },
    });

    const chat = await Chat.findByPk(messages[0].chatId);

    if (!chat) throw Error("Couldn't find chat.");

    const exercise = await Exercise.findByPk(chat.exerciseId);

    if (!exercise) throw Error("Couldn't find exercise.");

    // ======= Body for OpenAI API =======
    const body = {
      model: exercise.model,
      temperature: exercise.temperature,
      top_p: exercise.topP,
      max_tokens: exercise.maxLength,
      presence_penalty: exercise.presencePenalty,
      frequency_penalty: exercise.frequencyPenalty,
      user: chat.userId,
      messages: messages,
      stream: true,
    };

    // ======= Calling OpenAI API =======
    let response = await axios.post(process.env.OPENAI_API_URL, body, options);
    const stream = Readable.from(response.data);
    await processStreamData(chatId, socket, stream);
  } catch (err) {
    console.log("Error while calling Open AI API", err);
  }
}

// ======= Process Stream data to get relevant data and send to user =======
async function processStreamData(chatId, socket, stream) {
  let fullMessage = "";
  stream.on("data", (streamData) => {
    // ====== Convert buffer to string and remove "data: " ======
    let data = streamData.toString("utf-8").replaceAll("data: ", "");

    // ====== Get the relevant content words from the string ======
    const splitData = data.split("\n");
    data = fullMessage ? splitData[0] : splitData[2];

    // ====== Check Data & Convert data from String to JSON ======
    if (data && data !== "" && data !== "[DONE]") {
      const { choices } = JSON.parse(data);
      const { content, finish_reason: finished } = choices[0].delta;

      if (!finished && content) {
        fullMessage += content;
        socket.emit("messageStream", content);
      } else {
        MessageHelper.saveThisMessage(chatId, "assistant", fullMessage);
        socket.emit("messageStreamEnd", "streamEnd");
      }
    }
  });
}

module.exports = {
  createChatSession,
  sendSystemMessageToOpenAI,
  sendUserMessageToOpenAI,
};
