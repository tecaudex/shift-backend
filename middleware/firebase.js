const admin = require("firebase-admin");
const User = require("../models/users.model");

const serviceAccount = require("../config/firebaseServiceAccountKey.json");

// Initialize the Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

// Middleware to extract and verify the Firebase auth ID token
exports.authenticateFirebaseUser = async (req, res, next) => {
  try {
    const idToken = req.headers.authorization.split(" ")[1];
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const user = await User.findOne({ f_id: decodedToken.user_id });

    if (user != null) {
      req.user = user;
      next();
    } else {
      throw Error("No user found");
    }
  } catch (error) {
    console.error("Authentication error: ", error);
    res.status(401).send(`Authentication error: ${error}`);
  }
};
