const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: [true, 'First name is required'],
      trim: true,
    },
    lastName: {
      type: String,
      required: [true, 'Last name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        'Please enter a valid email address',
      ],
    },
    phone: {
      type: String,
      trim: true,
    },
    notes: {
      type: String,
      trim: true,
    },
    age: {
      type: Number,
      min: 0,
      max: 120,
    },
    medicalConditions: [
      {
        name: {
          type: String,
          trim: true,
        },
        details: {
          type: String,
          trim: true,
        },
      },
    ],
    allergies: [
      {
        name: {
          type: String,
          trim: true,
        },
        severity: {
          type: String,
          enum: ['Mild', 'Moderate', 'Severe'],
          default: 'Moderate',
        },
      },
    ],
    medicalNotes: {
      type: String,
      trim: true,
    },
    customFields: [
      {
        name: {
          type: String,
          required: true,
          trim: true,
        },
        value: {
          type: String,
          trim: true,
        },
        fieldType: {
          type: String,
          enum: ['text', 'number', 'date', 'boolean', 'select'],
          default: 'text',
        },
        options: [String],
      },
    ],
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false,
    },
  },
  {
    timestamps: true,
  }
);

customerSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`;
});

const Customer = mongoose.model('Customer', customerSchema);

module.exports = Customer; 