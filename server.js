import dotenv from "dotenv";
import { initializeDatabase } from "./db/connection.cjs";
import express from "express";
import "./middleware/openai.mjs";
import { exec } from "child_process";
import User from "./models/user.model.cjs";
import Chat from "./models/chat.model.cjs";
import "./models/associations.cjs";
import bodyParserMiddleware from "./middleware/body-parser.cjs";
import helmetMiddleware from "./middleware/helmet.cjs";
import corsMiddleware from "./middleware/cors.cjs";
import compressionMiddleware from "./middleware/compression.cjs";
import morganMiddleware from "./middleware/morgan.cjs";
import userRoutes from "./routes/users.router.cjs";
import gratitudeRoutes from "./routes/gratitude.router.cjs";
import intentionRoutes from "./routes/intention.router.cjs";
import sessionRoutes from "./routes/session.router.cjs";
import exerciseRoutes from "./routes/exercise.router.cjs";
import inspirationRoutes from "./routes/inspiration.router.cjs";
import init from "./services/adminjs.services.mjs";
import * as jwt from "jsonwebtoken";
import openai from "./services/openai.services.cjs";
import { Server } from "socket.io";
import { createServer } from "http";

dotenv.config();

initializeDatabase();

const app = express();

init(app);
bodyParserMiddleware(app);
helmetMiddleware(app);
corsMiddleware(app);
compressionMiddleware(app);
morganMiddleware(app);

app.post("/deploy", async (req, res) => {
  console.log("Deploying new code...");
  exec(
    "git pull origin main && npm install && pm2 restart app",
    (err, stdout, stderr) => {
      if (err) {
        console.error(`Error: ${err}`);
        return res.status(500).json({ error: err });
      }
      console.log(`stdout: ${stdout}`);
      console.error(`stderr: ${stderr}`);
      return res.status(200).json({
        message: stdout,
        error: stderr,
      });
    }
  );
});

app.use("/api/users", userRoutes);
app.use("/gratitude", gratitudeRoutes);
app.use("/intention", intentionRoutes);
app.use("/session", sessionRoutes);
app.use("/api/exercises", exerciseRoutes);
app.use("/api/inspiration", inspirationRoutes);

app.get("/", (req, res) => {
  return res.json({
    message: "success",
    data: `Welcome to MNTRA ${process.env.NODE_ENV} APIs`,
  });
});

app.get("/terms", async (req, res) => {
  const termsAndConditions = await findOne({
    title: "Terms & Conditions",
  });
  res.json(termsAndConditions);
});

app.get("/privacy", async (req, res) => {
  const privacyPolicy = await findOne({ title: "Privacy Policy" });
  res.json(privacyPolicy);
});

const PORT = process.env.PORT;

const server = createServer(app);
const io = new Server(server, {
  pingTimeout: 60000,
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

server.listen(PORT, function (err) {
  if (err) console.log("Error in server setup");
  console.log("✅ Server listening on Port", PORT);
});

async function getUserFromToken(token) {
  // Verify the token
  const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);

  // Find the user in the database
  return await User.findByPk(decoded.userId);
}

const userConnections = new Map();

io.on("connection", (socket) => {
  console.log(`Connected to socket.io`);

  socket.on("createChatSession", async (body) => {
    let { token, exerciseId } = body;
    const user = await getUserFromToken(token);
    console.log(`createChatSession | userId: ${user.id}`);
    socket.userId = user.id; // Associate the socket connection with the user
    await openai.createChatSession(io, socket, user.id, exerciseId);
    const connections = userConnections.get(user.id) || new Set();
    connections.add(socket);
    userConnections.set(user.id, connections);
  });

  socket.on("receiveUserMessage", async (body) => {
    console.log(`userMessage | body: ${JSON.stringify(body)}`);
    let { chatId, content } = body;
    const chat = await Chat.findByPk(chatId);
    if (chat.userId !== socket.userId) {
      console.log("Received message from wrong user");
      return;
    }
    io.to(chatId).emit("messageStream", content); // Emit event to all sockets in the room
    io.to(chatId).emit("messageStreamEnd", "streamEnd"); // Emit event to all sockets in the room
    await openai.sendUserMessageToOpenAI(io, socket, chatId, content);
  });

  socket.on("disconnect", () => {
    if (socket.userId) {
      const connections = userConnections.get(socket.userId);
      if (connections) {
        connections.delete(socket);
        if (connections.size === 0) {
          userConnections.delete(socket.userId);
        }
      }
    }
  });
});
