const Customer = require("../models/Customer");
const Appointment = require("../models/Appointment");
const localDataService = require("../utils/localDataService");
const mongoose = require("mongoose");

// @desc    Get all customers
// @route   GET /api/customers
// @access  Private
const getCustomers = async (req, res) => {
   try {
      // Use local data service directly
      const customers = localDataService.find("customers");
      return res.json(customers);
   } catch (error) {
      console.error("Error fetching customers:", error);
      res.status(500).json({ message: error.message });
   }
};

// @desc    Get a single customer
// @route   GET /api/customers/:id
// @access  Private
const getCustomerById = async (req, res) => {
   try {
      const customerId = req.params.id;
      console.log(`[Backend] Requested customer ID: ${customerId}`);

      // Use local data service directly
      const customer = localDataService.findById("customers", customerId);
      
      if (!customer) {
         console.log(`[Backend] Customer with ID ${customerId} not found`);
         return res.status(404).json({ message: "Customer not found" });
      }

      // Log the customer data we're sending back
      console.log(`[Backend] Found customer:`, JSON.stringify(customer, null, 2));
      console.log(`[Backend] Fields: firstName=${customer.firstName}, lastName=${customer.lastName}, email=${customer.email}, phone=${customer.phone}`);
      
      return res.json(customer);
   } catch (error) {
      console.error("[Backend] Error fetching customer:", error);
      return res.status(500).json({ message: error.message });
   }
};

// @desc    Create a customer
// @route   POST /api/customers
// @access  Private
const createCustomer = async (req, res) => {
   try {
      const { firstName, lastName, email, phone, notes } = req.body;

      // Use local data service directly
      // Check if customer with this email already exists in local storage
      const customersByEmail = localDataService.find("customers", { email });

      if (customersByEmail.length > 0) {
         return res
            .status(400)
            .json({ message: "Customer with this email already exists" });
      }

      // Validate and check for duplicate phone number
      if (phone) {
         console.log(`Checking for duplicate phone: ${phone}`);
         const customersByPhone = localDataService.find("customers", { phone });
         
         if (customersByPhone.length > 0) {
            console.log(`Found duplicate phone: ${phone}`);
            return res
               .status(400)
               .json({ message: "Customer with this phone number already exists" });
         }
      }

      const newCustomer = localDataService.create("customers", {
         firstName,
         lastName,
         email,
         phone,
         notes,
         user: req.user ? req.user._id : null,
      });

      return res.status(201).json(newCustomer);
   } catch (error) {
      console.error("Customer creation error:", error);
      return res.status(400).json({ message: error.message });
   }
};

// @desc    Update a customer
// @route   PUT /api/customers/:id
// @access  Private
const updateCustomer = async (req, res) => {
   try {
      const { firstName, lastName, email, phone, notes } = req.body;
      const customerId = req.params.id;

      console.log(`Updating customer ${customerId} with data:`, req.body);

      // Use local data service directly
      const customer = localDataService.findById("customers", customerId);

      if (!customer) {
         console.log(`Customer with ID ${customerId} not found`);
         return res.status(404).json({ message: "Customer not found" });
      }

      // If email is changed, check if the new email is already in use
      if (email && email !== customer.email) {
         console.log(`Email changed from ${customer.email} to ${email}, checking for duplicates`);
         const customers = localDataService.find("customers", { email });

         if (customers.length > 0) {
            console.log(`Email ${email} already in use by another customer`);
            return res
               .status(400)
               .json({ message: "Customer with this email already exists" });
         }
      }

      // Update the customer
      const updateData = {
         firstName: firstName || customer.firstName,
         lastName: lastName || customer.lastName,
         email: email || customer.email,
         phone: phone !== undefined ? phone : customer.phone,
         notes: notes !== undefined ? notes : customer.notes,
      };

      console.log(`Applying update with data:`, updateData);
      const updatedCustomer = localDataService.update(
         "customers",
         customerId,
         updateData
      );

      console.log(`Customer updated successfully:`, updatedCustomer);
      return res.json(updatedCustomer);
   } catch (error) {
      console.error("Error updating customer:", error);
      return res.status(500).json({ message: error.message });
   }
};

