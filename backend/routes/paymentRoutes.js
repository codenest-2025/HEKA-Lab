const express = require("express");
const { recordPayment, getFinancialSummary, getPayments } = require("../controllers/paymentController");
const { protect, authorize } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(protect);

router.route("/")
  .post(authorize("admin", "agent"), recordPayment)
  .get(authorize("admin", "agent"), getPayments);

router.get("/summary", authorize("admin"), getFinancialSummary);

module.exports = router;
