const express = require("express");
const { getLabs, createLab, getTests, createTest } = require("../controllers/labController");
const { protect, authorize } = require("../middleware/authMiddleware");

const router = express.Router();

router.route("/")
  .get(protect, getLabs)
  .post(protect, authorize("admin"), createLab);

router.route("/tests")
  .get(protect, getTests)
  .post(protect, authorize("admin", "staff"), createTest);

module.exports = router;
