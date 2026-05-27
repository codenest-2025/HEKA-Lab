const Center = require("../models/Center");

// @desc    Get all centers
// @route   GET /api/centers
// @access  Private
const getCenters = async (req, res) => {
  try {
    const centers = await Center.find({});
    res.json(centers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a center
// @route   POST /api/centers
// @access  Private Admin
const createCenter = async (req, res) => {
  const { name, location } = req.body;
  try {
    const centerExists = await Center.findOne({ name });
    if (centerExists) {
      return res.status(400).json({ message: "Center already exists" });
    }
    const center = await Center.create({ name, location });
    res.status(201).json(center);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getCenters, createCenter };
