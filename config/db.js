const mongoose = require("mongoose");

const connectDB = async () => {
  if (!process.env.MONGO_URI) {
    console.warn("MONGO_URI is not configured. Starting without a database connection.");
    return;
  }

  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    
    // A little creative terminal art for the developer console!
    console.log(`
      🌿✨🌿✨🌿✨🌿✨🌿✨🌿
      Carbon Crumbs DB Connected!
      Host: ${conn.connection.host}
      🌿✨🌿✨🌿✨🌿✨🌿✨🌿
    `);
  } catch (error) {
    console.error("Database connection failed. Did you check your .env file?");
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;