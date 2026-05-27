const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/db");

// Load Env variables
dotenv.config();

// Connect to Database
connectDB();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/centers", require("./routes/centerRoutes"));
app.use("/api/labs", require("./routes/labRoutes"));
app.use("/api/bookings", require("./routes/bookingRoutes"));
app.use("/api/payments", require("./routes/paymentRoutes"));

// Error handling middleware
app.use((err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode).json({
    message: err.message,
    stack: process.env.NODE_ENV === "production" ? null : err.stack
  });
});

app.get("/", (req, res) => {
  res.send("API Running");
});

const PORT = process.env.PORT || 5000;

// Render Keep-Alive: Self-ping every 10 minutes
const https = require("https");
const pingSelf = () => {
  const url = "https://heka-lab.onrender.com/";
  setInterval(() => {
    https.get(url, (res) => {
      console.log(`Self-ping status: ${res.statusCode} - Keeping server awake`);
    }).on("error", (err) => {
      console.error("Self-ping failed:", err.message);
    });
  }, 10 * 60 * 1000); // 10 minutes
};

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  // Start self-ping if running in production (Render)
  if (process.env.NODE_ENV === "production" || true) {
    pingSelf();
  }
});

