const express = require("express");
const router = express.Router();
const {
   getAppointments,
   getAppointmentById,
   createAppointment,
   updateAppointment,
   deleteAppointment,
   getRecentAppointments,
} = require("../controllers/appointmentController");
const { protect } = require("../middleware/authMiddleware");
const mongoose = require("mongoose");

// Route: /api/appointments
router
   .route("/")
   .get(protect, getAppointments)
   .post(protect, createAppointment);

// Route: /api/appointments/recent
router.get("/recent", protect, getRecentAppointments);

// Route: /api/appointments/:id
router
   .route("/:id")
   .get(protect, getAppointmentById)
   .put(protect, updateAppointment)
   .delete(protect, deleteAppointment);

module.exports = router;
