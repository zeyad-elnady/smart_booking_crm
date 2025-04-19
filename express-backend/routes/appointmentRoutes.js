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
   .get(getAppointments)
   .post(createAppointment);

// Route: /api/appointments/recent
router.get("/recent", getRecentAppointments);

// Route: /api/appointments/:id
router
   .route("/:id")
   .get(getAppointmentById)
   .put(updateAppointment)
   .delete(deleteAppointment);

module.exports = router;
