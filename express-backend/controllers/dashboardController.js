const Appointment = require("../models/Appointment");
const Customer = require("../models/Customer");
const Service = require("../models/Service");

// Get dashboard statistics
const getDashboardStats = async (req, res) => {
   try {
      // Get today's date at start (00:00:00) and end (23:59:59)
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      // Calculate week boundaries (Saturday to Friday)
      const currentDay = today.getDay(); // 0 = Sunday, 6 = Saturday
      const startOfWeek = new Date(today);
      const endOfWeek = new Date(today);

      if (currentDay === 5) {
         // Friday
         // Go back to the previous Saturday
         startOfWeek.setDate(today.getDate() - 6);
         // End of week is today (Friday) at 23:59:59
         endOfWeek.setHours(23, 59, 59, 999);
      } else if (currentDay === 6) {
         // Saturday
         // Today is the start of a new week
         startOfWeek.setHours(0, 0, 0, 0);
         // End of week is next Friday
         endOfWeek.setDate(today.getDate() + 6);
         endOfWeek.setHours(23, 59, 59, 999);
      } else {
         // Sunday to Thursday
         // Go back to the previous Saturday
         const daysToLastSaturday = currentDay + 1;
         startOfWeek.setDate(today.getDate() - daysToLastSaturday);
         // Set end to the upcoming Friday
         const daysToFriday = 5 - currentDay;
         endOfWeek.setDate(today.getDate() + daysToFriday);
         endOfWeek.setHours(23, 59, 59, 999);
      }

      // Get start and end of month
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      endOfMonth.setHours(23, 59, 59, 999);

      console.log("Date ranges for revenue calculation:", {
         today: today.toISOString(),
         tomorrow: tomorrow.toISOString(),
         currentDay,
         weekRange: {
            start: startOfWeek.toISOString(),
            end: endOfWeek.toISOString(),
            dayName: [
               "Sunday",
               "Monday",
               "Tuesday",
               "Wednesday",
               "Thursday",
               "Friday",
               "Saturday",
            ][currentDay],
         },
         monthRange: {
            start: startOfMonth.toISOString(),
            end: endOfMonth.toISOString(),
         },
      });

      // Get stats using aggregation pipeline
      const stats = await Appointment.aggregate([
         {
            $match: {
               date: {
                  $gte: startOfMonth,
                  $lte: endOfMonth,
               },
               status: "Completed",
            },
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
            $unwind: {
               path: "$serviceDetails",
               preserveNullAndEmptyArrays: true,
            },
         },
         {
            $facet: {
               dailyRevenue: [
                  {
                     $match: {
                        date: {
                           $gte: today,
                           $lt: tomorrow,
                        },
                     },
                  },
                  {
                     $group: {
                        _id: null,
                        totalRevenue: {
                           $sum: {
                              $convert: {
                                 input: "$serviceDetails.price",
                                 to: "double",
                                 onError: 0,
                                 onNull: 0,
                              },
                           },
                        },
                        completedCount: { $sum: 1 },
                     },
                  },
               ],
               weeklyRevenue: [
                  {
                     $match: {
                        date: {
                           $gte: startOfWeek,
                           $lte: endOfWeek,
                        },
                     },
                  },
                  {
                     $group: {
                        _id: null,
                        totalRevenue: {
                           $sum: {
                              $convert: {
                                 input: "$serviceDetails.price",
                                 to: "double",
                                 onError: 0,
                                 onNull: 0,
                              },
                           },
                        },
                        completedCount: { $sum: 1 },
                     },
                  },
               ],
               monthlyRevenue: [
                  {
                     $match: {
                        date: {
                           $gte: startOfMonth,
                           $lte: endOfMonth,
                        },
                     },
                  },
                  {
                     $group: {
                        _id: null,
                        totalRevenue: {
                           $sum: {
                              $convert: {
                                 input: "$serviceDetails.price",
                                 to: "double",
                                 onError: 0,
                                 onNull: 0,
                              },
                           },
                        },
                        completedCount: { $sum: 1 },
                     },
                  },
               ],
               waitTime: [
                  {
                     $match: {
                        date: {
                           $gte: today,
                           $lt: tomorrow,
                        },
                        status: "Confirmed",
                        "serviceDetails.duration": { $exists: true },
                     },
                  },
                  {
                     $addFields: {
                        durationNumber: {
                           $convert: {
                              input: {
                                 $replaceAll: {
                                    input: "$serviceDetails.duration",
                                    find: " minutes",
                                    replacement: "",
                                 },
                              },
                              to: "int",
                              onError: 0,
                              onNull: 0,
                           },
                        },
                     },
                  },
                  {
                     $group: {
                        _id: null,
                        totalWaitTime: { $sum: "$durationNumber" },
                        confirmedCount: { $sum: 1 },
                     },
                  },
               ],
            },
         },
      ]);

      // Get total customers
      const totalCustomers = await Customer.countDocuments();

      // Extract values from aggregation results
      const dailyRevenue = stats[0]?.dailyRevenue[0] || {
         totalRevenue: 0,
         completedCount: 0,
      };
      const weeklyRevenue = stats[0]?.weeklyRevenue[0] || {
         totalRevenue: 0,
         completedCount: 0,
      };
      const monthlyRevenue = stats[0]?.monthlyRevenue[0] || {
         totalRevenue: 0,
         completedCount: 0,
      };
      const waitTime = stats[0]?.waitTime[0] || {
         totalWaitTime: 0,
         confirmedCount: 0,
      };

      // Calculate averages
      const averageWaitTime =
         waitTime.confirmedCount > 0
            ? Math.round(waitTime.totalWaitTime / waitTime.confirmedCount)
            : 0;

      // Debug logging
      console.log("Revenue calculations:", {
         daily: {
            revenue: dailyRevenue.totalRevenue,
            count: dailyRevenue.completedCount,
         },
         weekly: {
            revenue: weeklyRevenue.totalRevenue,
            count: weeklyRevenue.completedCount,
            period: `${startOfWeek.toLocaleDateString()} to ${endOfWeek.toLocaleDateString()}`,
         },
         monthly: {
            revenue: monthlyRevenue.totalRevenue,
            count: monthlyRevenue.completedCount,
            period: `${startOfMonth.toLocaleDateString()} to ${endOfMonth.toLocaleDateString()}`,
         },
      });

      // Prepare response
      const response = {
         averageWaitTime,
         totalRevenue: Number(dailyRevenue.totalRevenue.toFixed(2)),
         weeklyRevenue: Number(weeklyRevenue.totalRevenue.toFixed(2)),
         monthlyRevenue: Number(monthlyRevenue.totalRevenue.toFixed(2)),
         totalCustomers,
         completedAppointments: dailyRevenue.completedCount,
      };

      res.json(response);
   } catch (error) {
      console.error("Error in getDashboardStats:", {
         message: error.message,
         stack: error.stack,
      });
      res.status(500).json({
         message: "Error fetching dashboard statistics",
         error: error.message,
      });
   }
};

