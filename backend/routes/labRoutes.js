const express = require("express");
const { getLabs, createLab, getTests, createTest, updateTest, deleteTest, updateLab, deleteLab } = require("../controllers/labController");
const { protect, authorize } = require("../middleware/authMiddleware");

const router = express.Router();

router.route("/")
  .get(protect, getLabs)
  .post(protect, authorize("admin"), createLab);

router.route("/tests")
  .get(protect, getTests)
  .post(protect, authorize("admin", "staff"), createTest);

router.route("/tests/:id")
  .put(protect, authorize("admin"), updateTest)
  .delete(protect, authorize("admin"), deleteTest);

router.route("/:id")
  .put(protect, authorize("admin"), updateLab)
  .delete(protect, authorize("admin"), deleteLab);

module.exports = router;
