const mongoose = require("mongoose");

exports.init = async () => {
  mongoose.set("strictQuery", true);

  mongoose
    .connect(process.env.MONGO_URI)
    .then(() => {
      console.log("Connected to MongoDB");
    })
    .catch(() => {
      console.log("Couldn't connect to MongoDB");
    });
};
