require("dotenv").config();
const path = require("path");
const express = require("express");

// middleware & db
const cors = require("cors");
const mongoose = require("mongoose");
const connectDB = require("./config/db"); // <-- Here is the missing import!
const auth = require("./middleware/auth");

// models and utils
const bcrypt = require("bcryptjs"); // might swap this for argon2 later, but bcrypt is fine for now
const jwt = require("jsonwebtoken");
const User = require("./models/User");
const Activity = require("./models/Activity");
const { summariseActivities } = require("./utils/insights");

const app = express();
const PORT = process.env.PORT || 5000;

// Need to restrict this later if we add more animals
const ALLOWED_ANIMALS = [
  "deer", "fox", "owl", "rabbit", "turtle", "hedgehog", 
  "otter", "wolf", "bear", "red-panda", "hummingbird", 
  "dragon", "unicorn", "phoenix", "griffin", "jackalope"
];

// fire up the database
connectDB();

// Handle CORS so the frontend can actually talk to the API
const allowedOrigins = (process.env.FRONTEND_ORIGIN || "http://localhost:5000,http://127.0.0.1:5000")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

// TODO: double check these origin URLs before final deployment. CORS always breaks something.
app.use(cors({
  origin(origin, callback) {
    // allowing undefined origin for local testing via postman etc
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error("Not allowed by CORS"));
  },
}));

// standard express setup
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// --- Helper Functions ---

function createToken(user) {
  return jwt.sign(
    { id: user._id, name: user.name }, 
    process.env.JWT_SECRET, 
    { expiresIn: "7d" } // giving them a week so they don't have to keep logging in
  );
}

// Fallback to 22.4 if DB isn't ready. Need a better fallback system later.
async function getCommunityAverage() {
  if (mongoose.connection.readyState !== 1) {
    return 22.4; 
  }
  // ... actual DB aggregation logic would go here if needed ...
  return 22.4;
}


// --- API Routes ---

// Quick health check for Render deployment
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", service: "Carbon Crumbs API is running smoothly!" });
});


// Register a new account
app.post("/api/auth/register", async (req, res) => {
  try {
    const { name, email, password, animal } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email, and password are required." });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters." });
    }

    const chosenAnimal = ALLOWED_ANIMALS.includes(animal) ? animal : "deer";

    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return res.status(409).json({ message: "An account with that email already exists." });
    }

    const hash = await bcrypt.hash(password, 12);
    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hash,
      animal: chosenAnimal,
    });

    const token = createToken(user);
    return res.status(201).json({
      token,
      user: { id: user._id, name: user.name, email: user.email, animal: user.animal, weeklyGoalKg: user.weeklyGoalKg },
    });
  } catch (error) {
    console.error("Register error:", error);
    return res.status(500).json({ message: "Unable to create account." });
  }
});


// Login
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required." });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    const token = createToken(user);
    return res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email, animal: user.animal, weeklyGoalKg: user.weeklyGoalKg },
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ message: "Unable to log in." });
  }
});


// Dashboard data load
app.get("/api/dashboard", auth, async (req, res) => {
  try {
    // grab user but leave out the password hash
    const user = await User.findById(req.user.id).select("name email animal weeklyGoalKg");
    
    // sort by newest first
    const activities = await Activity.find({ user: req.user.id }).sort({ loggedAt: -1, createdAt: -1 });
    
    const summary = summariseActivities(activities, user?.weeklyGoalKg || 35);
    const communityAverage = await getCommunityAverage();

    return res.json({
      user,
      activities,
      summary,
      communityAverage,
    });
  } catch (error) {
    console.error("Dashboard error:", error);
    return res.status(500).json({ message: "Something went wrong loading the dashboard." });
  }
});


// Create a new activity
app.post("/api/activities", auth, async (req, res) => {
  try {
    const { title, category, quantity, co2, date, note } = req.body;

    if (!title || !category || !date) {
      return res.status(400).json({ message: "Title, category, and date are required." });
    }

    const qty = Number(quantity) || 1;
    const co2PerUnit = Number(co2) || 0;
    const emission = Number((qty * co2PerUnit).toFixed(2));

    const activity = await Activity.create({
      user: req.user.id,
      title: title.trim(),
      category,
      quantity: qty,
      co2: co2PerUnit,
      emission,
      note: note ? note.trim() : "",
      loggedAt: new Date(date),
    });

    return res.status(201).json(activity);
  } catch (error) {
    console.error("Create activity error:", error);
    return res.status(500).json({ message: "Unable to save activity." });
  }
});


// Update user profile (animal companion + weekly goal)
app.put("/api/user", auth, async (req, res) => {
  try {
    const { animal, weeklyGoalKg } = req.body;
    const updates = {};

    if (animal !== undefined) {
      if (!ALLOWED_ANIMALS.includes(animal)) {
        return res.status(400).json({ message: "Invalid animal selection." });
      }
      updates.animal = animal;
    }

    if (weeklyGoalKg !== undefined) {
      const goal = Number(weeklyGoalKg);
      if (!goal || goal <= 0) {
        return res.status(400).json({ message: "Weekly goal must be a positive number." });
      }
      updates.weeklyGoalKg = goal;
    }

    const user = await User.findByIdAndUpdate(req.user.id, updates, { new: true }).select("name email animal weeklyGoalKg");
    return res.json({ user });
  } catch (error) {
    console.error("Update user error:", error);
    return res.status(500).json({ message: "Unable to update profile." });
  }
});


// Delete a specific activity
app.delete("/api/activities/:id", auth, async (req, res) => {
  try {
    const deleted = await Activity.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    
    if (!deleted) {
      return res.status(404).json({ message: "Activity not found. Maybe it was already deleted?" });
    }
    
    return res.json({ message: "Activity removed." });
  } catch (error) {
    console.error("Delete error:", error);
    return res.status(500).json({ message: "Unable to delete activity at this time." });
  }
});


// Import activities from guest mode
app.post("/api/activities/import", auth, async (req, res) => {
  try {
    const { activities } = req.body;

    if (!activities || !Array.isArray(activities)) {
      return res.status(400).json({ message: "Invalid data format for import." });
    }

    // Map frontend shape {title,category,quantity,co2,total,date,note} → DB schema
    const docs = activities.map((act) => {
      const qty = Number(act.quantity) || 1;
      const co2PerUnit = Number(act.co2) || 0;
      const emission = Number(act.total) || Number((qty * co2PerUnit).toFixed(2));
      return {
        user: req.user.id,
        title: String(act.title || "").trim(),
        category: String(act.category || "other"),
        quantity: qty,
        co2: co2PerUnit,
        emission,
        note: act.note ? String(act.note).trim() : "",
        loggedAt: act.date ? new Date(act.date) : new Date(),
      };
    });

    await Activity.insertMany(docs);
    return res.status(201).json({ message: "Guest activities successfully imported!", count: docs.length });
  } catch (error) {
    console.error("Import error:", error);
    return res.status(500).json({ message: "Unable to import activities." });
  }
});

// start the server
app.listen(PORT, () => {
  console.log(`🚀 Carbon Crumbs backend running on port ${PORT}`);
});