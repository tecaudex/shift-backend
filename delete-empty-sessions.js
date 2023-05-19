const Session = require("./models/session.model");

exports.deleteEmptySessions = async () => {
  // Define a query to find the sessions to delete
  const query = {
    gratitudes: { $size: 0 },
  };

  // Find the sessions to delete
  const sessionsToDelete = await Session.find(query);

  if (sessionsToDelete) {
    sessionsToDelete.forEach(function (session) {
      Session.deleteOne({ _id: session._id }, function (err, result) {
        if (err) {
          console.log("Error deleting session:", err);
        } else {
          console.log("Deleted session:", session._id);
        }
      });
    });
  }
};
