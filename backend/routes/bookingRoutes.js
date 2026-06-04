const express = require("express");
const { createPatient, getPatients, createBooking, getBookings, updateBookingReportStatus } = require("../controllers/bookingController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(protect);

router.route("/")
  .post(createBooking)
  .get(getBookings);

router.route("/patients")
  .post(createPatient)
  .get(getPatients);

router.route("/:id/report-status")
  .patch(updateBookingReportStatus);

module.exports = router;
