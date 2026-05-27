const express = require("express");
const { loginUser, registerUser, getUserProfile, getAgents, getStaff, updateUser, deleteUser } = require("../controllers/authController");
const { protect, authorize } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/login", loginUser);
router.post("/register", registerUser);
router.get("/profile", protect, getUserProfile);
router.get("/agents", protect, getAgents);
router.get("/staff", protect, authorize("admin"), getStaff);

router.route("/users/:id")
  .put(protect, authorize("admin"), updateUser)
  .delete(protect, authorize("admin"), deleteUser);

module.exports = router;
