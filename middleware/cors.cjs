const cors = require("cors");

const corsOptions = {
  origin: "*",
  optionsSuccessStatus: 200,
  methods: "GET, HEAD, PUT, PATCH, POST, DELETE",
  preflightContinue: false,
};

module.exports = function (app) {
  app.use(cors(corsOptions));
};
