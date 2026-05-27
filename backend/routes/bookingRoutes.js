const express = require("express");
const { createPatient, getPatients, createBooking, getBookings } = require("../controllers/bookingController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(protect);

router.route("/")
  .post(createBooking)
  .get(getBookings);

router.route("/patients")
  .post(createPatient)
  .get(getPatients);

module.exports = router;
