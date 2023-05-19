const mongoose = require("mongoose");

const policySchema = new mongoose.Schema({
  title: { type: String, required: true },
  text: { type: String, required: true },
  updated_at: { type: Date, default: Date.now },
});

policySchema.index({ title: 1 }, { unique: true });

const Policy = mongoose.model("Policy", policySchema);

module.exports = Policy;
