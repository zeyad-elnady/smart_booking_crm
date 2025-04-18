const Service = require("../models/Service");
const Appointment = require("../models/Appointment");
const mongoose = require("mongoose");

// @desc    Get all services
// @route   GET /api/services
// @access  Public
const getServices = async (req, res) => {
   try {
      const services = await Service.find({});
      res.json(services);
   } catch (error) {
      console.error("Error fetching services:", error);
      res.status(500).json({ message: error.message });
   }
};

// @desc    Get a single service
// @route   GET /api/services/:id
// @access  Public
const getServiceById = async (req, res) => {
   try {
      const service = await Service.findById(req.params.id);

      if (!service) {
         return res.status(404).json({ message: "Service not found" });
      }

      res.json(service);
   } catch (error) {
      console.error("Error fetching service by ID:", error);
      res.status(500).json({ message: error.message });
   }
};

// @desc    Create a service
// @route   POST /api/services
// @access  Private
const createService = async (req, res) => {
   try {
      const { name, description, duration, price, category, isActive } =
         req.body;

      // Log the received data
      console.log("Attempting to create service with data:", {
         name,
         description,
         duration,
         price,
         category,
         isActive,
      });

      // Validate required fields
      const requiredFields = [
         "name",
         "description",
         "duration",
         "price",
         "category",
      ];
      const missingFields = requiredFields.filter((field) => !req.body[field]);

      if (missingFields.length > 0) {
         return res.status(400).json({
            message: `Missing required fields: ${missingFields.join(", ")}`,
            receivedData: req.body,
         });
      }

      // Convert price to number and validate
      const numericPrice = Number(price);
      if (isNaN(numericPrice) || numericPrice < 0) {
         return res.status(400).json({
            message: "Price must be a valid non-negative number",
            receivedData: req.body,
         });
      }

      const service = await Service.create({
         name,
         description,
         duration,
         price: numericPrice,
         category,
         isActive: isActive !== undefined ? isActive : true,
      });

      console.log("Service created successfully:", service);
      res.status(201).json(service);
   } catch (error) {
      console.error("Error creating service:", error);
      if (error.name === "ValidationError") {
         return res.status(400).json({
            message: "Validation Error",
            errors: Object.values(error.errors).map((err) => err.message),
            receivedData: req.body,
         });
      }
      res.status(400).json({
         message: error.message,
         receivedData: req.body,
      });
   }
};

// @desc    Update a service
// @route   PUT /api/services/:id
// @access  Private
const updateService = async (req, res) => {
   try {
      const { price, ...otherFields } = req.body;

      // If price is being updated, convert it to number and validate
      let updateData = { ...otherFields };
      if (price !== undefined) {
         const numericPrice = Number(price);
         if (isNaN(numericPrice) || numericPrice < 0) {
            return res.status(400).json({
               message: "Price must be a valid non-negative number",
               receivedData: req.body,
            });
         }
         updateData.price = numericPrice;
      }

      const service = await Service.findByIdAndUpdate(
         req.params.id,
         updateData,
         {
            new: true,
            runValidators: true,
         }
      );

      if (!service) {
         return res.status(404).json({ message: "Service not found" });
      }

      res.json(service);
   } catch (error) {
      console.error("Error updating service:", error);
      res.status(400).json({ message: error.message });
   }
};

// @desc    Delete a service
// @route   DELETE /api/services/:id
// @access  Private
const deleteService = async (req, res) => {
   try {
      const { id } = req.params;
      const { confirm } = req.query;

      // First check if service exists
      const service = await Service.findById(id);
      if (!service) {
         return res.status(404).json({ message: "Service not found" });
      }

      // If no confirmation provided, return the count of affected appointments
      if (!confirm) {
         const appointmentCount = await Appointment.countDocuments({
            service: id,
         });
         return res.status(200).json({
            message: "Confirmation required",
            affectedAppointments: appointmentCount,
            service: service,
         });
      }

      // If confirmation is provided, proceed with deletion
      if (confirm === "true") {
         try {
            // Delete all appointments associated with this service
            await Appointment.deleteMany({ service: id });

            // Delete the service
            await Service.findByIdAndDelete(id);

            res.status(200).json({
               message:
                  "Service and associated appointments deleted successfully",
            });
         } catch (error) {
            console.error("Error during deletion:", error);
            throw error;
         }
      } else {
         res.status(400).json({ message: "Invalid confirmation" });
      }
   } catch (error) {
      console.error("Error deleting service:", error);
      res.status(500).json({
         message: "Error deleting service",
         error: error.message,
      });
   }
};

module.exports = {
   getServices,
   getServiceById,
   createService,
   updateService,
   deleteService,
};
