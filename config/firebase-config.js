const admin = require("firebase-admin");
const path = require("path");

module.exports = (environment) => {
  // Set the path to the appropriate service account key file
  let serviceAccountPath;
  switch (environment) {
    case "development":
      serviceAccountPath = path.resolve(__dirname, "dev-firebase.json");
      break;
    case "staging":
      serviceAccountPath = path.resolve(__dirname, "stag-firebase.json");
      break;
    case "production":
      serviceAccountPath = path.resolve(__dirname, "prod-firebase.json");
      break;
    default:
      throw new Error(`Invalid environment: ${environment}`);
  }

  // Load the service account key
  const serviceAccount = require(serviceAccountPath);

  // Initialize Firebase Admin SDK with the service account key
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
};
