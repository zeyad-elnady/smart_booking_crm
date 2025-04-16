const mongoose = require("mongoose");
const Appointment = require("../models/Appointment");

// @desc    Get all appointments
// @route   GET /api/appointments
// @access  Private
const getAppointments = async (req, res) => {
   try {
      const appointments = await Appointment.find({})
         .populate("customer", "firstName lastName email")
         .populate("service", "name duration price");

      res.json(appointments);
   } catch (error) {
      res.status(500).json({ message: error.message });
   }
};

// @desc    Get a single appointment
// @route   GET /api/appointments/:id
// @access  Private
const getAppointmentById = async (req, res) => {
   try {
      const appointment = await Appointment.findById(req.params.id)
         .populate("customer", "firstName lastName email phone")
         .populate("service", "name description duration price");

      if (!appointment) {
         return res.status(404).json({ message: "Appointment not found" });
      }

      res.json(appointment);
   } catch (error) {
      res.status(500).json({ message: error.message });
   }
};

// @desc    Create an appointment
// @route   POST /api/appointments
// @access  Private
const createAppointment = async (req, res) => {
   try {
      const { customer, service, date, time, duration, notes, status } =
         req.body;

      // Create appointment with string IDs directly
      const appointmentData = {
         customer,
         service,
         date,
         time,
         duration,
         notes,
         status: status || "Waiting",
      };

      const appointment = await Appointment.create(appointmentData);

      const populatedAppointment = await Appointment.findById(appointment._id)
         .populate("customer", "firstName lastName email")
         .populate("service", "name duration price");

      res.status(201).json(populatedAppointment);
   } catch (error) {
      console.error("Appointment creation error:", error);
      res.status(400).json({ message: error.message });
   }
};

// @desc    Update an appointment
// @route   PUT /api/appointments/:id
// @access  Private
const updateAppointment = async (req, res) => {
   try {
      const { customer, service, date, time, duration, notes, status } =
         req.body;

      const appointment = await Appointment.findById(req.params.id);

      if (!appointment) {
         return res.status(404).json({ message: "Appointment not found" });
      }

      appointment.customer = customer || appointment.customer;
      appointment.service = service || appointment.service;
      appointment.date = date || appointment.date;
      appointment.time = time || appointment.time;
      appointment.duration = duration || appointment.duration;
      appointment.notes = notes !== undefined ? notes : appointment.notes;
      appointment.status = status || appointment.status;

      const updatedAppointment = await appointment.save();

      const populatedAppointment = await Appointment.findById(
         updatedAppointment._id
      )
         .populate("customer", "firstName lastName email")
         .populate("service", "name duration price");

      res.json(populatedAppointment);
   } catch (error) {
      res.status(400).json({ message: error.message });
   }
};

// @desc    Delete an appointment
// @route   DELETE /api/appointments/:id
// @access  Private
const deleteAppointment = async (req, res) => {
   try {
      const appointment = await Appointment.findById(req.params.id);

      if (!appointment) {
         return res.status(404).json({ message: "Appointment not found" });
      }

      await appointment.deleteOne();

      res.json({ message: "Appointment removed" });
   } catch (error) {
      res.status(500).json({ message: error.message });
   }
};

// @desc    Get recent appointments
// @route   GET /api/appointments/recent
// @access  Private
const getRecentAppointments = async (req, res) => {
   try {
      const appointments = await Appointment.find({})
         .sort({ date: -1, time: -1 }) // Sort by date and time in descending order
         .limit(5) // Get only the 5 most recent appointments
         .populate("customer", "firstName lastName email")
         .populate("service", "name duration price");

      res.json(appointments);
   } catch (error) {
      console.error("Error fetching recent appointments:", error);
      res.status(500).json({ message: error.message });
   }
};

module.exports = {
   getAppointments,
   getAppointmentById,
   createAppointment,
   updateAppointment,
   deleteAppointment,
   getRecentAppointments,
};