// @desc    Delete a customer
// @route   DELETE /api/customers/:id
// @access  Private
const deleteCustomer = async (req, res) => {
   try {
      const customerId = req.params.id;
      const { confirm } = req.query;

      // Check if MongoDB is connected
      if (!localDataService.isMongoConnected()) {
         // Use local data service as fallback
         console.log("MongoDB disconnected, using local data storage");
         return handleLocalDelete(customerId, confirm, res);
      }

      const customer = await Customer.findById(customerId);

      if (!customer) {
         return res.status(404).json({ message: "Customer not found" });
      }

      // If no confirmation provided, return the count of affected appointments
      if (!confirm) {
         const appointmentCount = await Appointment.countDocuments({
            customer: customerId,
         });
         return res.status(200).json({
            message: "Confirmation required",
            affectedAppointments: appointmentCount,
            customer: customer,
         });
      }

      // If confirmation is provided, proceed with deletion
      if (confirm === "true") {
         try {
            // First delete all appointments associated with this customer
            console.log("Deleting associated appointments...");
            await Appointment.deleteMany({ customer: customerId });

            // Then delete the customer
            console.log("Deleting customer...");
            await Customer.findByIdAndDelete(customerId);

            // Also delete from local storage for consistency
            try {
               localDataService.remove("customers", customerId);

               // Delete associated appointments from local storage
               const localAppointments = localDataService.find("appointments");
               const customerAppointments = localAppointments.filter(
                  (apt) => apt.customer === customerId
               );
               customerAppointments.forEach((apt) => {
                  localDataService.remove("appointments", apt._id);
               });
            } catch (localError) {
               console.error("Error updating local storage:", localError);
               // Continue even if local storage update fails
            }

            return res.json({
               success: true,
               message: "Customer and associated appointments removed",
            });
         } catch (error) {
            console.error("Error during deletion process:", error);
            throw error;
         }
      } else {
         return res.status(400).json({ message: "Invalid confirmation" });
      }
   } catch (error) {
      console.error("Error deleting customer:", error);
      return res.status(500).json({
         message: "Error deleting customer",
         error: error.message,
      });
   }
};

// Helper function to handle local deletion
const handleLocalDelete = (customerId, confirm, res) => {
   try {
      const customer = localDataService.findById("customers", customerId);

      if (!customer) {
         return res.status(404).json({ message: "Customer not found" });
      }

      // If no confirmation provided, return the count of affected appointments
      if (!confirm) {
         const appointments = localDataService.find("appointments");
         const appointmentCount = appointments.filter(
            (apt) => apt.customer === customerId
         ).length;
         return res.status(200).json({
            message: "Confirmation required",
            affectedAppointments: appointmentCount,
            customer: customer,
         });
      }

      // If confirmation is provided, proceed with deletion
      if (confirm === "true") {
         // First remove all appointments associated with this customer
         const appointments = localDataService.find("appointments");
         appointments.forEach((appointment) => {
            if (appointment.customer === customerId) {
               localDataService.remove("appointments", appointment._id);
            }
         });

         // Then remove the customer
         const success = localDataService.remove("customers", customerId);

         if (!success) {
            return res.status(400).json({ message: "Error removing customer" });
         }

         return res.json({
            message: "Customer and associated appointments removed",
         });
      } else {
         return res.status(400).json({ message: "Invalid confirmation" });
      }
   } catch (error) {
      console.error("Error in local delete:", error);
      return res.status(500).json({
         message: "Error deleting customer",
         error: error.message,
      });
   }
};

module.exports = {
   getCustomers,
   getCustomerById,
   createCustomer,
   updateCustomer,
   deleteCustomer,
};
