const Appointment = require("../models/Appointment");
const Customer = require("../models/Customer");
const Service = require("../models/Service");

// Get dashboard statistics
const getDashboardStats = async (req, res) => {
   try {
      // Get all completed appointments with their services
      const completedAppointments = await Appointment.find({
         status: "Completed",
      }).populate("service");

      // Calculate revenue metrics
      let totalRevenue = 0;
      let validAppointments = 0;

      completedAppointments.forEach((appointment) => {
         if (appointment.service && appointment.service.price) {
            totalRevenue += appointment.service.price;
            validAppointments++;
         }
      });

      const averageRevenue =
         validAppointments > 0 ? totalRevenue / validAppointments : 0;

      // Calculate average wait time (using service durations for confirmed appointments)
      const avgWaitTimeResult = await Appointment.aggregate([
         {
            $match: { status: "Confirmed" },
         },
         {
            $lookup: {
               from: "services",
               localField: "service",
               foreignField: "_id",
               as: "serviceDetails",
            },
         },
         {
            $unwind: "$serviceDetails",
         },
         {
            $group: {
               _id: null,
               averageWaitTime: {
                  $avg: { $toInt: "$serviceDetails.duration" },
               },
            },
         },
      ]);

      // Count total unique customers
      const totalCustomers = await Customer.countDocuments();

      // Format the response
      const stats = {
         averageWaitTime: Math.round(
            avgWaitTimeResult[0]?.averageWaitTime || 0
         ),
         averageRevenue: Number(averageRevenue.toFixed(2)),
         totalRevenue: Number(totalRevenue.toFixed(2)),
         totalCustomers,
         completedAppointments: validAppointments,
      };

      console.log("Stats calculation:", {
         totalCompletedAppointments: completedAppointments.length,
         validAppointmentsWithPrice: validAppointments,
         totalRevenue,
         averageRevenue,
      });

      res.json(stats);
   } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ message: "Error fetching dashboard statistics" });
   }
};

module.exports = {
   getDashboardStats,
};
