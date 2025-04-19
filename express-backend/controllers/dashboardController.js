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
                  {
                     $project: {
                        _id: 0,
                        averageWaitTime: {
                           $cond: {
                              if: { $gt: ["$confirmedCount", 0] },
                              then: {
                                 $round: [
                                    {
                                       $divide: [
                                          "$totalWaitTime",
                                          "$confirmedCount",
                                       ],
                                    },
                                 ],
                              },
                              else: 0,
                           },
                        },
                        confirmedCount: 1,
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
         averageWaitTime: 0,
         confirmedCount: 0,
      };

      // Debug logging for wait time calculation
      console.log("Wait time calculation:", {
         waitTimeStats: waitTime,
         confirmedAppointments: waitTime.confirmedCount,
      });

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
         averageWaitTime: waitTime.averageWaitTime,
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

module.exports = {
   getDashboardStats,
};
