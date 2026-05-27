const Lab = require("../models/Lab");
const Test = require("../models/Test");

// @desc    Get all labs
// @route   GET /api/labs
// @access  Private
const getLabs = async (req, res) => {
  try {
    const labs = await Lab.find({});
    res.json(labs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a lab
// @route   POST /api/labs
// @access  Private Admin
const createLab = async (req, res) => {
  const { name, labPercentage } = req.body;
  try {
    const labExists = await Lab.findOne({ name });
    if (labExists) {
      return res.status(400).json({ message: "Lab already exists" });
    }
    const lab = await Lab.create({ name, labPercentage });
    res.status(201).json(lab);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all tests
// @route   GET /api/tests
// @access  Private
const getTests = async (req, res) => {
  try {
    const tests = await Test.find({}).populate("lab");
    res.json(tests);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a test
// @route   POST /api/tests
// @access  Private Admin
const createTest = async (req, res) => {
  const { name, price, labId } = req.body;
  try {
    const testExists = await Test.findOne({ name });
    if (testExists) {
      return res.status(400).json({ message: "Test already exists" });
    }
    const test = await Test.create({ name, price, lab: labId });
    const populated = await Test.findById(test._id).populate("lab");
    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update a test
// @route   PUT /api/labs/tests/:id
// @access  Private Admin
const updateTest = async (req, res) => {
  const { name, price, labId } = req.body;
  try {
    const test = await Test.findById(req.params.id);
    if (!test) {
      return res.status(404).json({ message: "Test not found" });
    }
    if (name && name !== test.name) {
      const nameExists = await Test.findOne({ name });
      if (nameExists) {
        return res.status(400).json({ message: "Test name already exists" });
      }
      test.name = name;
    }
    if (price !== undefined) {
      test.price = parseFloat(price);
    }
    if (labId) {
      test.lab = labId;
    }
    await test.save();
    const populated = await Test.findById(test._id).populate("lab");
    res.json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a test
// @route   DELETE /api/labs/tests/:id
// @access  Private Admin
const deleteTest = async (req, res) => {
  try {
    const test = await Test.findById(req.params.id);
    if (!test) {
      return res.status(404).json({ message: "Test not found" });
    }
    await test.deleteOne();
    res.json({ message: "Test removed" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getLabs, createLab, getTests, createTest, updateTest, deleteTest };
