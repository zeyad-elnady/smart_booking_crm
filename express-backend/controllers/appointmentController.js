const mongoose = require("mongoose");
const Appointment = require("../models/Appointment");
const localDataService = require("../utils/localDataService");

// @desc    Get all appointments
// @route   GET /api/appointments
// @access  Private
const getAppointments = async (req, res) => {
   try {
      // Check if we're using MongoDB or local storage
      if (process.env.SKIP_MONGODB === "true" || !localDataService.isMongoConnected()) {
         console.log("Using local storage for fetching appointments");
         
         // Get all appointments, customers, and services
         const appointments = localDataService.find("appointments");
         const customers = localDataService.find("customers");
         const services = localDataService.find("services");
         
         // Populate appointments with customer and service details
         const populatedAppointments = appointments.map(appointment => {
            // Find related customer and service
            const customer = customers.find(c => c._id === appointment.customer) || {};
            const service = services.find(s => s._id === appointment.service) || {};
            
            // Return populated appointment
            return {
               ...appointment,
               customer: {
                  _id: customer._id,
                  firstName: customer.firstName,
                  lastName: customer.lastName,
                  email: customer.email
               },
               service: {
                  _id: service._id,
                  name: service.name,
                  duration: service.duration,
                  price: service.price
               }
            };
         });
         
         return res.json(populatedAppointments);
      }
      
      // First try to get from MongoDB
      try {
         const appointments = await Appointment.find({})
            .populate("customer", "firstName lastName email")
            .populate("service", "name duration price");
         return res.json(appointments);
      } catch (dbError) {
         console.error("MongoDB error, falling back to local storage:", dbError.message);
         
         // Get all appointments, customers, and services
         const appointments = localDataService.find("appointments");
         const customers = localDataService.find("customers");
         const services = localDataService.find("services");
         
         // Populate appointments with customer and service details
         const populatedAppointments = appointments.map(appointment => {
            // Find related customer and service
            const customer = customers.find(c => c._id === appointment.customer) || {};
            const service = services.find(s => s._id === appointment.service) || {};
            
            // Return populated appointment
            return {
               ...appointment,
               customer: {
                  _id: customer._id,
                  firstName: customer.firstName,
                  lastName: customer.lastName,
                  email: customer.email
               },
               service: {
                  _id: service._id,
                  name: service.name,
                  duration: service.duration,
                  price: service.price
               }
            };
         });
         
         return res.json(populatedAppointments);
      }
   } catch (error) {
      console.error("Error fetching appointments:", error);
      res.status(500).json({ message: error.message });
   }
};

// @desc    Get a single appointment
// @route   GET /api/appointments/:id
// @access  Private
const getAppointmentById = async (req, res) => {
   try {
      // Check if we're using MongoDB or local storage
      if (process.env.SKIP_MONGODB === "true" || !localDataService.isMongoConnected()) {
         console.log("Using local storage for fetching appointment by ID");
         
         // Find appointment in local storage
         const appointment = localDataService.findById("appointments", req.params.id);
         
         if (!appointment) {
            return res.status(404).json({ message: "Appointment not found" });
         }
         
         // Get related customer and service
         const customer = localDataService.findById("customers", appointment.customer) || {};
         const service = localDataService.findById("services", appointment.service) || {};
         
         // Return populated appointment
         const populatedAppointment = {
            ...appointment,
            customer: {
               _id: customer._id,
               firstName: customer.firstName,
               lastName: customer.lastName,
               email: customer.email,
               phone: customer.phone
            },
            service: {
               _id: service._id,
               name: service.name,
               description: service.description,
               duration: service.duration,
               price: service.price
            }
         };
         
         return res.json(populatedAppointment);
      }
      
      // First try to get from MongoDB
      try {
         const appointment = await Appointment.findById(req.params.id)
            .populate("customer", "firstName lastName email phone")
            .populate("service", "name description duration price");

         if (!appointment) {
            // Try local storage before returning 404
            const localAppointment = localDataService.findById("appointments", req.params.id);
            if (localAppointment) {
               // Get related customer and service
               const customer = localDataService.findById("customers", localAppointment.customer) || {};
               const service = localDataService.findById("services", localAppointment.service) || {};
               
               // Return populated appointment
               const populatedAppointment = {
                  ...localAppointment,
                  customer: {
                     _id: customer._id,
                     firstName: customer.firstName,
                     lastName: customer.lastName,
                     email: customer.email,
                     phone: customer.phone
                  },
                  service: {
                     _id: service._id,
                     name: service.name,
                     description: service.description,
                     duration: service.duration,
                     price: service.price
                  }
               };
               
               return res.json(populatedAppointment);
            }
            return res.status(404).json({ message: "Appointment not found" });
         }

         return res.json(appointment);
      } catch (dbError) {
         console.error("MongoDB error, falling back to local storage:", dbError.message);
         
         // Find appointment in local storage
         const appointment = localDataService.findById("appointments", req.params.id);
         
         if (!appointment) {
            return res.status(404).json({ message: "Appointment not found" });
         }
         
         // Get related customer and service
         const customer = localDataService.findById("customers", appointment.customer) || {};
         const service = localDataService.findById("services", appointment.service) || {};
         
         // Return populated appointment
         const populatedAppointment = {
            ...appointment,
            customer: {
               _id: customer._id,
               firstName: customer.firstName,
               lastName: customer.lastName,
               email: customer.email,
               phone: customer.phone
            },
            service: {
               _id: service._id,
               name: service.name,
               description: service.description,
               duration: service.duration,
               price: service.price
            }
         };
         
         return res.json(populatedAppointment);
      }
   } catch (error) {
      console.error("Error fetching appointment by ID:", error);
      res.status(500).json({ message: error.message });
   }
};

