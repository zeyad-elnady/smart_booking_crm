const mongoose = require("mongoose");

const serviceSchema = new mongoose.Schema(
   {
      name: {
         type: String,
         required: [true, "Service name is required"],
         trim: true,
      },
      description: {
         type: String,
         required: [true, "Description is required"],
         trim: true,
      },
      duration: {
         type: String,
         required: [true, "Duration is required"],
         trim: true,
      },
      price: {
         type: Number,
         required: [true, "Price is required"],
         min: [0, "Price cannot be negative"],
      },
      staffCount: {
         type: Number,
         default: 1,
         min: [1, "At least one staff member must be assigned to the service"],
      },
      category: {
         type: String,
         required: [true, "Category is required"],
         trim: true,
      },
      isActive: {
         type: Boolean,
         default: true,
      },
   },
   {
      timestamps: true,
   }
);

const Service = mongoose.model("Service", serviceSchema);

module.exports = Service;
