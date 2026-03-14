const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    animal: { type: String, default: "deer" },
    weeklyGoalKg: { type: Number, default: 35 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);