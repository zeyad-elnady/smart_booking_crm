const Appointment = require("../models/Appointment");
const Customer = require("../models/Customer");
const Service = require("../models/Service");

// Get dashboard statistics
const getDashboardStats = async (req, res) => {
   try {
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

      // Calculate average revenue (from completed appointments)
      const avgRevenueResult = await Appointment.aggregate([
         {
            $match: { status: "Completed" },
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
               averageRevenue: { $avg: { $toDouble: "$serviceDetails.price" } },
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
         averageRevenue: Number(
            (avgRevenueResult[0]?.averageRevenue || 0).toFixed(2)
         ),
         totalCustomers: totalCustomers,
      };

      res.json(stats);
   } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ message: "Error fetching dashboard statistics" });
   }
};

module.exports = {
   getDashboardStats,
};
