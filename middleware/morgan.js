const path = require("path");
const fs = require("fs");
const morgan = require("morgan");

const logDirectory = path.join(__dirname, "logs");

// ensure log directory exists
if (!fs.existsSync(logDirectory)) {
  fs.mkdirSync(logDirectory);
}

const accessLogStream = fs.createWriteStream(
  path.join(logDirectory, "access.log"),
  { flags: "a" }
);

module.exports = function (app) {
  app.use(morgan("dev"));
};
