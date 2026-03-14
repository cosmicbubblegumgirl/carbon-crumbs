const mongoose = require("mongoose");

const activitySchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true },
    category: { type: String, required: true },
    quantity: { type: Number, default: 1 },
    co2: { type: Number, required: true },      // emission factor per unit (kg CO2e)
    emission: { type: Number, required: true },  // total = quantity × co2
    note: { type: String, default: "" },
    loggedAt: { type: Date, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Activity", activitySchema);