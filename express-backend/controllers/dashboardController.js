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

      // Get all today's appointments with populated service details
      const todaysAppointments = await Appointment.find({
         date: {
            $gte: today,
            $lt: tomorrow,
         },
      }).populate("service");

      // Calculate revenue from completed appointments and wait time from confirmed appointments
      let totalRevenue = 0;
      let completedCount = 0;
      let totalWaitTime = 0;
      let confirmedCount = 0;

      for (const appointment of todaysAppointments) {
         try {
            // Calculate revenue from completed appointments
            if (
               appointment.status === "Completed" &&
               appointment.service?.price
            ) {
               totalRevenue += Number(appointment.service.price);
               completedCount++;
            }

            // Calculate wait time from confirmed appointments
            if (appointment.status === "Confirmed" && appointment.duration) {
               // Extract numeric value from duration string
               const durationNum = parseInt(
                  appointment.duration.replace(/\D/g, "")
               );
               if (!isNaN(durationNum) && durationNum > 0) {
                  totalWaitTime += durationNum;
                  confirmedCount++;
               }
            }
         } catch (err) {
            console.error("Error processing appointment:", err);
            // Continue with next appointment
         }
      }

      // Get total customers
      const totalCustomers = await Customer.countDocuments();

      // Calculate averages
      const averageWaitTime =
         confirmedCount > 0 ? Math.round(totalWaitTime / confirmedCount) : 0;
      const averageRevenue =
         completedCount > 0 ? totalRevenue / completedCount : 0;

      // Prepare response
      const stats = {
         averageWaitTime,
         totalRevenue: Number(totalRevenue.toFixed(2)),
         averageRevenue: Number(averageRevenue.toFixed(2)),
         totalCustomers,
         completedAppointments: completedCount,
      };

      // Debug logging
      console.log("Stats calculation details:", {
         date: today.toISOString().split("T")[0],
         totalAppointments: todaysAppointments.length,
         completedCount,
         confirmedCount,
         totalRevenue,
         totalWaitTime,
         averageWaitTime,
         confirmedAppointments: todaysAppointments
            .filter((a) => a.status === "Confirmed")
            .map((a) => ({
               id: a._id,
               duration: a.duration,
               serviceName: a.service?.name,
            })),
      });

      res.json(stats);
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
