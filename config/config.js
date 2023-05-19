const dotenv = require("dotenv");

module.exports = (environment) => {
  // Set the path to the appropriate environment file
  let envPath;
  switch (environment) {
    case "development":
      envPath = "dev.env";
      break;
    case "staging":
      envPath = "stag.env";
      break;
    case "production":
      envPath = "prod.env";
      break;
    default:
      throw new Error(`Invalid environment: ${environment}`);
  }

  // Load the environment variables from the file
  dotenv.config({
    path: envPath,
  });
};
