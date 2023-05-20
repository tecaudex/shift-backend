const express = require("express");
const app = express();
const AdminJS = require("adminjs");
const AdminJSExpress = require("@adminjs/express");
const AdminJSMongoose = require("@adminjs/mongoose");
const schedule = require("node-schedule");
const { deleteEmptySessions } = require("./delete-empty-sessions");

// configure to get env
const configureEnvironment = require("./config/config");

// Determine the current environment based on server configuration
// Default to 'development' if NODE_ENV is not set
const environment = process.env.NODE_ENV || "development";

// Load environment-specific configuration
configureEnvironment(environment);

// connecting to db
const db = require("./db");
db.init();

// connecting to openai
require("./middleware/openai");

const User = require("./models/users.model");
const Gratitude = require("./models/gratitude.model");
const Session = require("./models/session.model");
const Policy = require("./models/policy.model");

AdminJS.registerAdapter({
  Resource: AdminJSMongoose.Resource,
  Database: AdminJSMongoose.Database,
});

const admin = new AdminJS({
  resources: [User, Gratitude, Session, Policy],
});

const adminRouter = AdminJSExpress.buildRouter(admin);
app.use(admin.options.rootPath, adminRouter);

// importing middleware
const bodyParserMiddleware = require("./middleware/body-parser");
bodyParserMiddleware(app);
const helmetMiddleware = require("./middleware/helmet");
helmetMiddleware(app);
const corsMiddleware = require("./middleware/cors");
corsMiddleware(app);
const compressionMiddleware = require("./middleware/compression");
compressionMiddleware(app);
const morganMiddleware = require("./middleware/morgan");
morganMiddleware(app);

// configure to use routers
const userRoutes = require("./routes/users.router");
const gratitudeRoutes = require("./routes/gratitude.router");
const intentionRoutes = require("./routes/intention.router");
const sessionRoutes = require("./routes/session.router");
// const openaiRoutes = require("./routes/openai.router");
const { sendUserMessageToOpenAI } = require("./services/openai.services");
const {
  checkChatSession,
  closeChatSession,
} = require("./controllers/session.controller");

app.post("/deploy", async (req, res) => {
  cconsole.log("Deploying new code...");
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

app.use("/users", userRoutes);
app.use("/gratitude", gratitudeRoutes);
app.use("/intention", intentionRoutes);
app.use("/session", sessionRoutes);

app.get("/", (req, res) => {
  return res.json({
    message: "success",
    data: `Welcome to MNTRA ${process.env.NODE_ENV} APIs`,
  });
});

app.get("/terms", async (req, res) => {
  const termsAndConditions = await Policy.findOne({
    title: "Terms & Conditions",
  });
  res.json(termsAndConditions);
});

app.get("/privacy", async (req, res) => {
  const privacyPolicy = await Policy.findOne({ title: "Privacy Policy" });
  res.json(privacyPolicy);
});

const rule = new schedule.RecurrenceRule();
rule.hour = 0;
rule.minute = 0;

const job = schedule.scheduleJob(rule, function () {
  deleteEmptySessions();
});

const PORT = process.env.PORT;

const ServerConnection = app.listen(PORT, function (err) {
  if (err) console.log("Error in server setup");
  console.log("Server listening on Port", PORT);
});

//Passing server to socket.io
const io = require("socket.io")(ServerConnection, {
  pingTimeout: 60000,
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

//Connecting and Using socket.io
io.on("connection", (socket) => {
  console.log(`Connected to socket.io`.yellow.bold);
  // ============ For Checking Chat Session ============
  socket.on("checkChatSession", (userId) => {
    console.log(`checkChatSession | userId: ${userId}`.yellow);
    checkChatSession(userId, socket);
  });
  // ============ For Closing Chat Session ============
  socket.on("closeChatSession", (sessionId) => {
    console.log(`closeChatSession | sessionId: ${sessionId}`.yellow);
    closeChatSession(sessionId, socket);
  });

  // ============ For New User Message ============
  socket.on("newUserMessage", (body) => {
    console.log(`newUserMessage | body: ${JSON.stringify(body)}`.yellow);
    let { sessionId, content } = body;
    sendUserMessageToOpenAI(sessionId, content, socket);
  });
});
