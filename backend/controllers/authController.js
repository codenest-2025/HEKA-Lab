const jwt = require("jsonwebtoken");
const User = require("../models/User");

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d"
  });
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await User.findOne({ username }).populate("center");
    if (user && (await user.matchPassword(password))) {
      res.json({
        _id: user._id,
        name: user.name,
        username: user.username,
        role: user.role,
        agentPercentage: user.agentPercentage,
        center: user.center,
        balance: user.balance,
        token: generateToken(user._id)
      });
    } else {
      res.status(401).json({ message: "Invalid username or password" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Register a new user (Admin creates agents/staff, or initial setup)
// @route   POST /api/auth/register
// @access  Public (if no admin exists) / Private Admin (if admin exists)
const registerUser = async (req, res) => {
  const { name, username, password, role, agentPercentage, centerId } = req.body;

  try {
    const userExists = await User.findOne({ username });
    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Check if any admin exists in the system
    const adminExists = await User.findOne({ role: "admin" });
    
    // If an admin exists, only logged in admin can create new users
    if (adminExists) {
      // Check auth header
      let token;
      if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
        token = req.headers.authorization.split(" ")[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const requestingUser = await User.findById(decoded.id);
        if (!requestingUser || requestingUser.role !== "admin") {
          return res.status(403).json({ message: "Only admin can register users" });
        }
      } else {
        return res.status(401).json({ message: "No admin authorization token provided" });
      }
    }

    const user = await User.create({
      name,
      username,
      password,
      role,
      agentPercentage: role === "agent" ? agentPercentage : 0,
      center: (role === "staff" || role === "agent") ? centerId : undefined
    });

    if (user) {
      res.status(201).json({
        _id: user._id,
        name: user.name,
        username: user.username,
        role: user.role,
        agentPercentage: user.agentPercentage,
        center: user.center,
        balance: user.balance,
        token: generateToken(user._id)
      });
    } else {
      res.status(400).json({ message: "Invalid user data" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Private
const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate("center");
    if (user) {
      res.json({
        _id: user._id,
        name: user.name,
        username: user.username,
        role: user.role,
        agentPercentage: user.agentPercentage,
        center: user.center,
        balance: user.balance
      });
    } else {
      res.status(404).json({ message: "User not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all agents
// @route   GET /api/auth/agents
// @access  Private (Admin & Staff can list agents to tag bookings)
const getAgents = async (req, res) => {
  try {
    const agents = await User.find({ role: "agent" }).populate("center").select("-password");
    res.json(agents);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all staff
// @route   GET /api/auth/staff
// @access  Private Admin
const getStaff = async (req, res) => {
  try {
    const staff = await User.find({ role: "staff" }).populate("center").select("-password");
    res.json(staff);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { loginUser, registerUser, getUserProfile, getAgents, getStaff };
