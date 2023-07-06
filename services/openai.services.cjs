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

async function createChatSession(io, socket, userId, exerciseId) {
    try {
        const chat = await Chat.create({userId, exerciseId});

        if (!chat) throw Error("Couldn't create chat session.");

        console.log("Chat ID: ", chat.id);

        socket.join(chat.id); // Join the socket to the room and send the chat ID to the client
        socket.emit("chatId", chat.id); // Emit event to all sockets in the room (except the sender)
        await sendSystemMessageToOpenAI(io, socket, chat.id, exerciseId);
    } catch (err) {
        console.log(err);
    }
}

async function sendSystemMessageToOpenAI(io, socket, chatId, exerciseId) {
    try {
        const exercise = await Exercise.findByPk(exerciseId);

        if (!exercise) throw Error("Couldn't find exercise.");

        await MessageHelper.saveThisMessage(chatId, "system", exercise.systemMessage);

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
        await processStreamData(io, chatId, socket, stream);
    } catch (err) {
        console.log(err);
    }
}

// ============== Send user message to OpenAI  ==============

async function sendUserMessageToOpenAI(io, socket, chatId, content) {
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

        const chat = await Chat.findByPk(chatId);

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
        await processStreamData(io, chatId, socket, stream);
    } catch (err) {
        console.log("Error while calling Open AI API", err);
    }
}

// ======= Process Stream data to get relevant data and send to user =======
async function processStreamData(io, chatId, socket, stream) {
    let fullMessage = "";
    stream.on("data", async (streamData) => {
        // Convert buffer to string and remove "data: "
        let data = streamData.toString("utf-8").replace("data: ", "");

        while (data.includes("data: ")) {
            data = data.replace("data: ", "");
        }

        // Get the relevant content words from the string
        const splitData = data.split("\n");
        data = fullMessage ? splitData[0] : splitData[2];
        // Check data and convert it from string to JSON
        if (data && data !== "" && data !== "[DONE]") {
            const {choices} = JSON.parse(data);
            const {content, finish_reason: finished} = choices[0].delta;

            if (!finished && content) {
                fullMessage += content;
                io.to(chatId).emit("messageStream", content); // Emit event to all sockets in the room
            } else {
                await MessageHelper.saveThisMessage(chatId, "assistant", fullMessage);
                io.to(chatId).emit("messageStreamEnd", "streamEnd"); // Emit event to all sockets in the room
            }
        }
    });
}


module.exports = {
    createChatSession,
    sendSystemMessageToOpenAI,
    sendUserMessageToOpenAI,
};
