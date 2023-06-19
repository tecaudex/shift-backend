import dotenv from "dotenv";
dotenv.config();

import { initializeDatabase } from "./db/connection.cjs";
initializeDatabase();
import express from "express";
import color from "colors";
import "./middleware/openai.mjs";
import { exec } from "child_process";
import User from "./models/user.model.cjs";
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
import * as ai from "./services/openai.services.cjs";

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

const ServerConnection = app.listen(PORT, function (err) {
  if (err) console.log("Error in server setup");
  console.log("Server listening on Port", PORT);
});

import { Server } from "socket.io";

const io = new Server(ServerConnection, {
  pingTimeout: 60000,
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

async function getUserFromToken(token) {
  // Verify the token
  const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);

  // Find the user in the database
  return await User.findByPk(decoded.userId);
}

io.on("connection", (socket) => {
  console.log(`Connected to socket.io`.yellow);

  socket.on("createChatSession", async (body) => {
    let { token, exerciseId } = body;
    const user = await getUserFromToken(token);
    console.log(`createChatSession | userId: ${user.id}`.yellow);
    ai.createChatSession(socket, user.id, exerciseId);
  });

  socket.on("receiveUserMessage", (body) => {
    console.log(`userMessage | body: ${JSON.stringify(body)}`.yellow);
    let { chatId, content } = body;
    ai.sendUserMessageToOpenAI(socket, chatId, content);
  });
});
