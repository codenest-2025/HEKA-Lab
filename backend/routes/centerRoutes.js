const express = require("express");
const { getCenters, createCenter } = require("../controllers/centerController");
const { protect, authorize } = require("../middleware/authMiddleware");

const router = express.Router();

router.route("/")
  .get(protect, getCenters)
  .post(protect, authorize("admin"), createCenter);

module.exports = router;