// @desc    Create an appointment
// @route   POST /api/appointments
// @access  Private
const createAppointment = async (req, res) => {
   try {
      const { customer, service, date, time, duration, notes, status } = req.body;

      // Check if we're using MongoDB or local storage
      if (process.env.SKIP_MONGODB === "true" || !localDataService.isMongoConnected()) {
         console.log("Using local storage for appointment creation");
         
         // Validate customer and service exist in local storage
         const customerData = localDataService.findById("customers", customer);
         const serviceData = localDataService.findById("services", service);
         
         if (!customerData) {
            return res.status(400).json({ message: "Customer not found" });
         }
         
         if (!serviceData) {
            return res.status(400).json({ message: "Service not found" });
         }
         
         // Create appointment in local storage
         const appointmentData = {
            _id: require('crypto').randomUUID(),
            customer,
            service,
            date,
            time,
            duration: duration || serviceData.duration,
            notes,
            status: status || "Waiting",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
         };
         
         // Save to local storage
         const savedAppointment = localDataService.create("appointments", appointmentData);
         
         // Add customer and service details for the response
         const populatedAppointment = {
            ...savedAppointment,
            customer: {
               _id: customerData._id,
               firstName: customerData.firstName,
               lastName: customerData.lastName,
               email: customerData.email
            },
            service: {
               _id: serviceData._id,
               name: serviceData.name,
               duration: serviceData.duration,
               price: serviceData.price
            }
         };
         
         return res.status(201).json(populatedAppointment);
      }

      // If using MongoDB
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
      const { customer, service, date, time, duration, notes, status } = req.body;

      // Check if we're using MongoDB or local storage
      if (process.env.SKIP_MONGODB === "true" || !localDataService.isMongoConnected()) {
         console.log("Using local storage for appointment update");
         
         // Find the appointment in local storage
         const existingAppointment = localDataService.findById("appointments", req.params.id);
         
         if (!existingAppointment) {
            return res.status(404).json({ message: "Appointment not found" });
         }
         
         // If customer is being updated, validate it exists
         let customerData = null;
         if (customer && customer !== existingAppointment.customer) {
            customerData = localDataService.findById("customers", customer);
            if (!customerData) {
               return res.status(400).json({ message: "Customer not found" });
            }
         } else {
            customerData = localDataService.findById("customers", existingAppointment.customer);
         }
         
         // If service is being updated, validate it exists
         let serviceData = null;
         if (service && service !== existingAppointment.service) {
            serviceData = localDataService.findById("services", service);
            if (!serviceData) {
               return res.status(400).json({ message: "Service not found" });
            }
         } else {
            serviceData = localDataService.findById("services", existingAppointment.service);
         }
         
         // Update appointment data
         const updatedAppointmentData = {
            ...existingAppointment,
            customer: customer || existingAppointment.customer,
            service: service || existingAppointment.service,
            date: date || existingAppointment.date,
            time: time || existingAppointment.time,
            duration: duration || existingAppointment.duration,
            notes: notes !== undefined ? notes : existingAppointment.notes,
            status: status || existingAppointment.status,
            updatedAt: new Date().toISOString()
         };
         
         // Save to local storage
         const updatedAppointment = localDataService.update("appointments", req.params.id, updatedAppointmentData);
         
         // Create populated response with customer and service details
         const populatedAppointment = {
            ...updatedAppointment,
            customer: {
               _id: customerData._id,
               firstName: customerData.firstName,
               lastName: customerData.lastName,
               email: customerData.email
            },
            service: {
               _id: serviceData._id,
               name: serviceData.name,
               duration: serviceData.duration,
               price: serviceData.price
            }
         };
         
         return res.json(populatedAppointment);
      }

      // If using MongoDB
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
      // Check if we're using MongoDB or local storage
      if (process.env.SKIP_MONGODB === "true" || !localDataService.isMongoConnected()) {
         console.log("Using local storage for appointment deletion");
         
         // Find appointment in local storage
         const appointment = localDataService.findById("appointments", req.params.id);
         
         if (!appointment) {
            return res.status(404).json({ message: "Appointment not found" });
         }
         
         // Delete from local storage
         const success = localDataService.remove("appointments", req.params.id);
         
         if (success) {
            return res.json({ message: "Appointment removed" });
         } else {
            return res.status(500).json({ message: "Failed to delete appointment" });
         }
      }
      
      // If using MongoDB
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
      console.log('Fetching recent appointments...');
      
      // Check if we're using MongoDB or local storage
      if (process.env.SKIP_MONGODB === "true" || !localDataService.isMongoConnected()) {
         console.log("Using local storage for recent appointments");
         
         // Get data from local storage
         const appointments = localDataService.find("appointments");
         const customers = localDataService.find("customers");
         const services = localDataService.find("services");
         
         // Sort appointments by date (newest first)
         const sortedAppointments = [...appointments].sort(
            (a, b) => new Date(b.date) - new Date(a.date)
         );
         
         // Take only the 3 most recent
         const recentAppointments = sortedAppointments.slice(0, 3);
         
         // Populate with customer and service details
         const populatedAppointments = recentAppointments.map(appointment => {
            // Find related customer and service
            const customer = customers.find(c => c._id === appointment.customer) || {};
            const service = services.find(s => s._id === appointment.service) || {};
            
            // Return populated appointment
            return {
               ...appointment,
               customer: {
                  _id: customer._id,
                  firstName: customer.firstName,
                  lastName: customer.lastName,
                  email: customer.email
               },
               service: {
                  _id: service._id,
                  name: service.name,
                  duration: service.duration,
                  price: service.price
               }
            };
         });
         
         console.log(`Using local storage: retrieved ${populatedAppointments.length} recent appointments`);
         return res.json(populatedAppointments);
      }
      
      // First try to get from MongoDB
      try {
         // Create the database query with a reduced limit - without timeout
         const appointments = await Appointment.find({})
            .sort({ date: -1, time: -1 })
            .limit(3)
            .populate("customer", "firstName lastName email")
            .populate("service", "name duration price");
         
         console.log(`Successfully retrieved ${appointments.length} recent appointments`);
         return res.json(appointments);
      } catch (dbError) {
         console.error("MongoDB error, falling back to local storage:", dbError.message);
         
         // Get data from local storage
         const appointments = localDataService.find("appointments");
         const customers = localDataService.find("customers");
         const services = localDataService.find("services");
         
         // Sort appointments by date (newest first)
         const sortedAppointments = [...appointments].sort(
            (a, b) => new Date(b.date) - new Date(a.date)
         );
         
         // Take only the 3 most recent
         const recentAppointments = sortedAppointments.slice(0, 3);
         
         // Populate with customer and service details
         const populatedAppointments = recentAppointments.map(appointment => {
            // Find related customer and service
            const customer = customers.find(c => c._id === appointment.customer) || {};
            const service = services.find(s => s._id === appointment.service) || {};
            
            // Return populated appointment
            return {
               ...appointment,
               customer: {
                  _id: customer._id,
                  firstName: customer.firstName,
                  lastName: customer.lastName,
                  email: customer.email
               },
               service: {
                  _id: service._id,
                  name: service.name,
                  duration: service.duration,
                  price: service.price
               }
            };
         });
         
         console.log(`Using local storage: retrieved ${populatedAppointments.length} recent appointments`);
         return res.json(populatedAppointments);
      }
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
