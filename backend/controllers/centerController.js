const Center = require("../models/Center");
const User = require("../models/User");

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

// @desc    Update a center
// @route   PUT /api/centers/:id
// @access  Private Admin
const updateCenter = async (req, res) => {
  const { name, location } = req.body;
  try {
    const center = await Center.findById(req.params.id);
    if (!center) {
      return res.status(404).json({ message: "Center not found" });
    }
    if (name && name !== center.name) {
      const centerExists = await Center.findOne({ name });
      if (centerExists) {
        return res.status(400).json({ message: "Center name already exists" });
      }
      center.name = name;
    }
    if (location) {
      center.location = location;
    }
    await center.save();
    res.json(center);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a center
// @route   DELETE /api/centers/:id
// @access  Private Admin
const deleteCenter = async (req, res) => {
  try {
    const centerId = req.params.id;
    // Check if any user is assigned to this center
    const assignedUser = await User.findOne({ center: centerId });
    if (assignedUser) {
      return res.status(400).json({ message: "Cannot delete center. There are users assigned to it." });
    }
    const center = await Center.findById(centerId);
    if (!center) {
      return res.status(404).json({ message: "Center not found" });
    }
    await center.deleteOne();
    res.json({ message: "Center removed successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getCenters, createCenter, updateCenter, deleteCenter };
