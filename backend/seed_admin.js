require("dotenv").config();
const mongoose = require("mongoose");
const User = require("./models/User");

const seedAdmin = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      console.error("MONGODB_URI is not defined in your environment variables.");
      process.exit(1);
    }

    console.log("Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected successfully!");

    // Check if an admin exists
    const adminExists = await User.findOne({ role: "admin" });
    if (adminExists) {
      console.log(`An admin user already exists: ${adminExists.username}`);
      process.exit(0);
    }

    const admin = new User({
      name: "Default Admin",
      username: "a",
      password: "123456",
      role: "admin"
    });

    await admin.save();
    console.log("=========================================");
    console.log("Admin user seeded successfully!");
    console.log("Username: a");
    console.log("Password: 123456");
    console.log("=========================================");
    process.exit(0);
  } catch (error) {
    console.error("Error seeding admin user:", error.message);
    process.exit(1);
  }
};

seedAdmin();