const getRevenueStats = async (req, res) => {
   try {
      const { period = "month" } = req.query;
      const now = new Date();
      let startDate;
      let groupBy;
      let format;

      switch (period) {
         case "day":
            startDate = new Date(
               now.getFullYear(),
               now.getMonth(),
               now.getDate() - 30
            ); // Last 30 days
            groupBy = { $dateToString: { format: "%Y-%m-%d", date: "$date" } };
            format = "%Y-%m-%d";
            break;
         case "week":
            startDate = new Date(
               now.getFullYear(),
               now.getMonth(),
               now.getDate() - 90
            ); // Last 90 days
            groupBy = {
               $dateToString: {
                  format: "%Y-W%V",
                  date: "$date",
               },
            };
            format = "%Y-W%V";
            break;
         case "month":
         default:
            startDate = new Date(now.getFullYear() - 1, now.getMonth(), 1); // Last 12 months
            groupBy = {
               $dateToString: {
                  format: "%Y-%m",
                  date: "$date",
               },
            };
            format = "%Y-%m";
      }

      const pipeline = [
         {
            $match: {
               date: { $gte: startDate },
               status: "Completed",
            },
         },
         {
            $lookup: {
               from: "services",
               localField: "serviceId",
               foreignField: "_id",
               as: "service",
            },
         },
         {
            $unwind: "$service",
         },
         {
            $group: {
               _id: groupBy,
               revenue: { $sum: { $toDouble: "$service.price" } },
               count: { $sum: 1 },
            },
         },
         {
            $sort: { _id: 1 },
         },
      ];

      console.log("Revenue Stats Pipeline:", JSON.stringify(pipeline, null, 2));

      const revenueStats = await Appointment.aggregate(pipeline);

      console.log(
         "Revenue Stats Results:",
         JSON.stringify(revenueStats, null, 2)
      );

      res.json({
         success: true,
         data: revenueStats.map((stat) => ({
            date: stat._id,
            revenue: stat.revenue,
            count: stat.count,
         })),
      });
   } catch (error) {
      console.error("Error getting revenue stats:", error);
      res.status(500).json({
         success: false,
         message: "Error retrieving revenue statistics",
         error: error.message,
      });
   }
};

module.exports = {
   getDashboardStats,
   getRevenueStats,
};
