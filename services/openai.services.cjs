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
        const chat = await Chat.create({userId, exerciseId});

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
        await processStreamData(chatId, socket, stream);
    } catch (err) {
        console.log(err);
    }
}

// ============== Send user message to OpenAI  ==============

async function sendUserMessageToOpenAI(socket, chatId, content) {
    try {
        await Message.create({chatId, role: "user", content});

        const messages = await Message.findAll({
            where: {
                chatId: chatId,
            },
        });

        let listOfMessagesForOpenAI = [];

        messages.forEach((message) => {
            listOfMessagesForOpenAI.push({
                role: message.role,
                content: message.content,
            });
        });

        const body = {
            model: "gpt-3.5-turbo",
            messages: listOfMessagesForOpenAI,
            stream: true,
        };

        const response = await axios.post(
            process.env.OPENAI_API_URL,
            body,
            options
        );
        const stream = Readable.from(response.data);
        await processStreamData(chatId, socket, stream);
    } catch (err) {
        console.log("Error while calling Open AI API");
    }
}

async function processStreamData(chatId, socket, stream) {
    let fullMessage = "";

    for await (let chunk of stream) {
        chunk = chunk.toString().replaceAll('data: ', '');
        console.log("---------------------\nchunk: ", chunk.toString());
        const contentMatch = chunk.toString().match(/"content":"(.*?)"/);
        const stopMatch = chunk.toString().match(/"finish_reason":"stop"/);

        console.log("contentMatch: ", contentMatch);

        if (contentMatch && contentMatch[1] && !stopMatch) {
            const content = contentMatch[1];
            fullMessage += content;
            socket.emit("messageStream", content);
        } else if (stopMatch) {
            await MessageHelper.saveThisMessage(chatId, "assistant", fullMessage);
            socket.emit("messageStreamEnd", "streamEnd");
        }
    }
}


module.exports = {
    createChatSession,
    sendSystemMessageToOpenAI,
    sendUserMessageToOpenAI,
};
