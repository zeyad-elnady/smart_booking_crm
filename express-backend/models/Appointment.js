const mongoose = require("mongoose");

const appointmentSchema = new mongoose.Schema(
   {
      customer: {
         type: String,
         ref: "Customer",
         required: [true, "Customer is required"],
      },
      service: {
         type: String,
         ref: "Service",
         required: [true, "Service is required"],
      },
      date: {
         type: Date,
         required: [true, "Date is required"],
      },
      time: {
         type: String,
         required: [true, "Time is required"],
      },
      duration: {
         type: String,
         required: [true, "Duration is required"],
      },
      notes: {
         type: String,
         trim: true,
      },
      status: {
         type: String,
         enum: ["Waiting", "Cancelled", "Completed"],
         default: "Waiting",
      },
   },
   {
      timestamps: true,
   }
);

const Appointment = mongoose.model("Appointment", appointmentSchema);

module.exports = Appointment;
