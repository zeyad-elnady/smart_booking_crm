const mongoose = require("mongoose");

const appointmentSchema = new mongoose.Schema(
   {
      customer: {
         type: mongoose.Schema.Types.ObjectId,
         ref: "Customer",
         required: [true, "Customer is required"],
      },
      service: {
         type: mongoose.Schema.Types.ObjectId,
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
         enum: ["Pending", "Confirmed", "Canceled", "Completed"],
         default: "Pending",
      },
   },
   {
      timestamps: true,
      bufferTimeoutMS: 30000,
   }
);

const Appointment = mongoose.model("Appointment", appointmentSchema);

module.exports = Appointment;
