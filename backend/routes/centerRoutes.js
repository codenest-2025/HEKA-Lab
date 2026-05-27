const express = require("express");
const { getCenters, createCenter, updateCenter, deleteCenter } = require("../controllers/centerController");
const { protect, authorize } = require("../middleware/authMiddleware");

const router = express.Router();

router.route("/")
  .get(protect, getCenters)
  .post(protect, authorize("admin"), createCenter);

router.route("/:id")
  .put(protect, authorize("admin"), updateCenter)
  .delete(protect, authorize("admin"), deleteCenter);

module.exports = router;
