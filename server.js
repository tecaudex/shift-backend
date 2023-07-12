import dotenv from "dotenv";
import { initializeDatabase, sequelize } from "./db/connection.cjs";
import express from "express";
import "./middleware/openai.mjs";
import { exec } from "child_process";
import "./models/associations.cjs";
import bodyParserMiddleware from "./middleware/body-parser.cjs";
import helmetMiddleware from "./middleware/helmet.cjs";
import corsMiddleware from "./middleware/cors.cjs";
import compressionMiddleware from "./middleware/compression.cjs";
import morganMiddleware from "./middleware/morgan.cjs";
import userRoutes from "./routes/users.router.cjs";
import chatRoutes from "./routes/chat.router.cjs";
import messageRoutes from "./routes/message.router.cjs";
import exerciseRoutes from "./routes/exercise.router.cjs";
import inspirationRoutes from "./routes/inspiration.router.cjs";
import init from "./services/adminjs.services.mjs";
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
app.use("/api/chat", chatRoutes);
app.use("/api/message", messageRoutes);
app.use("/api/exercise", exerciseRoutes);
app.use("/api/inspiration", inspirationRoutes);

app.get("/", (req, res) => {
  return res.json({
    message: "success",
    data: `Welcome to Shift ${process.env.NODE_ENV} APIs`,
  });
});

app.get("/terms", async (req, res) => {
  const termsAndConditions = await sequelize.findByPk({
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

server.listen(PORT, function (err) {
  if (err) console.log("Error in server setup");
  console.log("✅ Server listening on Port", PORT);
});
